const mongoose = require('mongoose');
const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const CategoryResult = require('../../models/Teachers/ManageProgress/categoryResultModel');
const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');

/**
 * Progress Tracking Service
 * Comprehensive analytics for student progress over time, including before/after intervention comparisons
 */
class ProgressTrackingService {

  /**
   * Get comprehensive progress tracking data for a student
   * @param {number} studentId - Student ID
   * @param {string} dateRange - Optional date range ('30d', '60d', '90d', 'all')
   * @returns {Object} Comprehensive progress data
   */
  async getStudentProgressAnalytics(studentId, dateRange = 'all') {
    try {
      console.log(`[PROGRESS TRACKING] Getting comprehensive analytics for student ${studentId}`);

      const dateFilter = this.getDateFilter(dateRange);
      
      // Get all prescriptive analyses over time
      const analyses = await PrescriptiveAnalysis.find({
        studentId: parseInt(studentId),
        ...dateFilter
      }).sort({ createdAt: 1 });

      if (analyses.length === 0) {
        return {
          studentId,
          hasData: false,
          message: 'No progress data available'
        };
      }

      // Get all intervention results for this student
      const interventionResults = await InterventionResults.find({
        studentId: parseInt(studentId),
        ...dateFilter
      }).sort({ completedAt: 1 });

      // Calculate comprehensive analytics
      const progressData = {
        studentId,
        hasData: true,
        dateRange,
        analyticsGenerated: new Date(),
        
        // Overall progress trends
        overallTrends: this.calculateOverallProgressTrends(analyses),
        
        // Category-specific progress
        categoryProgress: this.calculateCategoryProgressTrends(analyses),
        
        // BKT mastery progression
        masteryProgression: this.calculateMasteryProgression(analyses),
        
        // Intervention effectiveness analytics
        interventionAnalytics: this.calculateInterventionEffectiveness(interventionResults, analyses),
        
        // Before/after intervention comparisons
        interventionComparisons: await this.calculateBeforeAfterComparisons(studentId, interventionResults),
        
        // Reading level progression
        readingLevelProgression: this.calculateReadingLevelProgression(analyses),
        
        // Performance insights and recommendations
        insights: this.generateProgressInsights(analyses, interventionResults)
      };

      return progressData;

    } catch (error) {
      console.error('[PROGRESS TRACKING] Error getting student progress analytics:', error);
      throw error;
    }
  }

  /**
   * Calculate before/after intervention comparisons
   * @param {number} studentId - Student ID
   * @param {Array} interventionResults - Intervention results
   * @returns {Array} Before/after comparison data
   */
  async calculateBeforeAfterComparisons(studentId, interventionResults) {
    const comparisons = [];

    for (const intervention of interventionResults) {
      try {
        // Find prescriptive analysis before intervention
        const beforeAnalysis = await PrescriptiveAnalysis.findOne({
          studentId: parseInt(studentId),
          createdAt: { $lt: intervention.completedAt },
          assessmentType: 'main'
        }).sort({ createdAt: -1 });

        // Find prescriptive analysis after intervention
        const afterAnalysis = await PrescriptiveAnalysis.findOne({
          studentId: parseInt(studentId),
          createdAt: { $gt: intervention.completedAt },
          assessmentType: 'main'
        }).sort({ createdAt: 1 });

        if (beforeAnalysis && afterAnalysis) {
          const comparison = this.calculateSingleBeforeAfterComparison(
            beforeAnalysis, 
            afterAnalysis, 
            intervention
          );
          comparisons.push(comparison);
        }
      } catch (error) {
        console.error(`Error calculating comparison for intervention ${intervention._id}:`, error);
      }
    }

    return comparisons;
  }

