/**
 * PrescriptiveAnalysisWatcher
 *
 * Real-time auto-generation of prescriptive analysis.
 *
 * The mobile app writes category_results DIRECTLY to MongoDB (it does not POST to
 * the web API), so the inline IntegrationTriggerService that runs on web-side writes
 * never fires for mobile submissions. This watcher tails a MongoDB change stream on
 * the category_results collection and runs the SAME IntegrationTriggerService for any
 * relevant insert/update — giving teachers the "finish on mobile -> analysis is just
 * there" experience without a 5-minute wait.
 *
 * Safety:
 *  - Event-driven (no polling waste).
 *  - Only reacts to inserts and updates that actually touch `categories` (real
 *    assessment progress), NOT the periodic fix-service's stat-only writes
 *    (overallScore/completedCategories/updatedAt) — so it cannot storm or loop.
 *  - Reuses IntegrationTriggerService gating (existing-analysis + regeneration-needed
 *    checks) so it is idempotent.
 *  - Debounced per record and bounded to one in-flight generation per record.
 *  - Auto-reconnects on stream errors; the 5-minute AutoProcessingService poller
 *    remains the safety net for anything missed during a disconnect.
 */

const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
const IntegrationTriggerService = require('./PrescriptiveAnalytics/integrationTriggerService');

class PrescriptiveAnalysisWatcher {
  static changeStream = null;
  static recentlyProcessed = new Map(); // categoryResultId -> last processed ms (debounce)
  static inFlight = new Set();           // categoryResultIds currently generating
  static reconnectTimer = null;
  static DEBOUNCE_MS = 15000;

  static start() {
    try {
      if (this.changeStream) return; // already running

      const pipeline = [
        { $match: { operationType: { $in: ['insert', 'update', 'replace'] } } }
      ];

      this.changeStream = CategoryResult.watch(pipeline, { fullDocument: 'updateLookup' });
      this.changeStream.on('change', (change) => { this.handleChange(change).catch(() => {}); });
      this.changeStream.on('error', (err) => this.handleError(err));

      console.log('[ANALYSIS WATCHER] 👀 Real-time prescriptive analysis watcher started on category_results');
    } catch (err) {
      console.warn('[ANALYSIS WATCHER] ⚠️ Could not start change stream (5-min poller still covers this):', err.message);
      this.scheduleReconnect();
    }
  }

  /**
   * Only react to changes that represent real assessment progress. Inserts/replaces
   * always count; for updates we require a `categories` field to have changed, which
   * excludes the fix-service's stat-only writes (overallScore/completedCategories/updatedAt).
   */
  static isMeaningfulChange(change) {
    if (change.operationType !== 'update') return true;
    const fields = change.updateDescription && change.updateDescription.updatedFields;
    if (!fields) return true;
    return Object.keys(fields).some(k => k === 'categories' || k.startsWith('categories.'));
  }

  static async handleChange(change) {
    if (!this.isMeaningfulChange(change)) return;

    const doc = change.fullDocument;
    if (!doc || !doc._id || !doc.studentId) return;

    // Skip fresh placeholder records (e.g. created by progression) with nothing to analyze yet.
    const hasCompletedCategory = Array.isArray(doc.categories) &&
      doc.categories.some(cat => cat && cat.isCompleted === true);
    if (!hasCompletedCategory) return;

    const key = doc._id.toString();
    const now = Date.now();

    if (now - (this.recentlyProcessed.get(key) || 0) < this.DEBOUNCE_MS) return; // debounce
    if (this.inFlight.has(key)) return;                                          // already generating

    this.recentlyProcessed.set(key, now);
    this.inFlight.add(key);
    this.pruneDebounceMap();

    try {
      await IntegrationTriggerService.triggerPrescriptiveAnalysis(doc);
      console.log(`[ANALYSIS WATCHER] ✅ Processed category_result ${key} for student ${doc.studentId}`);
    } catch (err) {
      console.warn(`[ANALYSIS WATCHER] ⚠️ Trigger failed for ${key} (poller will retry):`, err.message);
    } finally {
      this.inFlight.delete(key);
    }
  }

  static pruneDebounceMap() {
    if (this.recentlyProcessed.size < 500) return;
    const cutoff = Date.now() - this.DEBOUNCE_MS;
    for (const [k, t] of this.recentlyProcessed) {
      if (t < cutoff) this.recentlyProcessed.delete(k);
    }
  }

  static handleError(err) {
    console.error('[ANALYSIS WATCHER] ❌ Change stream error, reconnecting in 5s:', err.message);
    try { this.changeStream && this.changeStream.close(); } catch (_) { /* ignore */ }
    this.changeStream = null;
    this.scheduleReconnect();
  }

  static scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.start();
    }, 5000);
  }
}

module.exports = PrescriptiveAnalysisWatcher;
