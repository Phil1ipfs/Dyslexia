/**
 * ensureIndexes
 *
 * Creates the indexes that the hot read paths depend on. This is run once at
 * startup, right after the Mongo connection is established.
 *
 * Why this exists:
 *  - `category_results` is the single most-read collection (intervention-results
 *    routes, IEP report, the 5-min auto-processor, the change-stream watcher and
 *    the fix service all query it by studentId / studentId+readingLevel) yet it
 *    shipped with NO indexes, so every one of those queries was a full collection
 *    scan. Under the single warm Cloud Run instance (2 vCPU, 10-connection pool)
 *    those scans held connections and event-loop time long enough to starve the
 *    heavy endpoints (POST /prescriptive-analytics/generate, GET /iep/...) into
 *    the 300s timeout that surfaced in the browser as CORS / "load failed".
 *  - Creating a teacher/parent validates the email against five collections in
 *    five different databases; without an `email` index each of those is a full
 *    scan, which is the main lag on account creation.
 *
 * Safety:
 *  - createIndex is idempotent: it is a no-op when the index already exists.
 *  - All indexes are NON-unique so a build can never fail on pre-existing
 *    duplicate data.
 *  - Each index is created independently; one failure is logged and does not
 *    block the others or server startup.
 */

const mongoose = require('mongoose');

// [dbName, collection, keys, options]
const INDEXES = [
  // category_results — point lookups by student / student+level (was unindexed)
  ['test', 'category_results', { studentId: 1, readingLevel: 1 }, { name: 'studentId_1_readingLevel_1' }],

  // users — student lookups by idNumber + the 5-min auto-processor scan filter
  ['test', 'users', { idNumber: 1 }, { name: 'idNumber_1' }],
  ['test', 'users', { preAssessmentCompleted: 1, readingLevel: 1 }, { name: 'preAssessmentCompleted_1_readingLevel_1' }],

  // intervention_responses — the 30s monitor's countDocuments + revision lookups
  ['test', 'intervention_responses', { interventionAssessmentId: 1, studentId: 1 }, { name: 'interventionAssessmentId_1_studentId_1' }],

  // intervention_assessment — the 30s monitor's "active, not completed" scan
  ['test', 'intervention_assessment', { status: 1, completedAt: 1, interventionResultsId: 1 }, { name: 'status_1_completedAt_1_interventionResultsId_1' }],

  // email-uniqueness check on account creation — one index per checked collection
  ['teachers', 'profile', { email: 1 }, { name: 'email_1' }],
  ['parent', 'parent_profile', { email: 1 }, { name: 'email_1' }],
  ['users_web', 'users', { email: 1 }, { name: 'email_1' }],
  ['test', 'users', { email: 1 }, { name: 'email_1' }],
  ['admin_user', 'admin_profile', { email: 1 }, { name: 'email_1' }],
];

async function ensureIndexes() {
  let created = 0;
  let failed = 0;

  for (const [dbName, collection, keys, options] of INDEXES) {
    try {
      const db = mongoose.connection.useDb(dbName);
      await db.collection(collection).createIndex(keys, { background: true, ...options });
      created++;
    } catch (err) {
      failed++;
      console.warn(`[ENSURE INDEXES] ⚠️ Could not create index ${options.name} on ${dbName}.${collection}: ${err.message}`);
    }
  }

  console.log(`[ENSURE INDEXES] ✅ Index check complete: ${created} ensured, ${failed} failed`);
  return { created, failed };
}

module.exports = ensureIndexes;