  /**
   * Calculate single before/after intervention comparison
   * @param {Object} beforeAnalysis - Analysis before intervention
   * @param {Object} afterAnalysis - Analysis after intervention
   * @param {Object} intervention - Intervention result
   * @returns {Object} Comparison data
   */
  calculateSingleBeforeAfterComparison(beforeAnalysis, afterAnalysis, intervention) {
    const category = intervention.category;
    
    // Get category-specific data
    const beforeMastery = beforeAnalysis.skillMastery.get ? 
      beforeAnalysis.skillMastery.get(category) : 
      beforeAnalysis.skillMastery[category];
    
    const afterMastery = afterAnalysis.skillMastery.get ? 
      afterAnalysis.skillMastery.get(category) : 
      afterAnalysis.skillMastery[category];

    const beforeAbility = beforeAnalysis.abilityEstimates.get ? 
      beforeAnalysis.abilityEstimates.get(category) : 
      beforeAnalysis.abilityEstimates[category] || 0;
    
    const afterAbility = afterAnalysis.abilityEstimates.get ? 
      afterAnalysis.abilityEstimates.get(category) : 
      afterAnalysis.abilityEstimates[category] || 0;

    return {
      interventionId: intervention._id,
      category,
      interventionDate: intervention.completedAt,
      interventionPassed: intervention.isPassed,
      interventionScore: intervention.finalScore,
      
      before: {
        analysisDate: beforeAnalysis.createdAt,
        masteryProbability: beforeMastery?.masteryProbability || 0,
        score: beforeMastery?.score || 0,
        isPassed: beforeMastery?.isPassed || false,
        abilityEstimate: beforeAbility
      },
      
      after: {
        analysisDate: afterAnalysis.createdAt,
        masteryProbability: afterMastery?.masteryProbability || 0,
        score: afterMastery?.score || 0,
        isPassed: afterMastery?.isPassed || false,
        abilityEstimate: afterAbility
      },
      
      improvement: {
        masteryChange: (afterMastery?.masteryProbability || 0) - (beforeMastery?.masteryProbability || 0),
        scoreChange: (afterMastery?.score || 0) - (beforeMastery?.score || 0),
        abilityChange: afterAbility - beforeAbility,
        statusChange: this.getStatusChange(beforeMastery?.isPassed, afterMastery?.isPassed),
        effectiveIntervention: intervention.isPassed && (afterMastery?.score || 0) > (beforeMastery?.score || 0)
      }
    };
  }

