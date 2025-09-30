// Database Optimization Service - Performance Indexes and Query Optimization
// Creates database indexes for sub-second query performance

const mongoose = require('mongoose');

class DatabaseOptimizationService {

  /**
   * Create performance indexes for ultra-fast scoring
   */
  static async createPerformanceIndexes() {
    try {
      console.log('[DB OPTIMIZE] 🚀 Creating performance indexes...');
      const testDb = mongoose.connection.db;

      const indexCreationResults = {
        created: 0,
        skipped: 0,
        errors: []
      };

      // Helper function to safely create index
      const safeCreateIndex = async (collection, keys, options) => {
        try {
          await testDb.collection(collection).createIndex(keys, options);
          indexCreationResults.created++;
        } catch (error) {
          if (error.code === 85 || error.codeName === 'IndexOptionsConflict') {
            // Index already exists with different name - skip
            indexCreationResults.skipped++;
          } else {
            indexCreationResults.errors.push({ collection, error: error.message });
          }
        }
      };

      // 1. Student Responses - Critical for scoring queries
      console.log('[DB OPTIMIZE] 📋 Creating student_responses indexes...');
      await safeCreateIndex('student_responses',
        { studentId: 1, category: 1, readingLevel: 1 },
        { name: 'scoring_lookup_idx', background: true }
      );
      await safeCreateIndex('student_responses',
        { studentId: 1, answeredAt: -1 },
        { name: 'latest_response_idx', background: true }
      );
      await safeCreateIndex('student_responses',
        { category: 1, readingLevel: 1, isCorrect: 1 },
        { name: 'category_performance_idx', background: true }
      );

      // 2. Intervention Responses - Fast intervention processing
      console.log('[DB OPTIMIZE] 🎯 Creating intervention_responses indexes...');
      await safeCreateIndex('intervention_responses',
        { studentId: 1, interventionAssessmentId: 1 },
        { name: 'intervention_scoring_idx', background: true }
      );
      await safeCreateIndex('intervention_responses',
        { interventionAssessmentId: 1, answeredAt: -1 },
        { name: 'intervention_completion_idx', background: true }
      );

      // 3. Category Results - Fast lookup and updates
      console.log('[DB OPTIMIZE] 📊 Creating category_results indexes...');
      await safeCreateIndex('category_results',
        { studentId: 1, readingLevel: 1 },
        { name: 'student_progress_idx', background: true }
      );
      await safeCreateIndex('category_results',
        { studentId: 1, 'categories.categoryName': 1 },
        { name: 'category_lookup_idx', background: true }
      );
      await safeCreateIndex('category_results',
        { updatedAt: -1 },
        { name: 'recent_updates_idx', background: true }
      );

      // 4. Prescriptive Analysis - Fast regeneration checks
      console.log('[DB OPTIMIZE] 🧠 Creating prescriptive_analysis indexes...');
      await safeCreateIndex('prescriptive_analysis',
        { categoryResultId: 1 },
        { name: 'analysis_lookup_idx', background: true, unique: true }
      );
      await safeCreateIndex('prescriptive_analysis',
        { studentId: 1, createdAt: -1 },
        { name: 'student_analysis_idx', background: true }
      );

      // 5. IEP Reports - Fast report generation
      console.log('[DB OPTIMIZE] 📋 Creating iep_reports indexes...');
      await safeCreateIndex('iep_reports',
        { studentNumber: 1, isActive: 1 },
        { name: 'active_iep_idx', background: true }
      );
      await safeCreateIndex('iep_reports',
        { studentId: 1, basedOnAssessmentId: 1 },
        { name: 'iep_assessment_link_idx', background: true }
      );

      // 6. Intervention Assessments - Fast intervention lookup
      console.log('[DB OPTIMIZE] 💉 Creating intervention_assessment indexes...');
      await safeCreateIndex('intervention_assessment',
        { studentId: 1, category: 1 },
        { name: 'intervention_student_idx', background: true }
      );
      await safeCreateIndex('intervention_assessment',
        { prescriptiveAnalysisId: 1 },
        { name: 'intervention_analysis_idx', background: true }
      );

      console.log(`[DB OPTIMIZE] ✅ Index creation complete: ${indexCreationResults.created} created, ${indexCreationResults.skipped} skipped`);
      if (indexCreationResults.errors.length > 0) {
        console.warn(`[DB OPTIMIZE] ⚠️ ${indexCreationResults.errors.length} errors:`, indexCreationResults.errors);
      }

      return {
        success: true,
        message: 'Performance indexes processed',
        results: indexCreationResults
      };

    } catch (error) {
      console.error('[DB OPTIMIZE] ❌ Critical error creating indexes:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Optimize MongoDB settings for performance
   */
  static async optimizeMongoDBSettings() {
    try {
      console.log('[DB OPTIMIZE] ⚙️ Optimizing MongoDB settings...');
      const testDb = mongoose.connection.db;

      // Enable query profiling for slow queries (>100ms)
      await testDb.command({ profile: 2, slowms: 100 });

      console.log('[DB OPTIMIZE] ✅ MongoDB settings optimized');
      return { success: true, message: 'MongoDB optimized' };

    } catch (error) {
      console.error('[DB OPTIMIZE] ❌ Error optimizing MongoDB:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Run performance analysis and recommendations
   */
  static async analyzePerformance() {
    try {
      console.log('[DB OPTIMIZE] 📊 Analyzing database performance...');
      const testDb = mongoose.connection.db;

      // Check collection sizes
      const stats = {};
      const collections = ['student_responses', 'category_results', 'prescriptive_analysis', 'intervention_responses'];

      for (const collectionName of collections) {
        try {
          const collStats = await testDb.collection(collectionName).stats();
          stats[collectionName] = {
            documents: collStats.count,
            size: Math.round(collStats.size / 1024 / 1024 * 100) / 100, // MB
            avgDocSize: Math.round(collStats.avgObjSize),
            indexes: collStats.nindexes
          };
        } catch (error) {
          stats[collectionName] = { error: 'Collection not found' };
        }
      }

      // Get index usage stats
      const indexStats = {};
      for (const collectionName of collections) {
        try {
          const indexUsage = await testDb.collection(collectionName).aggregate([
            { $indexStats: {} }
          ]).toArray();
          indexStats[collectionName] = indexUsage.map(idx => ({
            name: idx.name,
            usage: idx.accesses.ops,
            since: idx.accesses.since
          }));
        } catch (error) {
          indexStats[collectionName] = [];
        }
      }

      console.log('[DB OPTIMIZE] 📊 Collection Statistics:');
      console.table(stats);

      console.log('[DB OPTIMIZE] 📈 Index Usage:');
      Object.keys(indexStats).forEach(collection => {
        console.log(`${collection}:`, indexStats[collection]);
      });

      return {
        success: true,
        stats: stats,
        indexStats: indexStats,
        recommendations: this.generateRecommendations(stats)
      };

    } catch (error) {
      console.error('[DB OPTIMIZE] ❌ Error analyzing performance:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate performance recommendations
   */
  static generateRecommendations(stats) {
    const recommendations = [];

    Object.keys(stats).forEach(collection => {
      const stat = stats[collection];
      if (stat.error) return;

      if (stat.documents > 10000 && stat.indexes < 3) {
        recommendations.push(`${collection}: Add more indexes for ${stat.documents} documents`);
      }

      if (stat.avgDocSize > 10000) {
        recommendations.push(`${collection}: Large documents (${stat.avgDocSize} bytes) - consider optimization`);
      }

      if (stat.size > 100) {
        recommendations.push(`${collection}: Large collection (${stat.size}MB) - monitor performance`);
      }
    });

    return recommendations;
  }

  /**
   * Initialize all database optimizations
   */
  static async initializeOptimizations() {
    try {
      console.log('[DB OPTIMIZE] 🚀 Initializing complete database optimization...');

      // Create performance indexes
      await this.createPerformanceIndexes();

      // Optimize MongoDB settings
      await this.optimizeMongoDBSettings();

      // Run initial performance analysis
      const analysis = await this.analyzePerformance();

      console.log('[DB OPTIMIZE] ✅ Database optimization complete');
      return {
        success: true,
        message: 'Database fully optimized for sub-second performance',
        analysis: analysis
      };

    } catch (error) {
      console.error('[DB OPTIMIZE] ❌ Error initializing optimizations:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = DatabaseOptimizationService;