  /**
   * Calculate overall progress trends across all categories
   * @param {Array} analyses - Array of prescriptive analyses
   * @returns {Object} Overall progress trend data
   */
  calculateOverallProgressTrends(analyses) {
    if (analyses.length < 2) {
      return { trend: 'insufficient_data', data: [] };
    }

    const trendData = analyses.map(analysis => ({
      date: analysis.createdAt,
      overallScore: analysis.insights?.overallScore || 0,
      passedCategories: analysis.insights?.passedCategories || 0,
      failedCategories: analysis.insights?.failedCategories || 0,
      readingLevel: analysis.readingLevel,
      recommendedAction: analysis.insights?.recommendedAction
    }));

    // Calculate trend direction
    const scores = trendData.map(d => d.overallScore);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.ceil(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    const improvement = Math.round(secondAvg - firstAvg);
    let trendDirection;
    
    if (Math.abs(improvement) < 3) {
      trendDirection = 'stable';
    } else if (improvement > 0) {
      trendDirection = 'improving';
    } else {
      trendDirection = 'declining';
    }

    return {
      trend: trendDirection,
      improvement,
      data: trendData,
      summary: {
        totalAnalyses: analyses.length,
        timeSpan: this.calculateTimeSpan(analyses[0].createdAt, analyses[analyses.length - 1].createdAt),
        firstScore: scores[0],
        latestScore: scores[scores.length - 1],
        averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      }
    };
  }

  /**
   * Calculate category-specific progress trends
   * @param {Array} analyses - Array of prescriptive analyses
   * @returns {Object} Category progress trends
   */
  calculateCategoryProgressTrends(analyses) {
    const categories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
    const categoryTrends = {};

    categories.forEach(category => {
      const categoryData = analyses.map(analysis => {
        const mastery = analysis.skillMastery.get ? 
          analysis.skillMastery.get(category) : 
          analysis.skillMastery[category];
        
        return {
          date: analysis.createdAt,
          score: mastery?.score || 0,
          masteryProbability: mastery?.masteryProbability || 0,
          isPassed: mastery?.isPassed || false,
          abilityEstimate: analysis.abilityEstimates.get ? 
            analysis.abilityEstimates.get(category) : 
            analysis.abilityEstimates[category] || 0
        };
      }).filter(d => d.score > 0 || d.masteryProbability > 0); // Only include data where student was assessed in this category

      if (categoryData.length > 0) {
        categoryTrends[category] = {
          hasData: true,
          dataPoints: categoryData.length,
          latestScore: categoryData[categoryData.length - 1].score,
          latestMastery: categoryData[categoryData.length - 1].masteryProbability,
          currentlyPassed: categoryData[categoryData.length - 1].isPassed,
          trend: this.calculateCategoryTrend(categoryData),
          data: categoryData
        };
      } else {
        categoryTrends[category] = {
          hasData: false,
          reason: 'No assessment data for this category'
        };
      }
    });

    return categoryTrends;
  }

  /**
   * Calculate mastery progression using BKT data
   * @param {Array} analyses - Array of prescriptive analyses
   * @returns {Object} Mastery progression data
   */
  calculateMasteryProgression(analyses) {
    const categories = ['Alphabet Knowledge', 'Phonological Awareness', 'Decoding', 'Word Recognition', 'Reading Comprehension'];
    const masteryProgression = {};

    categories.forEach(category => {
      const masteryData = analyses.map(analysis => {
        const mastery = analysis.skillMastery.get ? 
          analysis.skillMastery.get(category) : 
          analysis.skillMastery[category];
        
        return {
          date: analysis.createdAt,
          masteryProbability: mastery?.masteryProbability || 0,
          responseHistory: mastery?.responseHistory || []
        };
      }).filter(d => d.masteryProbability > 0);

      if (masteryData.length > 0) {
        masteryProgression[category] = {
          currentMastery: masteryData[masteryData.length - 1].masteryProbability,
          masteryThreshold: 0.75, // BKT mastery threshold
          isMastered: masteryData[masteryData.length - 1].masteryProbability >= 0.75,
          progression: masteryData.map(d => ({
            date: d.date,
            mastery: d.masteryProbability
          })),
          masteryTrend: this.calculateMasteryTrend(masteryData)
        };
      }
    });

    return masteryProgression;
  }

  /**
   * Calculate intervention effectiveness analytics
   * @param {Array} interventionResults - Intervention results
   * @param {Array} analyses - Prescriptive analyses
   * @returns {Object} Intervention effectiveness data
   */
  calculateInterventionEffectiveness(interventionResults, analyses) {
    if (interventionResults.length === 0) {
      return {
        hasInterventions: false,
        totalInterventions: 0
      };
    }

    const totalInterventions = interventionResults.length;
    const successfulInterventions = interventionResults.filter(i => i.isPassed).length;
    const successRate = Math.round((successfulInterventions / totalInterventions) * 100);

    // Category breakdown
    const categoryBreakdown = {};
    const categories = [...new Set(interventionResults.map(i => i.category))];
    
    categories.forEach(category => {
      const categoryInterventions = interventionResults.filter(i => i.category === category);
      const categorySuccess = categoryInterventions.filter(i => i.isPassed).length;
      
      categoryBreakdown[category] = {
        total: categoryInterventions.length,
        successful: categorySuccess,
        successRate: categoryInterventions.length > 0 ? Math.round((categorySuccess / categoryInterventions.length) * 100) : 0,
        averageScore: Math.round(categoryInterventions.reduce((sum, i) => sum + i.finalScore, 0) / categoryInterventions.length)
      };
    });

    return {
      hasInterventions: true,
      totalInterventions,
      successfulInterventions,
      successRate,
      categoryBreakdown,
      averageScore: Math.round(interventionResults.reduce((sum, i) => sum + i.finalScore, 0) / interventionResults.length),
      interventionTrend: this.calculateInterventionTrend(interventionResults)
    };
  }

  /**
   * Calculate reading level progression over time
   * @param {Array} analyses - Array of prescriptive analyses
   * @returns {Object} Reading level progression data
   */
  calculateReadingLevelProgression(analyses) {
    const readingLevels = ['Low Emerging', 'High Emerging', 'Developing', 'Transitioning', 'At Grade Level'];
    const levelOrder = { 'Low Emerging': 0, 'High Emerging': 1, 'Developing': 2, 'Transitioning': 3, 'At Grade Level': 4 };
    
    const progression = analyses.map(analysis => ({
      date: analysis.createdAt,
      readingLevel: analysis.readingLevel,
      levelOrder: levelOrder[analysis.readingLevel] || 0
    }));

    const firstLevel = progression[0]?.levelOrder || 0;
    const currentLevel = progression[progression.length - 1]?.levelOrder || 0;
    const levelGained = currentLevel - firstLevel;

    return {
      currentReadingLevel: progression[progression.length - 1]?.readingLevel,
      startingReadingLevel: progression[0]?.readingLevel,
      levelsGained: levelGained,
      progression: progression.map(p => ({
        date: p.date,
        readingLevel: p.readingLevel
      })),
      hasProgressed: levelGained > 0,
      isStable: levelGained === 0,
      hasRegressed: levelGained < 0
    };
  }

  /**
   * Generate progress insights and recommendations
   * @param {Array} analyses - Prescriptive analyses
   * @param {Array} interventionResults - Intervention results
   * @returns {Object} Progress insights
   */
  generateProgressInsights(analyses, interventionResults) {
    const insights = {
      strengths: [],
      concerns: [],
      recommendations: [],
      achievements: []
    };

    // Analyze recent progress
    const recentAnalyses = analyses.slice(-3);
    if (recentAnalyses.length > 1) {
      const firstRecent = recentAnalyses[0];
      const latestRecent = recentAnalyses[recentAnalyses.length - 1];
      
      const scoreImprovement = (latestRecent.insights?.overallScore || 0) - (firstRecent.insights?.overallScore || 0);
      
      if (scoreImprovement > 10) {
        insights.achievements.push(`Significant improvement: +${scoreImprovement} points in recent assessments`);
        insights.strengths.push('Consistent upward trend in overall performance');
      } else if (scoreImprovement < -10) {
        insights.concerns.push(`Performance decline: ${scoreImprovement} points in recent assessments`);
        insights.recommendations.push('Consider additional support or intervention modifications');
      }
    }

    // Intervention effectiveness insights
    if (interventionResults.length > 0) {
      const successRate = (interventionResults.filter(i => i.isPassed).length / interventionResults.length) * 100;
      
      if (successRate >= 75) {
        insights.strengths.push('High intervention success rate - interventions are effective');
      } else if (successRate < 50) {
        insights.concerns.push('Low intervention success rate - may need different approaches');
        insights.recommendations.push('Consider face-to-face intervention or modified strategies');
      }
    }

    return insights;
  }

  // Helper methods

  getDateFilter(dateRange) {
    if (dateRange === 'all') return {};
    
    const days = {
      '30d': 30,
      '60d': 60,
      '90d': 90
    };
    
    const daysBack = days[dateRange] || 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    
    return { createdAt: { $gte: cutoffDate } };
  }

  getStatusChange(beforePassed, afterPassed) {
    if (beforePassed === afterPassed) return 'no_change';
    if (!beforePassed && afterPassed) return 'failed_to_passed';
    if (beforePassed && !afterPassed) return 'passed_to_failed';
    return 'unknown';
  }

  calculateTimeSpan(startDate, endDate) {
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  }

  calculateCategoryTrend(categoryData) {
    if (categoryData.length < 2) return 'insufficient_data';
    
    const scores = categoryData.map(d => d.score);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.ceil(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    const improvement = secondAvg - firstAvg;
    
    if (Math.abs(improvement) < 5) return 'stable';
    return improvement > 0 ? 'improving' : 'declining';
  }

  calculateMasteryTrend(masteryData) {
    if (masteryData.length < 2) return 'insufficient_data';
    
    const masteryValues = masteryData.map(d => d.masteryProbability);
    const firstValue = masteryValues[0];
    const lastValue = masteryValues[masteryValues.length - 1];
    
    const improvement = lastValue - firstValue;
    
    if (Math.abs(improvement) < 0.1) return 'stable';
    return improvement > 0 ? 'improving' : 'declining';
  }

  calculateInterventionTrend(interventionResults) {
    if (interventionResults.length < 2) return 'insufficient_data';
    
    const scores = interventionResults.map(i => i.finalScore);
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.ceil(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    const improvement = secondAvg - firstAvg;
    
    if (Math.abs(improvement) < 5) return 'stable';
    return improvement > 0 ? 'improving' : 'declining';
  }
}

module.exports = new ProgressTrackingService();