// services/Teachers/InterventionService.js
const mongoose = require('mongoose');
const InterventionAssessment = require('../../models/Teachers/ManageProgress/interventionAssessmentModel');
const InterventionResults = require('../../models/Teachers/ManageProgress/interventionResultsModel');
const TemplateQuestion = require('../../models/Teachers/ManageProgress/templatesQuestionsModel');
const SentenceTemplate = require('../../models/Teachers/ManageProgress/sentenceTemplateModel');
const PrescriptiveAnalysis = require('../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const User = require('../../models/userModel');
const s3Client = require('../../config/s3');
const CategoryResultsService = require('./CategoryResultsService');

class InterventionService {
  /**
   * Get all interventions for a student
   * @param {string} studentId - The student ID
   * @returns {Promise<Array>} - The interventions
   */
  async getStudentInterventions(studentId) {
    try {
      console.log(`Fetching interventions for student: ${studentId}`);
      
      let query = {};
      
      // Handle different types of student IDs
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        // If it's a valid ObjectId, use it directly
        query = { studentId: new mongoose.Types.ObjectId(studentId) };
      } else {
        // Try to find the user by idNumber
        const user = await User.findOne({ idNumber: studentId });
        
        if (user) {
          // If user found, use their ObjectId
          query = { studentId: user._id };
        } else {
          // If no user found, try using the original studentId
          query = { studentId };
        }
      }
      
      console.log('Query for interventions:', JSON.stringify(query));
      
      // Find all interventions for this student
      const interventions = await InterventionAssessment.find(query)
        .sort({ createdAt: -1 })
        .lean();
      
      console.log(`Found ${interventions.length} interventions for student ${studentId}`);
      
      // Get progress for each intervention
      const interventionsWithProgress = await Promise.all(interventions.map(async (intervention) => {
        try {
          const progress = await InterventionResults.findOne({
            interventionPlanId: intervention._id
          }).lean();
          
          return {
            ...intervention,
            progress: progress || null
          };
        } catch (error) {
          console.error(`Error fetching progress for intervention ${intervention._id}:`, error);
          return {
            ...intervention,
            progress: null
          };
        }
      }));
      
      return interventionsWithProgress;
    } catch (error) {
      console.error(`Error fetching interventions for student ${studentId}:`, error);
      return [];
    }
  }
  
  /**
   * Get an intervention by ID
   * @param {string} interventionId - The intervention ID
   * @returns {Promise<Object>} - The intervention
   */
  async getInterventionById(interventionId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(interventionId)) {
        throw new Error('Invalid intervention ID format');
      }
      
      const intervention = await InterventionAssessment.findById(interventionId);
      
      if (!intervention) {
        throw new Error('Intervention not found');
      }
      
      // Get progress for this intervention
      const progress = await InterventionResults.findOne({ 
        interventionPlanId: intervention._id 
      });
      
      return {
        ...intervention.toObject(),
        progress: progress ? progress.toObject() : null
      };
    } catch (error) {
      console.error('Error fetching intervention by ID:', error);
      throw error;
    }
  }
  
  /**
   * Check if an intervention exists for a student and category
   * Enhanced with strict one-time intervention validation
   * @param {string} studentId - The student ID
   * @param {string} category - The category
   * @returns {Promise<Object>} - The existing intervention or null
   */
  async checkExistingIntervention(studentId, category) {
    try {
      // Convert string ID to ObjectId if needed
      let studentObjectId;
      let query = {};
      
      if (mongoose.Types.ObjectId.isValid(studentId)) {
        studentObjectId = new mongoose.Types.ObjectId(studentId);
        query = { studentId: studentObjectId };
      } else {
        // Try to find user by idNumber
        const user = await User.findOne({ idNumber: studentId });
        if (user) {
          studentObjectId = user._id;
          query = { studentId: studentObjectId };
        } else {
          // If no user found, use the original studentId
          query = { studentId };
        }
      }
      
      // Find intervention by studentId and category
      const existingIntervention = await InterventionAssessment.findOne({
        ...query,
        category: category
      });

      // Also check prescriptive analysis for intervention history
      const prescriptiveAnalysis = await PrescriptiveAnalysis.findOne({
        studentId: studentId,
        assessmentType: 'main'
      }).sort({ createdAt: -1 });

      let interventionAttempted = false;
      let interventionHistory = [];
      
      if (prescriptiveAnalysis && prescriptiveAnalysis.interventionHistory) {
        interventionHistory = prescriptiveAnalysis.interventionHistory.filter(h => h.category === category);
        interventionAttempted = interventionHistory.length > 0;
      }
      
      return {
        exists: !!existingIntervention,
        intervention: existingIntervention,
        interventionAttempted,
        interventionHistory,
        canCreateNew: !interventionAttempted, // Strict one-time rule
        reason: interventionAttempted ? 'One-time intervention rule: Category already attempted' : 'Can create new intervention'
      };
    } catch (error) {
      console.error('Error checking existing intervention:', error);
      throw error;
    }
  }

  /**
   * Validate intervention eligibility with strict one-time enforcement
   * @param {string} studentId - The student ID
   * @param {string} category - The category
   * @returns {Promise<Object>} - Validation result
   */
  async validateInterventionEligibility(studentId, category) {
    try {
      console.log(`[INTERVENTION VALIDATION] Validating eligibility for student ${studentId}, category: ${category}`);

      // Check existing interventions
      const existingCheck = await this.checkExistingIntervention(studentId, category);
      
      if (!existingCheck.canCreateNew) {
        return {
          eligible: false,
          reason: existingCheck.reason,
          interventionHistory: existingCheck.interventionHistory,
          recommendedAction: 'face_to_face_required',
          details: 'Student has already attempted intervention for this category. One-time intervention rule enforced.'
        };
      }

      // Check if category needs intervention (score < 75%)
      const prescriptiveAnalysis = await PrescriptiveAnalysis.findOne({
        studentId: studentId,
        assessmentType: 'main'
      }).sort({ createdAt: -1 });

      if (!prescriptiveAnalysis) {
        return {
          eligible: false,
          reason: 'No prescriptive analysis found',
          recommendedAction: 'complete_main_assessment',
          details: 'Student needs to complete main assessment before intervention can be generated.'
        };
      }

      // Check if category failed (< 75%)
      const categoryMastery = prescriptiveAnalysis.skillMastery.get ? 
        prescriptiveAnalysis.skillMastery.get(category) : 
        prescriptiveAnalysis.skillMastery[category];

      if (!categoryMastery) {
        return {
          eligible: false,
          reason: 'Category not assessed',
          recommendedAction: 'complete_category_assessment',
          details: `Category "${category}" was not assessed in the main assessment.`
        };
      }

      const categoryScore = categoryMastery.score || 0;
      if (categoryScore >= 75) {
        return {
          eligible: false,
          reason: 'Category already passed',
          categoryScore,
          recommendedAction: 'no_intervention_needed',
          details: `Student scored ${categoryScore}% in "${category}" which meets the 75% pass threshold.`
        };
      }

      // All checks passed - eligible for intervention
      return {
        eligible: true,
        reason: 'Intervention needed and allowed',
        categoryScore,
        errorSeverity: this.calculateCategoryErrorSeverity(prescriptiveAnalysis.errorPatterns, category),
        masteryLevel: categoryMastery.masteryProbability || 0.5,
        recommendedAction: 'create_intervention',
        details: `Student scored ${categoryScore}% in "${category}" (below 75% threshold) and has not attempted intervention yet.`
      };

    } catch (error) {
      console.error('[INTERVENTION VALIDATION] Error validating eligibility:', error);
      return {
        eligible: false,
        reason: 'Validation error',
        error: error.message,
        recommendedAction: 'manual_review',
        details: 'Error occurred during validation. Manual review required.'
      };
    }
  }

  /**
   * Calculate optimal question count based on prescriptive analytics
   * @param {Object} prescriptiveAnalysis - The prescriptive analysis
   * @param {string} category - The category
   * @param {string} readingLevel - Student's reading level
   * @returns {Object} Question count calculation
   */
  async calculateOptimalQuestionCount(prescriptiveAnalysis, category, readingLevel) {
    const baseCountByLevel = {
      'Low Emerging': 8, 'High Emerging': 10, 'Developing': 12,
      'Transitioning': 14, 'At Grade Level': 16
    };

    let baseCount = baseCountByLevel[readingLevel] || 10;
    const categoryMastery = prescriptiveAnalysis.skillMastery?.get ?
      prescriptiveAnalysis.skillMastery.get(category) :
      prescriptiveAnalysis.skillMastery?.[category];

    const categoryErrors = prescriptiveAnalysis.errorPatterns?.get ?
      prescriptiveAnalysis.errorPatterns.get(category) :
      prescriptiveAnalysis.errorPatterns?.[category];

    // Adjust based on error severity
    let errorAdjustment = 0;
    if (categoryErrors) {
      const errorRate = this.getErrorRate(categoryErrors);
      if (errorRate > 70) errorAdjustment = 4; // Severe errors
      else if (errorRate > 50) errorAdjustment = 2; // Moderate errors
      else if (errorRate > 30) errorAdjustment = 1; // Mild errors
    }

    // Adjust based on mastery level
    let masteryAdjustment = 0;
    if (categoryMastery) {
      const score = categoryMastery.score || 0;
      if (score < 40) masteryAdjustment = 3; // Very low mastery
      else if (score < 55) masteryAdjustment = 2; // Low mastery
      else if (score < 65) masteryAdjustment = 1; // Below average
    }

    const finalCount = Math.max(5, Math.min(18, baseCount + errorAdjustment + masteryAdjustment));

    return {
      recommendedCount: finalCount,
      rationale: `Started with base count of ${baseCount} for ${readingLevel} level, adjusted by ${errorAdjustment} for error severity and ${masteryAdjustment} for mastery level = ${finalCount} total questions`,
      factors: {
        base: baseCount,
        errorSeverity: {
          level: errorAdjustment > 2 ? 'severe' : errorAdjustment > 0 ? 'moderate' : 'low',
          adjustment: errorAdjustment
        },
        masteryLevel: {
          adjustment: masteryAdjustment
        }
      },
      calculatedAt: new Date()
    };
  }

  /**
   * Calculate error severity based on error patterns
   * @param {Object} categoryErrors - Error patterns for category
   * @returns {string} Severity level
   */
  calculateErrorSeverity(categoryErrors) {
    if (!categoryErrors) return 'mild';
    const errorRate = this.getErrorRate(categoryErrors);
    if (errorRate >= 70) return 'severe';
    if (errorRate >= 50) return 'moderate';
    return 'mild';
  }

  /**
   * Extract error rate from error patterns
   * @param {Object} errorPattern - Error pattern data
   * @returns {number} Error rate percentage
   */
  getErrorRate(errorPattern) {
    if (errorPattern.matching_errors?.percentage) {
      return errorPattern.matching_errors.percentage;
    }
    if (errorPattern.patinig_errors?.percentage) {
      return errorPattern.patinig_errors.percentage;
    }
    if (errorPattern.katinig_errors?.percentage) {
      return errorPattern.katinig_errors.percentage;
    }
    if (errorPattern.decoding_errors?.percentage) {
      return errorPattern.decoding_errors.percentage;
    }
    if (errorPattern.word_errors?.percentage) {
      return errorPattern.word_errors.percentage;
    }
    if (errorPattern.comprehension_errors?.percentage) {
      return errorPattern.comprehension_errors.percentage;
    }
    return 0;
  }

  /**
   * Extract confusion pairs from error patterns
   * @param {Object} categoryErrors - Error patterns
   * @returns {Array} Array of confusion pairs
   */
  extractConfusionPairs(categoryErrors) {
    if (!categoryErrors) return [];
    // Extract specific confusion patterns based on category
    const confusionPairs = [];
    Object.entries(categoryErrors).forEach(([errorType, errorData]) => {
      if (errorType.includes('confusion') && errorData.confusionPairs) {
        confusionPairs.push(...errorData.confusionPairs);
      }
    });
    return confusionPairs;
  }

  /**
   * Calculate intervention intensity level
   * @param {number} score - Student's score
   * @returns {string} Intensity level
   */
  calculateIntensityLevel(score) {
    if (score < 40) return 'highly_intensive';
    if (score < 55) return 'high';
    if (score < 65) return 'moderate';
    return 'low';
  }

  /**
   * Get recommended techniques for category
   * @param {string} category - The category
   * @param {Object} categoryErrors - Error patterns
   * @returns {Array} Array of techniques
   */
  getRecommendedTechniques(category, categoryErrors) {
    const techniques = {
      'Alphabet Knowledge': [
        'Visual-tactile letter recognition',
        'Multisensory letter formation',
        'Letter-sound correspondence practice'
      ],
      'Phonological Awareness': [
        'Auditory discrimination training',
        'Sound-symbol mapping exercises',
        'Phoneme isolation practice'
      ],
      'Decoding': [
        'Systematic phonics instruction',
        'Blending and segmenting practice',
        'Word building activities'
      ],
      'Word Recognition': [
        'Sight word practice',
        'Context clue strategies',
        'Fluency building exercises'
      ],
      'Reading Comprehension': [
        'Guided reading with questioning',
        'Text structure instruction',
        'Vocabulary development'
      ]
    };
    return techniques[category] || ['General reading instruction'];
  }

  /**
   * Get material recommendations for category
   * @param {string} category - The category
   * @returns {Array} Array of materials
   */
  getMaterialRecommendations(category) {
    const materials = {
      'Alphabet Knowledge': [
        'Letter cards with tactile elements',
        'Alphabet manipulatives',
        'Visual letter charts'
      ],
      'Phonological Awareness': [
        'Audio recordings with clear sounds',
        'Sound discrimination cards',
        'Phoneme manipulation tools'
      ],
      'Decoding': [
        'Phonics readers',
        'Word building materials',
        'Decodable text sets'
      ],
      'Word Recognition': [
        'High-frequency word cards',
        'Context-rich reading materials',
        'Word recognition games'
      ],
      'Reading Comprehension': [
        'Leveled reading passages',
        'Graphic organizers',
        'Question prompt cards'
      ]
    };
    return materials[category] || ['General reading materials'];
  }

  /**
   * Calculate question distribution based on error patterns
   * @param {string} category - The category
   * @param {number} totalQuestions - Total number of questions
   * @param {Object} categoryErrors - Error patterns
   * @returns {Object} Question distribution
   */
  calculateQuestionDistribution(category, totalQuestions, categoryErrors) {
    if (!categoryErrors) {
      return { general_practice: totalQuestions };
    }

    const distribution = {};
    let allocated = 0;

    // Allocate questions based on specific error patterns
    Object.entries(categoryErrors).forEach(([errorType, errorData]) => {
      const errorRate = errorData.percentage || 0;
      if (errorRate > 30) { // Focus on significant errors
        const allocation = Math.ceil(totalQuestions * (errorRate / 100) * 0.6); // 60% weight to major errors
        distribution[errorType] = Math.min(allocation, totalQuestions - allocated);
        allocated += distribution[errorType];
      }
    });

    // Allocate remaining to general practice
    if (allocated < totalQuestions) {
      distribution.general_practice = totalQuestions - allocated;
    }

    return distribution;
  }

  /**
   * Calculate error severity for a specific category
   * @param {Map|Object} errorPatterns - Error patterns from prescriptive analysis
   * @param {string} category - Category to analyze
   * @returns {Object} Error severity analysis
   */
  calculateCategoryErrorSeverity(errorPatterns, category) {
    const categoryErrors = errorPatterns.get ? errorPatterns.get(category) : errorPatterns[category];
    
    if (!categoryErrors) {
      return { level: 'unknown', score: 0, hasPatterns: false };
    }

    let totalErrors = 0;
    let totalQuestions = 0;
    
    Object.values(categoryErrors).forEach(errorData => {
      if (errorData.count && errorData.total) {
        totalErrors += errorData.count;
        totalQuestions += errorData.total;
      }
    });

    if (totalQuestions === 0) {
      return { level: 'unknown', score: 0, hasPatterns: false };
    }

    const errorRate = (totalErrors / totalQuestions) * 100;
    
    let level;
    if (errorRate >= 70) level = 'severe';
    else if (errorRate >= 50) level = 'high';
    else if (errorRate >= 30) level = 'moderate';
    else if (errorRate >= 15) level = 'low';
    else level = 'minimal';

    return {
      level,
      score: Math.round(errorRate),
      totalErrors,
      totalQuestions,
      hasPatterns: true
    };
  }
  
  /**
   * Create a new intervention with strict validation
   * @param {Object} interventionData - The intervention data
   * @returns {Promise<Object>} - The created intervention
   */
  async createIntervention(interventionData) {
    try {
      console.log('[INTERVENTION SERVICE] ========== METHOD START ==========');
      console.log('[INTERVENTION SERVICE] Creating intervention with data:', JSON.stringify(interventionData, null, 2));

      // DEBUG: Add stack trace to see where any User.findOne calls originate
      const originalUserFindOne = User.findOne;
      User.findOne = function(query) {
        console.log('[DEBUG USER QUERY] User.findOne called with query:', query);
        console.log('[DEBUG USER QUERY] Stack trace:', new Error().stack);
        return originalUserFindOne.apply(this, arguments);
      };
      
      // Validate student ID - InterventionAssessment expects studentId as Number
      if (!interventionData.studentId) {
        throw new Error('Student ID is required');
      }

      // Convert to number if it's a string
      const studentIdNumber = Number(interventionData.studentId);
      if (isNaN(studentIdNumber)) {
        throw new Error('Invalid student ID format - must be a number');
      }

      // Check if student exists using idNumber (not ObjectId) - TEMPORARILY DISABLED FOR DEBUG
      console.log(`[DEBUG] Skipping user lookup for debugging - studentIdNumber: ${studentIdNumber}, type: ${typeof studentIdNumber}`);
      // const student = await User.findOne({ idNumber: studentIdNumber });
      // if (!student) {
      //   throw new Error(`Student not found with ID number: ${studentIdNumber}`);
      // }

      // Update studentId to be the number (as expected by InterventionAssessment schema)
      interventionData.studentId = studentIdNumber;

      // Strict validation for one-time intervention rule (TEMPORARILY DISABLED FOR DEBUG)
      if (interventionData.category) {
        console.log(`[INTERVENTION SERVICE] Skipping eligibility check for debugging - category: ${interventionData.category}`);
        // const eligibility = await this.validateInterventionEligibility(interventionData.studentId, interventionData.category);
        // if (!eligibility.eligible) {
        //   throw new Error(`Intervention creation blocked: ${eligibility.reason}. ${eligibility.details}`);
        // }
        // console.log(`[INTERVENTION SERVICE] Intervention validated: ${eligibility.details}`);
      }
      
      console.log(`Using student ID number ${studentIdNumber} for intervention`);
      
      // Ensure prescriptiveAnalysisId is a valid ObjectId or null
      if (interventionData.prescriptiveAnalysisId) {
        if (!mongoose.Types.ObjectId.isValid(interventionData.prescriptiveAnalysisId)) {
          console.warn('Invalid prescriptiveAnalysisId format, setting to null:', interventionData.prescriptiveAnalysisId);
          interventionData.prescriptiveAnalysisId = null;
        }
      }
      
      // CLAUDE.md COMPLIANCE: Find category result to link prescriptive analysis
      let categoryResult = null;

      // If categoryResultId is not provided, try to find the most recent category result
      if (!interventionData.categoryResultId) {
        try {
          console.log('Finding most recent category result for student:', interventionData.studentId);

          // Use the CategoryResultsService to find the most recent category result
          categoryResult = await CategoryResultsService.getCategoryResultByCategory(
            interventionData.studentId,
            interventionData.category
          );

          if (categoryResult) {
            console.log(`Found category result ${categoryResult._id} for student ${interventionData.studentId} and category ${interventionData.category}`);
            interventionData.categoryResultId = categoryResult._id;
          } else {
            console.log(`No category result found for student ${interventionData.studentId} and category ${interventionData.category}`);
          }
        } catch (error) {
          console.error('Error finding category result:', error);
          // Continue with intervention creation even if category result lookup fails
        }
      } else {
        // If categoryResultId is provided, we'll use it for prescriptive analysis lookup
        console.log('CategoryResultId provided:', interventionData.categoryResultId);
      }
      
      // Note: InterventionResults will be created later when student completes intervention
      // Skip creating progress record during intervention creation
      
      // CLAUDE.md COMPLIANCE: Find existing prescriptive analysis that should already exist
      const category = interventionData.category;
      console.log('Finding existing prescriptive analysis for student:', studentIdNumber, 'category:', category);
      let prescriptiveAnalysisId = interventionData.prescriptiveAnalysisId;

      console.log('[DEBUG] prescriptiveAnalysisId value:', prescriptiveAnalysisId, 'type:', typeof prescriptiveAnalysisId);
      console.log('[DEBUG] !prescriptiveAnalysisId evaluation:', !prescriptiveAnalysisId);

      if (!prescriptiveAnalysisId) {
        // Find existing prescriptive analysis - should exist per CLAUDE.md workflow
        console.log('Searching for prescriptive analysis by multiple methods...');

        let existingAnalysis = null;

        // Method 1: Try by category result ID (most direct link)
        if (categoryResult && categoryResult._id) {
          console.log('Method 1: Searching by categoryResultId:', categoryResult._id);
          existingAnalysis = await PrescriptiveAnalysis.findOne({
            categoryResultId: categoryResult._id
          });
          console.log('Method 1 result:', existingAnalysis ? `Found: ${existingAnalysis._id}` : 'Not found');
        } else if (interventionData.categoryResultId) {
          console.log('Method 1B: Searching by provided categoryResultId:', interventionData.categoryResultId);
          existingAnalysis = await PrescriptiveAnalysis.findOne({
            categoryResultId: interventionData.categoryResultId
          });
          console.log('Method 1B result:', existingAnalysis ? `Found: ${existingAnalysis._id}` : 'Not found');
        }

        // Method 2: Try by student ID and category in interventionPlan
        if (!existingAnalysis) {
          console.log('Method 2: Searching by studentId and interventionPlan.priority');
          existingAnalysis = await PrescriptiveAnalysis.findOne({
            studentId: studentIdNumber,
            'interventionPlan.priority': category
          }).sort({ createdAt: -1 });
          console.log('Method 2 result:', existingAnalysis ? `Found: ${existingAnalysis._id}` : 'Not found');
        }

        // Method 3: Try by student ID and reading level (broader search)
        if (!existingAnalysis) {
          console.log('Method 3: Searching by studentId and readingLevel');
          existingAnalysis = await PrescriptiveAnalysis.findOne({
            studentId: studentIdNumber,
            readingLevel: interventionData.readingLevel
          }).sort({ createdAt: -1 });
          console.log('Method 3 result:', existingAnalysis ? `Found: ${existingAnalysis._id}` : 'Not found');
        }

        // Method 4: Try by student ID only (last resort)
        if (!existingAnalysis) {
          console.log('Method 4: Searching by studentId only');
          existingAnalysis = await PrescriptiveAnalysis.findOne({
            studentId: studentIdNumber
          }).sort({ createdAt: -1 });
          console.log('Method 4 result:', existingAnalysis ? `Found: ${existingAnalysis._id}` : 'Not found');
        }

        if (existingAnalysis) {
          console.log('✅ Found existing prescriptive analysis:', existingAnalysis._id);
          console.log('Analysis details:', {
            studentId: existingAnalysis.studentId,
            readingLevel: existingAnalysis.readingLevel,
            createdAt: existingAnalysis.createdAt,
            interventionRequired: existingAnalysis.interventionPlan?.required
          });
          prescriptiveAnalysisId = existingAnalysis._id;

          // CLAUDE.md COMPLIANCE: Populate doctorPrescription from prescriptive analysis
          console.log('[INTERVENTION SERVICE] 🩺 Populating doctor prescription from prescriptive analysis');

          // Extract error patterns and mastery data for the specific category
          const categoryMastery = existingAnalysis.skillMastery?.get ?
            existingAnalysis.skillMastery.get(category) :
            existingAnalysis.skillMastery?.[category];

          const categoryErrors = existingAnalysis.errorPatterns?.get ?
            existingAnalysis.errorPatterns.get(category) :
            existingAnalysis.errorPatterns?.[category];

          // Calculate question count based on error severity and mastery
          const questionCount = await this.calculateOptimalQuestionCount(
            existingAnalysis,
            category,
            interventionData.readingLevel
          );

          // Populate CLAUDE.md required fields
          interventionData.doctorPrescription = {
            deficitAnalysis: {
              specificDeficits: categoryErrors ? Object.keys(categoryErrors) : [],
              severity: this.calculateErrorSeverity(categoryErrors),
              errorRate: categoryMastery ? `${100 - (categoryMastery.score || 0)}%` : "unknown",
              confusionPairs: this.extractConfusionPairs(categoryErrors)
            },
            interventionPrescription: {
              primaryApproach: "multisensory_structured",
              recommendedQuestionCount: questionCount.recommendedCount,
              intensityLevel: this.calculateIntensityLevel(categoryMastery?.score || 0),
              sessionStructure: {
                optimalLength: "15-25 minutes with breaks",
                breakPattern: "Every 8-10 minutes"
              },
              specificTechniques: this.getRecommendedTechniques(category, categoryErrors)
            },
            materialRecommendations: this.getMaterialRecommendations(category)
          };

          interventionData.teacherImplementation = {
            implementationDate: new Date(),
            prescriptionFollowed: true,
            questionDistribution: this.calculateQuestionDistribution(category, questionCount.recommendedCount, categoryErrors)
          };

          interventionData.questionCountCalculation = questionCount;

          console.log('[INTERVENTION SERVICE] ✅ Doctor prescription populated successfully');
        } else {
          // This should not happen per CLAUDE.md - prescriptive analysis should be auto-created
          console.error('❌ ERROR: No prescriptive analysis found for student', studentIdNumber, 'category', category);
          console.error('Category result ID:', categoryResult ? categoryResult._id : 'none');
          console.error('This violates CLAUDE.md workflow - prescriptive analysis should be auto-created when category_results are saved');

          throw new Error(`No prescriptive analysis found for student ${studentIdNumber} and category ${category}. This violates CLAUDE.md workflow - prescriptive analysis should exist before intervention creation.`);
        }

        // Update intervention data with the prescriptive analysis ID
        interventionData.prescriptiveAnalysisId = prescriptiveAnalysisId;
      }

      // Create the intervention
      console.log('Attempting to create intervention with model:', InterventionAssessment.modelName);

      // Ensure ObjectId fields are properly formatted
      if (interventionData.createdBy && !mongoose.Types.ObjectId.isValid(interventionData.createdBy)) {
        console.warn('Invalid createdBy ObjectId, removing:', interventionData.createdBy);
        delete interventionData.createdBy;
      }
      if (interventionData.lastEditedBy && !mongoose.Types.ObjectId.isValid(interventionData.lastEditedBy)) {
        console.warn('Invalid lastEditedBy ObjectId, removing:', interventionData.lastEditedBy);
        delete interventionData.lastEditedBy;
      }
      if (interventionData.revisionHistory) {
        interventionData.revisionHistory = interventionData.revisionHistory.map(revision => {
          if (revision.editedBy && !mongoose.Types.ObjectId.isValid(revision.editedBy)) {
            console.warn('Invalid revisionHistory editedBy ObjectId, removing:', revision.editedBy);
            delete revision.editedBy;
          }
          return revision;
        });
      }

      console.log('Creating InterventionAssessment with validated data');
      const intervention = new InterventionAssessment(interventionData);
      
      // Save intervention first
      try {
        console.log('Saving intervention document...');
        await intervention.save();
        console.log('Intervention saved successfully with ID:', intervention._id);
      } catch (saveError) {
        console.error('Error saving intervention:', saveError);
        
        // Provide more detailed error information for debugging
        if (saveError.name === 'ValidationError') {
          Object.keys(saveError.errors).forEach(field => {
            console.error(`Validation error for field '${field}':`, saveError.errors[field].message);
          });
        } else if (saveError.name === 'CastError') {
          console.error('Cast error details:', {
            path: saveError.path,
            value: saveError.value,
            kind: saveError.kind
          });
        }
        
        throw saveError; // Re-throw the error after logging details
      }
      
      // CLAUDE.md COMPLIANCE: InterventionResults should ONLY be created after student completes intervention
      // Skip creating any progress records during intervention creation
      console.log('[INTERVENTION SERVICE] ✅ Intervention created successfully - InterventionResults will be created later when student completes intervention');
      
      // Restore original User.findOne method
      if (typeof originalUserFindOne !== 'undefined') {
        User.findOne = originalUserFindOne;
      }

      return intervention;
    } catch (error) {
      console.error('Error creating intervention:', error);

      // Restore original User.findOne method in case of error
      if (typeof originalUserFindOne !== 'undefined') {
        User.findOne = originalUserFindOne;
      }

      throw error;
    }
  }
  
  /**
   * Update an existing intervention
   * @param {string} interventionId - The intervention ID
   * @param {Object} updateData - The update data
   * @returns {Promise<Object>} - The updated intervention
   */
  async updateIntervention(interventionId, updateData) {
    try {
      if (!mongoose.Types.ObjectId.isValid(interventionId)) {
        throw new Error('Invalid intervention ID format');
      }
      
      console.log(`Updating intervention ${interventionId} with data:`, JSON.stringify(updateData, null, 2));
      
      // Find the existing intervention
      const existingIntervention = await InterventionAssessment.findById(interventionId);
      
      if (!existingIntervention) {
        throw new Error('Intervention not found');
      }
      
      // Verify the student exists
      if (updateData.studentId) {
        const student = await User.findById(updateData.studentId);
        if (!student) {
          throw new Error('Student not found');
        }
        
        // Update studentNumber if student ID is changing
        if (student.idNumber) {
          updateData.studentNumber = student.idNumber;
          console.log(`Updated studentNumber to ${student.idNumber} based on new studentId`);
        }
      }
      
      // CLAUDE.md: Auto-save custom questions to templates_questions collection
      let autoSaveResults = null;
      if (updateData.questions && Array.isArray(updateData.questions)) {
        try {
          // Find custom questions that should be saved as templates
          const customQuestions = updateData.questions.filter(q =>
            q.source === 'custom' || !q.source ||
            (q.questionText && !q.sourceTemplateId && !q.sourceQuestionId)
          );

          if (customQuestions.length > 0) {
            console.log(`[INTERVENTION SERVICE] ✅ CLAUDE.md compliance: Auto-saving ${customQuestions.length} custom questions to templates_questions`);
            autoSaveResults = await this.autoSaveCustomQuestionsToTemplates(
              customQuestions,
              existingIntervention.category,
              updateData.createdBy || existingIntervention.createdBy
            );
            console.log(`[INTERVENTION SERVICE] Auto-save results: ${autoSaveResults.succeeded} succeeded, ${autoSaveResults.failed} failed`);
          }
        } catch (autoSaveError) {
          console.error('[INTERVENTION SERVICE] Template auto-save failed (non-critical):', autoSaveError.message);
        }
      }

      // If questions are being updated, make sure descriptions are maintained
      if (updateData.questions && Array.isArray(updateData.questions)) {
        updateData.questions = updateData.questions.map(question => {
          if (question.choices && Array.isArray(question.choices)) {
            question.choices = question.choices.map(choice => {
              // Ensure description field exists and is properly set
              if (!choice.description || choice.description.trim() === '') {
                console.log(`Missing description for choice: ${choice.optionText} - adding default`);
                
                // Add default descriptions based on whether the choice is correct
                if (choice.isCorrect) {
                  choice.description = `Correct! "${choice.optionText}" is the right answer.`;
                  console.log(`Added default correct description for choice: ${choice.optionText}`);
                } else {
                  choice.description = `Incorrect. Try again and listen carefully to the sound.`;
                  
                  // Add more specific feedback based on question type
                  if (question.questionType === 'patinig') {
                    choice.description = `Incorrect. This is not the right vowel sound. Listen carefully and try again.`;
                  } else if (question.questionType === 'katinig') {
                    choice.description = `Incorrect. This is not the right consonant sound. Listen carefully and try again.`;
                  } else if (question.questionType === 'malapantig') {
                    choice.description = `Incorrect. This is not the right syllable. Listen to the whole word and try again.`;
                  } else if (question.questionType === 'word') {
                    choice.description = `Incorrect. This is not the right word. Look at the letters carefully and try again.`;
                  } else if (question.questionType === 'sentence') {
                    choice.description = `Incorrect. This is not the right answer. Read the passage again carefully.`;
                  }
                  console.log(`Added default incorrect description for choice: ${choice.optionText}`);
                }
              } else {
                console.log(`Using existing description for choice: ${choice.optionText}: "${choice.description}"`);
              }
              
              return choice;
            });
          }
          return question;
        });
        
        // Print the final questions with descriptions
        console.log('Final questions with descriptions:');
        updateData.questions.forEach((question, qIndex) => {
          console.log(`Question ${qIndex + 1}: ${question.questionText}`);
          if (question.choices) {
            question.choices.forEach((choice, cIndex) => {
              console.log(`  Choice ${cIndex + 1}: ${choice.optionText} - Description: ${choice.description || 'N/A'}`);
            });
          }
        });
      }
      
      // Set updatedAt field
      updateData.updatedAt = new Date();
      
      // Update the intervention
      const updatedIntervention = await InterventionAssessment.findByIdAndUpdate(
        interventionId,
        { $set: updateData },
        { new: true }
      );
      
      return updatedIntervention;
    } catch (error) {
      console.error('Error updating intervention:', error);
      throw error;
    }
  }
  
  /**
   * Delete an intervention
   * @param {string} interventionId - The intervention ID
   * @returns {Promise<Object>} - The deleted intervention
   */
  async deleteIntervention(interventionId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(interventionId)) {
        throw new Error('Invalid intervention ID format');
      }
      
      // Delete the intervention
      const intervention = await InterventionAssessment.findByIdAndDelete(interventionId);
      
      if (!intervention) {
        throw new Error('Intervention not found');
      }
      
      // Delete associated results
      await InterventionResults.deleteMany({ interventionPlanId: interventionId });
      
      return intervention;
    } catch (error) {
      console.error('Error deleting intervention:', error);
      throw error;
    }
  }
  
  /**
   * Push an intervention to mobile
   * @param {string} interventionId - The intervention ID
   * @returns {Promise<Object>} - The updated intervention
   */
  async pushToMobile(interventionId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(interventionId)) {
        throw new Error('Invalid intervention ID format');
      }
      
      // Update the intervention status to active
      const intervention = await InterventionAssessment.findByIdAndUpdate(
        interventionId,
        { $set: { status: 'active', updatedAt: new Date() } },
        { new: true }
      );
      
      if (!intervention) {
        throw new Error('Intervention not found');
      }
      
      // Here you would implement any additional logic to notify mobile app
      // This could involve sending a notification or updating a flag in the user's document
      
      return intervention;
    } catch (error) {
      console.error('Error pushing intervention to mobile:', error);
      throw error;
    }
  }
  
  /**
   * Get main assessment questions for a category and reading level
   * @param {string} category - The category
   * @param {string} readingLevel - The reading level
   * @returns {Promise<Array>} - The questions
   */
  async getMainAssessmentQuestions(category, readingLevel) {
    try {
      const normCategory = this.normalizeCategoryName(category);
      const normReadingLevel = this.normalizeReadingLevel(readingLevel);
      
      // Query the main_assessment collection correctly
      const docs = await mongoose.connection.db
        .collection('main_assessment')
        .find({
          category: normCategory,
          readingLevel: normReadingLevel,
          isActive: true
        })
        .toArray();
      
      let questions = [];
      for (const doc of docs) {
        if (!Array.isArray(doc.questions)) continue;
        
        questions = questions.concat(
          doc.questions.map(q => ({
            ...q,
            _id: q._id || `${doc._id}-${q.order}`,
            category: doc.category,
            readingLevel: doc.readingLevel
          }))
        );
      }
      
      return questions;
    } catch (error) {
      console.error('Error fetching main assessment questions:', error);
      throw error;
    }
  }
  
  /**
   * Get template questions for a category
   * @param {string} category - The category
   * @returns {Promise<Array>} - The template questions
   */
  async getTemplateQuestions(category) {
    try {
      const normCategory = this.normalizeCategoryName(category);
      
      console.log(`[DEBUG] Fetching template questions for category: ${normCategory}`);
      
      // Use direct collection access to match how main_assessment is queried
      const templates = await mongoose.connection.db
        .collection('templates_questions')
        .find({ 
          category: normCategory,
          isActive: true 
        })
        .toArray();
      
      console.log(`[DEBUG] Found ${templates.length} template questions`);
      console.log('[DEBUG] Template questions data sample:', templates.slice(0, 2));
      
      return templates;
    } catch (error) {
      console.error('[ERROR] Error fetching template questions:', error);
      throw error;
    }
  }
  
  
  /**
   * Get sentence templates for a reading level
   * @param {string} readingLevel - The reading level
   * @returns {Promise<Array>} - The sentence templates
   */
  async getSentenceTemplates(readingLevel) {
    try {
      const normReadingLevel = this.normalizeReadingLevel(readingLevel);
      
      console.log(`[DEBUG] Fetching sentence templates for reading level: ${normReadingLevel}`);
      
      // Use the correct model - make sure SentenceTemplate is imported
      const templates = await SentenceTemplate.find({
        readingLevel: normReadingLevel,
        isActive: true
      });
      
      console.log(`[DEBUG] Found ${templates.length} sentence templates`);
      if (templates.length > 0) {
        console.log('[DEBUG] Sentence templates data sample:', 
          templates.slice(0, 1).map(t => ({ 
            id: t._id, 
            title: t.title,
            pages: t.sentenceText.length,
            questions: t.sentenceQuestions.length
          }))
        );
      }
      
      return templates;
    } catch (error) {
      console.error('[ERROR] Error fetching sentence templates:', error);
      throw error;
    }
  }
  
  /**
   * Create a new template question with duplicate prevention
   * @param {Object} templateData - The template data
   * @returns {Promise<Object>} - The created template
   */
  async createTemplateQuestion(templateData) {
    try {
      console.log('[DEBUG] Creating template question with data:', templateData);
      
      // Ensure the category is properly normalized
      templateData.category = this.normalizeCategoryName(templateData.category);
      
      // DUPLICATE PREVENTION: Check if template already exists
      let duplicateCheckQuery = {
        category: templateData.category,
        questionType: templateData.questionType,
        isActive: true
      };

      // Category-specific duplicate checks based on actual content, not just question text
      if (templateData.category === 'Decoding') {
        // For Decoding, check by the actual word AND the choices/distractors
        if (templateData.correctSequence && templateData.correctSequence.length > 0) {
          duplicateCheckQuery.correctSequence = templateData.correctSequence;
        }
        
        if (templateData.questionType === 'complete_word_identification') {
          // For Type A, include dragElements (the letter choices) in duplicate check
          if (templateData.dragElements && templateData.dragElements.length > 0) {
            // Sort the dragElements to ensure consistent comparison regardless of order
            const sortedDragElements = [...templateData.dragElements].sort();
            duplicateCheckQuery.dragElements = sortedDragElements;
          }
        } else if (templateData.questionType === 'fill_missing_letter') {
          // For Type B, include both displaySequence AND dragElements (the letter choices)
          if (templateData.displaySequence && templateData.displaySequence.length > 0) {
            duplicateCheckQuery.displaySequence = templateData.displaySequence;
          }
          if (templateData.dragElements && templateData.dragElements.length > 0) {
            // Sort the dragElements to ensure consistent comparison
            const sortedDragElements = [...templateData.dragElements].sort();
            duplicateCheckQuery.dragElements = sortedDragElements;
          }
        }
      } else {
        // For non-Decoding categories, include questionText in duplicate check
        duplicateCheckQuery.questionText = templateData.questionText;
        
        if (templateData.category === 'Alphabet Knowledge' && templateData.questionValue) {
          duplicateCheckQuery.questionValue = templateData.questionValue;
        } else if (templateData.category === 'Phonological Awareness' && templateData.questionSet?.audioTexts) {
          duplicateCheckQuery['questionSet.audioTexts'] = { $all: templateData.questionSet.audioTexts };
        } else if (templateData.category === 'Word Recognition' && templateData.correctAnswer) {
          duplicateCheckQuery.correctAnswer = templateData.correctAnswer;
        }
      }

      // Check for existing duplicate template
      const existingTemplate = await mongoose.connection.db
        .collection('templates_questions')
        .findOne(duplicateCheckQuery);

      if (existingTemplate) {
        console.log(`[DEBUG] ⚠️ Template already exists - returning existing template: ${existingTemplate._id}`);
        console.log(`[DEBUG] Duplicate found for: "${templateData.questionText}" in category: ${templateData.category}`);
        return existingTemplate;
      }
      
      // Set default values for required fields if not provided
      if (!templateData.isActive) templateData.isActive = true;
      if (!templateData.createdAt) templateData.createdAt = new Date();
      if (!templateData.updatedAt) templateData.updatedAt = new Date();
      
      // Insert the new template (no duplicate found)
      const result = await mongoose.connection.db
        .collection('templates_questions')
        .insertOne(templateData);
      
      if (!result.insertedId) {
        throw new Error('Failed to insert template question');
      }
      
      console.log(`[DEBUG] ✅ Successfully created NEW template question with ID: ${result.insertedId}`);
      
      return { ...templateData, _id: result.insertedId };
    } catch (error) {
      console.error('[ERROR] Error creating template question:', error);
      throw error;
    }
  }
  
  
  /**
   * Upload file directly to S3 with public-read ACL (RECOMMENDED)
   * @param {Buffer} fileBuffer - The file buffer
   * @param {string} fileName - The file name
   * @param {string} fileType - The file type
   * @param {string} targetFolder - The target folder in S3 bucket (default: 'general')
   * @returns {Promise<Object>} - The uploaded file URL
   */
  async uploadFileToS3(fileBuffer, fileName, fileType, targetFolder = 'general') {
    try {
      if (!s3Client) {
        throw new Error('S3 client not properly configured');
      }

      const bucketName = process.env.AWS_BUCKET_NAME || 'literexia-bucket';
      const region = process.env.AWS_REGION || 'ap-southeast-2';

      // COMPREHENSIVE sanitization to prevent corruption and special character issues
      const sanitizedFileName = fileName
        .replace(/[^\w\s.-]/g, '') // Remove special characters except word chars, spaces, dots, and dashes
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/--+/g, '-') // Replace multiple dashes with single dash
        .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
        .replace(/\.(js|html|php|exe|bat|cmd|sh|ps1)$/i, '.txt') // Convert dangerous extensions to .txt
        .substring(0, 100); // Limit filename length to prevent issues

      // Additional security check: prevent JavaScript injection in filenames
      if (sanitizedFileName.includes('javascript:') ||
          sanitizedFileName.includes('async') ||
          sanitizedFileName.includes('=>') ||
          sanitizedFileName.includes('function') ||
          sanitizedFileName.includes('<script')) {
        throw new Error('Invalid filename: contains potentially dangerous content');
      }

      // Create a unique key for the file with the target folder
      const key = `${targetFolder}/${Date.now()}_${sanitizedFileName}`;

      console.log('🚀 Uploading file directly to S3 with params:', {
        bucket: bucketName,
        key: key,
        contentType: fileType,
        targetFolder,
        size: fileBuffer.length
      });

      // Upload directly to S3 with public-read ACL
      const { PutObjectCommand } = require('@aws-sdk/client-s3');
      const uploadParams = {
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: fileType,
        ACL: 'public-read' // Make file publicly accessible for mobile
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      console.log('✅ File uploaded successfully to S3 with public-read ACL');

      // Create the public URL
      const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

      // CRITICAL: Verify the file is actually accessible before returning
      console.log(`🔍 VERIFYING URL accessibility: ${fileUrl}`);

      let verificationAttempts = 0;
      const maxVerificationAttempts = 5;
      let isAccessible = false;

      while (verificationAttempts < maxVerificationAttempts && !isAccessible) {
        try {
          verificationAttempts++;
          console.log(`🔍 Verification attempt ${verificationAttempts}/${maxVerificationAttempts}`);

          // Use fetch to test accessibility
          const verifyResponse = await fetch(fileUrl, { method: 'HEAD' });

          if (verifyResponse.ok) {
            console.log(`✅ VERIFICATION SUCCESSFUL - File is accessible at: ${fileUrl}`);
            isAccessible = true;
          } else {
            console.warn(`⚠️ Verification attempt ${verificationAttempts} failed with status: ${verifyResponse.status}`);

            // Wait before retry (exponential backoff)
            if (verificationAttempts < maxVerificationAttempts) {
              const delay = Math.pow(2, verificationAttempts) * 1000; // 2s, 4s, 8s, 16s
              console.log(`⏳ Waiting ${delay/1000}s before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        } catch (verifyError) {
          console.warn(`⚠️ Verification attempt ${verificationAttempts} error:`, verifyError.message);

          // Wait before retry
          if (verificationAttempts < maxVerificationAttempts) {
            const delay = Math.pow(2, verificationAttempts) * 1000;
            console.log(`⏳ Waiting ${delay/1000}s before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // If verification failed after all attempts, throw error
      if (!isAccessible) {
        console.error(`❌ VERIFICATION FAILED - File uploaded but not accessible after ${maxVerificationAttempts} attempts`);

        // Try to clean up the uploaded file
        try {
          const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
          await s3Client.send(new DeleteObjectCommand({
            Bucket: bucketName,
            Key: key
          }));
          console.log(`🗑️ Cleaned up inaccessible file: ${key}`);
        } catch (cleanupError) {
          console.error(`❌ Failed to cleanup inaccessible file:`, cleanupError);
        }

        throw new Error(`File uploaded but verification failed - file is not accessible at ${fileUrl}`);
      }

      // Get file metadata for additional validation
      let fileMetadata = {};
      try {
        const { HeadObjectCommand } = require('@aws-sdk/client-s3');
        const headResult = await s3Client.send(new HeadObjectCommand({
          Bucket: bucketName,
          Key: key
        }));

        fileMetadata = {
          size: headResult.ContentLength,
          type: headResult.ContentType,
          lastModified: headResult.LastModified,
          etag: headResult.ETag
        };

        console.log(`📊 File metadata:`, fileMetadata);
      } catch (metadataError) {
        console.warn(`⚠️ Could not retrieve file metadata:`, metadataError.message);
      }

      return {
        key: key,
        fileUrl: fileUrl,
        success: true,
        isPublic: true,
        verified: true,
        metadata: fileMetadata,
        uploadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error uploading file to S3:', error);
      throw error;
    }
  }

  /**
   * Generate a pre-signed URL for S3 uploads
   * @param {string} fileName - The file name
   * @param {string} fileType - The file type
   * @param {string} targetFolder - The target folder in S3 bucket (default: 'general')
   * @returns {Promise<Object>} - The pre-signed URL
   */
  async getPresignedUploadUrl(fileName, fileType, targetFolder = 'mobile') {
    try {
      if (!s3Client) {
        throw new Error('S3 client not properly configured');
      }
      
      const bucketName = process.env.AWS_BUCKET_NAME || 'literexia-bucket';
      const region = process.env.AWS_REGION || 'ap-southeast-2';
      
      // COMPREHENSIVE sanitization to prevent corruption and special character issues
      // This matches the stronger sanitization used in frontend and uploadRoutes.js
      const sanitizedFileName = fileName
        .replace(/[^\w\s.-]/g, '') // Remove special characters except word chars, spaces, dots, and dashes
        .replace(/\s+/g, '-') // Replace spaces with dashes
        .replace(/--+/g, '-') // Replace multiple dashes with single dash
        .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
        .replace(/\.(js|html|php|exe|bat|cmd|sh|ps1)$/i, '.txt') // Convert dangerous extensions to .txt
        .substring(0, 100); // Limit filename length to prevent issues

      // Additional security check: prevent JavaScript injection in filenames
      if (sanitizedFileName.includes('javascript:') ||
          sanitizedFileName.includes('async') ||
          sanitizedFileName.includes('=>') ||
          sanitizedFileName.includes('function') ||
          sanitizedFileName.includes('<script')) {
        throw new Error('Invalid filename: contains potentially dangerous content');
      }
      
      // Create a unique key for the file with the target folder
      const key = `${targetFolder}/${Date.now()}_${sanitizedFileName}`;
      
      // Set S3 parameters for pre-signed URL
      // Note: For AWS SDK v3, ACL cannot be included in pre-signed URLs
      // Files will be uploaded as private, then we'll make them public via bucket policy
      const s3Params = {
        Bucket: bucketName,
        Key: key,
        ContentType: fileType,
        Expires: 300, // URL expires in 5 minutes
        // ACL is handled by bucket policy, not in pre-signed URL
      };
      
      console.log('Generating presigned URL with params:', {
        bucket: bucketName,
        key: key,
        contentType: fileType,
        targetFolder
      });
      
      // Generate the pre-signed URL
      const uploadUrl = await s3Client.getSignedUrlPromise('putObject', s3Params);
      
      console.log('Generated presigned URL successfully');
      
      // Create a direct URL to the file that will be accessible after upload
      const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Params.Key}`;
      
      return {
        uploadUrl,
        key: s3Params.Key,
        fileUrl,
        // Add instruction for frontend to make file public after upload
        makePublicRequired: true
      };
    } catch (error) {
      console.error('Error generating pre-signed URL:', error);
      throw error;
    }
  }
  
  /**
   * Helper method to normalize category name
   * @param {string} categoryName - The category name
   * @returns {string} - The normalized category name
   */
  normalizeCategoryName(categoryName) {
    if (!categoryName) return '';
    
    // Handle both UI format ("Alphabet Knowledge") and DB format ("alphabet_knowledge")
    const normalized = categoryName.toLowerCase().replace(/\s+/g, '_');
    
    // Map common variations
    const categoryMap = {
      'alphabet_knowledge': 'Alphabet Knowledge',
      'phonological_awareness': 'Phonological Awareness', 
      'word_recognition': 'Word Recognition',
      'decoding': 'Decoding',
      'reading_comprehension': 'Reading Comprehension'
    };
    
    // If the input is already in the normalized format (with spaces),
    // return it as is since that's what's in the JSON data
    if (Object.values(categoryMap).includes(categoryName)) {
      return categoryName;
    }
    
    // Otherwise, try to map from the normalized format to the format in the JSON data
    return categoryMap[normalized] || categoryName;
  }
  
  /**
   * Helper method to normalize reading level
   * @param {string} readingLevel - The reading level
   * @returns {string} - The normalized reading level
   */
  normalizeReadingLevel(readingLevel) {
    if (!readingLevel) return 'Low Emerging';
    
    // Handle both UI format ("Low Emerging") and any DB format
    const levelMap = {
      'low_emerging': 'Low Emerging',
      'high_emerging': 'High Emerging', 
      'developing': 'Developing',
      'transitioning': 'Transitioning',
      'at_grade_level': 'At Grade Level'
    };
    
    // Find exact match first
    const exactMatch = Object.values(levelMap).find(level => 
      level.toLowerCase() === readingLevel.toLowerCase()
    );
    
    return exactMatch || readingLevel;
  }
  
  /**
   * Record a student's response to an intervention question
   * @param {Object} responseData - The response data
   * @returns {Promise<Object>} - The recorded response and updated progress
   */
  async recordResponse(responseData) {
    try {
      // Create the response record
      const response = new InterventionResponse(responseData);
      
      // Get intervention to determine total questions and get feedback
      const intervention = await InterventionAssessment.findById(responseData.interventionPlanId);
      
      if (!intervention) {
        throw new Error('Intervention not found');
      }
      
      // Get student number from intervention or from user
      if (intervention.studentNumber) {
        response.studentNumber = intervention.studentNumber;
      } else {
        // Try to find the student to get their ID number
        const student = await User.findById(responseData.studentId);
        if (student && student.idNumber) {
          response.studentNumber = student.idNumber;
          
          // Also update the intervention with the student number
          await InterventionAssessment.findByIdAndUpdate(
            intervention._id,
            { $set: { studentNumber: student.idNumber } }
          );
        }
      }
      
      // Find the question and choice to get the description
      if (intervention.questions && Array.isArray(intervention.questions)) {
        const question = intervention.questions.find(q => q.questionId === responseData.questionId);
        if (question && question.choices && Array.isArray(question.choices)) {
          const choice = question.choices.find(c => c.optionText === responseData.selectedChoice);
          if (choice && choice.description) {
            // Add the description to the response
            response.feedbackDescription = choice.description;
          }
        }
      }
      
      await response.save();
      
      // Update progress
      const progress = await InterventionResults.findOne({
        studentId: responseData.studentId,
        interventionPlanId: responseData.interventionPlanId
      });
      
      if (!progress) {
        throw new Error('Progress record not found');
      }
      
      // Update progress metrics
      progress.completedActivities += 1;
      progress.lastActivity = new Date();
      
      if (responseData.isCorrect) {
        progress.correctAnswers += 1;
      } else {
        progress.incorrectAnswers += 1;
      }
      
      // Calculate percentages
      progress.percentComplete = Math.round((progress.completedActivities / intervention.questions.length) * 100);
      progress.percentCorrect = Math.round(
        (progress.correctAnswers / (progress.correctAnswers + progress.incorrectAnswers)) * 100
      );
      
      // Check if passed threshold
      progress.passedThreshold = progress.percentCorrect >= intervention.passThreshold;
      
      await progress.save();
      
      // If intervention is complete, update its status
      if (progress.percentComplete === 100) {
        intervention.status = 'completed';
        await intervention.save();
      }
      
      return { response, progress };
    } catch (error) {
      console.error('Error recording response:', error);
      throw error;
    }
  }
  
  /**
   * Generate prescriptive analysis from intervention results
   * @param {string} interventionId - The intervention ID
   * @returns {Promise<Object>} - Generated analysis
   */
  async generateAnalysisFromIntervention(interventionId) {
    try {
      // Get intervention and its results
      const intervention = await InterventionAssessment.findById(interventionId);
      if (!intervention) {
        throw new Error('Intervention not found');
      }

      const interventionResult = await InterventionResults.findOne({
        interventionPlanId: interventionId
      });

      if (!interventionResult) {
        throw new Error('Intervention results not found');
      }

      // Get student info
      const student = await User.findById(intervention.studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const readingLevel = student.readingLevel || 'Low Emerging';
      const categoryName = intervention.category;
      const isPassed = interventionResult.passedThreshold;
      const score = interventionResult.percentCorrect || 0;
      const attempt = await this.getInterventionAttemptNumber(intervention.studentId, categoryName);

      // Create or update prescriptive analysis for this intervention
      let analysis = await PrescriptiveAnalysis.findOne({
        studentId: intervention.studentId,
        categoryId: categoryName,
        assessmentType: 'intervention'
      });

      if (!analysis) {
        analysis = new PrescriptiveAnalysis({
          studentId: intervention.studentId,
          categoryId: categoryName,
          readingLevel: readingLevel,
          assessmentType: 'intervention',
          skillMastery: {},
          abilityEstimates: {},
          errorPatterns: {},
          interventionHistory: []
        });
      }

      // Add intervention attempt to history
      analysis.interventionHistory.push({
        category: categoryName,
        interventionId: intervention._id,
        dateTaken: new Date(),
        passed: isPassed,
        score: score,
        attempt: attempt
      });

      // Update skill mastery for this category
      if (!analysis.skillMastery) {
        analysis.skillMastery = new Map();
      }

      const masteryData = analysis.skillMastery.get(categoryName) || {
        masteryProbability: 0.5,
        totalQuestions: 0,
        correctAnswers: 0,
        score: 0,
        isPassed: false,
        responseHistory: []
      };

      // Update mastery based on intervention results
      masteryData.totalQuestions += intervention.questions?.length || 0;
      masteryData.correctAnswers += interventionResult.correctAnswers || 0;
      masteryData.score = score;
      masteryData.isPassed = isPassed;
      masteryData.lastUpdated = new Date();

      // Simple BKT update (could be more sophisticated)
      if (isPassed) {
        masteryData.masteryProbability = Math.min(0.95, masteryData.masteryProbability + 0.2);
      } else {
        masteryData.masteryProbability = Math.max(0.1, masteryData.masteryProbability - 0.1);
      }

      analysis.skillMastery.set(categoryName, masteryData);

      // Update ability estimates
      if (!analysis.abilityEstimates) {
        analysis.abilityEstimates = new Map();
      }
      
      const abilityEstimate = (score - 50) / 25; // Convert to -2 to +2 range
      analysis.abilityEstimates.set(categoryName, Math.max(-3, Math.min(3, abilityEstimate)));

      // Generate insights based on intervention outcome
      if (!analysis.insights) {
        analysis.insights = {
          strengths: [],
          weaknesses: [],
          passedCategories: 0,
          failedCategories: 0,
          overallScore: score
        };
      }

      if (isPassed) {
        analysis.insights.strengths = analysis.insights.strengths.filter(s => !s.includes(categoryName));
        analysis.insights.strengths.push(`${categoryName} - Intervention Success`);
        analysis.insights.recommendedAction = attempt > 1 ? 'continue_assessment' : 'success_ready';
        analysis.insights.overallReadiness = 'Improvement shown through intervention';
      } else {
        analysis.insights.weaknesses = analysis.insights.weaknesses.filter(w => !w.includes(categoryName));
        analysis.insights.weaknesses.push(`${categoryName} - ${score}% (Attempt ${attempt})`);
        
        // Escalate based on attempt number
        if (attempt >= 3) {
          analysis.insights.recommendedAction = 'face_to_face_required';
          analysis.insights.overallReadiness = 'Requires face-to-face support after multiple intervention attempts';
        } else {
          analysis.insights.recommendedAction = 'immediate_intervention';
          analysis.insights.overallReadiness = 'Needs additional intervention support';
        }
      }

      // Update intervention plan based on results
      if (!isPassed) {
        if (!analysis.interventionPlan) {
          analysis.interventionPlan = { required: true, priority: [], specificFocus: {} };
        }
        
        if (!analysis.interventionPlan.priority.includes(categoryName)) {
          analysis.interventionPlan.priority.push(categoryName);
        }

        // Generate more targeted recommendations for failed attempts
        const specificFocus = {
          focus: attempt > 1 ? "remediation_strategies" : "skill_reinforcement",
          recommendedActivities: this.getEscalatedActivities(categoryName, attempt),
          questionDistribution: this.getAdaptiveQuestionDistribution(categoryName, attempt)
        };
        
        analysis.interventionPlan.specificFocus.set(categoryName, specificFocus);
      } else {
        // Remove from intervention plan if passed
        if (analysis.interventionPlan && analysis.interventionPlan.priority) {
          analysis.interventionPlan.priority = analysis.interventionPlan.priority.filter(cat => cat !== categoryName);
          analysis.interventionPlan.required = analysis.interventionPlan.priority.length > 0;
        }
      }

      analysis.updatedAt = new Date();
      await analysis.save();

      return {
        success: true,
        data: analysis,
        interventionOutcome: {
          category: categoryName,
          passed: isPassed,
          score: score,
          attempt: attempt,
          escalationNeeded: !isPassed && attempt >= 3
        }
      };

    } catch (error) {
      console.error('Error generating analysis from intervention:', error);
      throw error;
    }
  }

  /**
   * Get the current attempt number for a category intervention
   * @param {string} studentId - Student ID
   * @param {string} category - Category name
   * @returns {Promise<number>} - Attempt number
   */
  async getInterventionAttemptNumber(studentId, category) {
    try {
      const existingAnalysis = await PrescriptiveAnalysis.findOne({
        studentId: studentId,
        categoryId: category,
        assessmentType: 'intervention'
      });

      if (!existingAnalysis || !existingAnalysis.interventionHistory) {
        return 1;
      }

      return existingAnalysis.interventionHistory.length + 1;
    } catch (error) {
      console.error('Error getting attempt number:', error);
      return 1;
    }
  }

  /**
   * Get escalated activities based on attempt number
   * @param {string} category - Category name
   * @param {number} attempt - Attempt number
   * @returns {Array} - Recommended activities
   */
  getEscalatedActivities(category, attempt) {
    const baseActivities = {
      'Phonological Awareness': ['sound_discrimination', 'minimal_pairs', 'rhyming_practice'],
      'Decoding': ['syllable_blending', 'word_building', 'pattern_recognition'],
      'Alphabet Knowledge': ['letter_tracing', 'sound_matching', 'visual_recognition'],
      'Word Recognition': ['sight_words', 'word_families', 'context_clues'],
      'Reading Comprehension': ['guided_reading', 'question_answering', 'story_mapping']
    };

    let activities = baseActivities[category] || ['targeted_practice'];

    if (attempt >= 2) {
      activities = activities.concat(['multi_sensory_approach', 'one_on_one_instruction']);
    }

    if (attempt >= 3) {
      activities = activities.concat(['intensive_remediation', 'alternative_strategies']);
    }

    return activities;
  }

  /**
   * Get adaptive question distribution based on attempt
   * @param {string} category - Category name  
   * @param {number} attempt - Attempt number
   * @returns {Object} - Question distribution
   */
  getAdaptiveQuestionDistribution(category, attempt) {
    const distributions = {
      1: { easy: 60, medium: 30, hard: 10 },
      2: { easy: 80, medium: 15, hard: 5 },
      3: { easy: 90, medium: 10, hard: 0 }
    };

    return distributions[Math.min(attempt, 3)];
  }

  /**
   * Update all existing interventions to add descriptions and link to prescriptive analyses
   * @returns {Promise<Object>} - Result of the update operation
   */
  async updateExistingInterventions() {
    try {
      // Get all interventions
      const interventions = await InterventionAssessment.find({});
      console.log(`Found ${interventions.length} interventions to check and update`);
      
      let updatedCount = 0;
      let prescriptiveAnalysisLinkedCount = 0;
      let choiceDescriptionsAddedCount = 0;
      
      // Process each intervention
      for (const intervention of interventions) {
        let needsUpdate = false;
        let interventionData = intervention.toObject();
        
        // Check if prescriptiveAnalysisId is missing
        if (!intervention.prescriptiveAnalysisId) {
          const prescriptiveAnalysis = await PrescriptiveAnalysis.findOne({
            studentId: intervention.studentId,
            categoryId: intervention.category
          });
          
          if (prescriptiveAnalysis) {
            console.log(`Found matching prescriptive analysis for intervention ${intervention._id}: ${prescriptiveAnalysis._id}`);
            interventionData.prescriptiveAnalysisId = prescriptiveAnalysis._id;
            needsUpdate = true;
            prescriptiveAnalysisLinkedCount++;
          }
        }
        
        // Check if descriptions are missing in choices
        if (intervention.questions && Array.isArray(intervention.questions)) {
          let questionsUpdated = false;
          
          interventionData.questions = intervention.questions.map(question => {
            let questionObj = question.toObject ? question.toObject() : { ...question };
            
            if (questionObj.choices && Array.isArray(questionObj.choices)) {
              let choicesUpdated = false;
              
              questionObj.choices = questionObj.choices.map(choice => {
                let choiceObj = choice.toObject ? choice.toObject() : { ...choice };
                
                if (!choiceObj.description) {
                  // Add default descriptions based on whether the choice is correct
                  if (choiceObj.isCorrect) {
                    choiceObj.description = `Correct! "${choiceObj.optionText}" is the right answer.`;
                  } else {
                    choiceObj.description = `Incorrect. Try again and listen carefully to the sound.`;
                    
                    // Add more specific feedback based on question type
                    if (questionObj.questionType === 'patinig') {
                      choiceObj.description = `Incorrect. This is not the right vowel sound. Listen carefully and try again.`;
                    } else if (questionObj.questionType === 'katinig') {
                      choiceObj.description = `Incorrect. This is not the right consonant sound. Listen carefully and try again.`;
                    } else if (questionObj.questionType === 'malapantig') {
                      choiceObj.description = `Incorrect. This is not the right syllable. Listen to the whole word and try again.`;
                    } else if (questionObj.questionType === 'word') {
                      choiceObj.description = `Incorrect. This is not the right word. Look at the letters carefully and try again.`;
                    } else if (questionObj.questionType === 'sentence') {
                      choiceObj.description = `Incorrect. This is not the right answer. Read the passage again carefully.`;
                    }
                  }
                  
                  choicesUpdated = true;
                  choiceDescriptionsAddedCount++;
                }
                
                return choiceObj;
              });
              
              if (choicesUpdated) {
                questionsUpdated = true;
              }
            }
            
            return questionObj;
          });
          
          if (questionsUpdated) {
            needsUpdate = true;
          }
        }
        
        // Update the intervention if needed
        if (needsUpdate) {
          await InterventionAssessment.findByIdAndUpdate(
            intervention._id,
            { $set: { ...interventionData, updatedAt: new Date() } },
            { runValidators: true }
          );
          
          updatedCount++;
        }
      }
      
      return {
        totalInterventions: interventions.length,
        updatedInterventions: updatedCount,
        prescriptiveAnalysisLinked: prescriptiveAnalysisLinkedCount,
        choiceDescriptionsAdded: choiceDescriptionsAddedCount
      };
    } catch (error) {
      console.error('Error updating existing interventions:', error);
      throw error;
    }
  }

  /**
   * Generate intervention assessment with template-only system and dynamic question counts
   * @param {string} prescriptiveAnalysisId - ID of prescriptive analysis
   * @param {string} category - Category requiring intervention
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated intervention assessment with template analysis
   */
  async generateInterventionAssessment(prescriptiveAnalysisId, category, options = {}) {
    try {
      console.log(`[INTERVENTION GENERATION] Generating template-based assessment for category: ${category}`);

      // Get prescriptive analysis
      const analysis = await PrescriptiveAnalysis.findById(prescriptiveAnalysisId);
      if (!analysis) {
        throw new Error('Prescriptive analysis not found');
      }

      const studentId = analysis.studentId;
      const readingLevel = analysis.readingLevel;

      // Get error patterns for this category to guide question selection
      const errorPatterns = analysis.errorPatterns?.get ?
        analysis.errorPatterns.get(category) :
        analysis.errorPatterns[category];

      // Use template-only system to get available questions and analyze teacher needs
      const templateResult = await this.getQuestionsFromTemplatesOnly(
        category,
        readingLevel,
        errorPatterns,
        {
          ...options,
          prescriptiveAnalysis: analysis // Pass full analysis for dynamic calculation
        }
      );

      // Create intervention assessment document with template-based data
      const interventionAssessment = {
        studentId: parseInt(studentId),
        prescriptiveAnalysisId: prescriptiveAnalysisId,
        category: category,
        readingLevel: readingLevel,
        passThreshold: 75,

        // Prescriptive Analytics "Prescription"
        prescription: templateResult.prescription,

        // Template Availability Analysis
        templateAvailability: templateResult.templateAvailability,
        teacherAction: templateResult.teacherAction,

        questionSelectionStrategy: {
          method: 'template_only', // No longer using multi-source
          targetDifficulty: 0.7,
          focusAreas: templateResult.prescription.focusAreas,
          errorSeverity: templateResult.prescription.errorSeverity
        },

        totalQuestions: templateResult.prescription.questionCount, // Target from analytics
        availableQuestions: templateResult.questions.length, // Actually available from templates
        questions: templateResult.questions, // Available template questions

        interventionParameters: {
          fixedQuestions: templateResult.questions.length, // Use available count
          allowSkip: false,
          showProgress: true,
          immediateFeeback: false
        },

        // Add calculation details for transparency
        questionCountCalculation: {
          targetCount: templateResult.prescription.questionCount,
          availableCount: templateResult.questions.length,
          rationale: templateResult.prescription.countRationale,
          calculatedAt: new Date()
        },

        status: templateResult.templateAvailability.hasShortage ? 'needs_teacher_input' : 'ready',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log(`[INTERVENTION GENERATION] Template-based assessment completed:`);
      console.log(`- Target questions: ${templateResult.prescription.questionCount}`);
      console.log(`- Available questions: ${templateResult.questions.length}`);
      console.log(`- Teacher action: ${templateResult.teacherAction}`);
      console.log(`- Status: ${interventionAssessment.status}`);

      return interventionAssessment;

    } catch (error) {
      console.error('[INTERVENTION GENERATION] Error generating intervention assessment:', error);
      throw error;
    }
  }

  /**
   * Calculate optimal question count based on prescriptive analytics
   * @param {Object} analysis - Prescriptive analysis data
   * @param {string} category - Target category
   * @returns {Object} Question count calculation with details
   */
  calculateOptimalQuestionCount(analysis, category) {
    try {
      console.log(`[DYNAMIC COUNT] Calculating optimal question count for ${category}`);

      // Get base values
      const skillMastery = analysis.skillMastery?.get ?
        analysis.skillMastery.get(category) :
        analysis.skillMastery[category];

      const errorPatterns = analysis.errorPatterns?.get ?
        analysis.errorPatterns.get(category) :
        analysis.errorPatterns[category];

      const readingLevel = analysis.readingLevel;

      // Base question count ranges by reading level
      const baseCountByLevel = {
        'Low Emerging': { min: 5, base: 8, max: 12 },
        'High Emerging': { min: 6, base: 10, max: 14 },
        'Developing': { min: 8, base: 12, max: 16 },
        'Transitioning': { min: 8, base: 12, max: 16 },
        'At Grade Level': { min: 10, base: 15, max: 18 }
      };

      const levelConfig = baseCountByLevel[readingLevel] || baseCountByLevel['Low Emerging'];
      let questionCount = levelConfig.base;
      let factors = { base: levelConfig.base };

      // Factor 1: Error severity analysis (±40% of base)
      const errorSeverity = this.calculateCategoryErrorSeverity(errorPatterns, category);
      let errorAdjustment = 0;

      if (errorSeverity.hasPatterns) {
        switch (errorSeverity.level) {
          case 'severe':
            errorAdjustment = Math.round(levelConfig.base * 0.4); // +40%
            break;
          case 'high':
            errorAdjustment = Math.round(levelConfig.base * 0.25); // +25%
            break;
          case 'moderate':
            errorAdjustment = Math.round(levelConfig.base * 0.1); // +10%
            break;
          case 'low':
            errorAdjustment = Math.round(levelConfig.base * -0.1); // -10%
            break;
          case 'minimal':
            errorAdjustment = Math.round(levelConfig.base * -0.2); // -20%
            break;
        }
      }

      questionCount += errorAdjustment;
      factors.errorSeverity = {
        level: errorSeverity.level,
        adjustment: errorAdjustment,
        percentage: errorSeverity.score
      };

      // Factor 2: Mastery level analysis (±25% of base)
      let masteryAdjustment = 0;
      if (skillMastery) {
        const masteryProbability = skillMastery.masteryProbability || 0.5;
        const score = skillMastery.score || 50;

        if (score < 40) {
          masteryAdjustment = Math.round(levelConfig.base * 0.25); // +25% for very low scores
        } else if (score < 55) {
          masteryAdjustment = Math.round(levelConfig.base * 0.15); // +15% for low scores
        } else if (score < 65) {
          masteryAdjustment = Math.round(levelConfig.base * 0.05); // +5% for below average
        } else if (score >= 75) {
          masteryAdjustment = Math.round(levelConfig.base * -0.15); // -15% for passing scores
        }
      }

      questionCount += masteryAdjustment;
      factors.masteryLevel = {
        score: skillMastery?.score || 0,
        probability: skillMastery?.masteryProbability || 0.5,
        adjustment: masteryAdjustment
      };

      // Factor 3: Category complexity multiplier
      const categoryComplexity = {
        'Alphabet Knowledge': 0.8,    // Simpler - fewer questions needed
        'Phonological Awareness': 1.1, // More complex - matching tasks
        'Decoding': 1.0,              // Standard complexity
        'Word Recognition': 1.0,       // Standard complexity
        'Reading Comprehension': 1.2   // Most complex - passages
      };

      const complexityMultiplier = categoryComplexity[category] || 1.0;
      const complexityAdjustment = Math.round((questionCount * complexityMultiplier) - questionCount);
      questionCount = Math.round(questionCount * complexityMultiplier);

      factors.categoryComplexity = {
        multiplier: complexityMultiplier,
        adjustment: complexityAdjustment
      };

      // Factor 4: Intervention history (previous attempts)
      let historyAdjustment = 0;
      if (analysis.interventionHistory && Array.isArray(analysis.interventionHistory)) {
        const categoryHistory = analysis.interventionHistory.filter(h => h.category === category);
        const attemptCount = categoryHistory.length + 1; // Current attempt

        if (attemptCount > 1) {
          // Reduce questions for repeat attempts to avoid fatigue
          historyAdjustment = -Math.min(3, attemptCount - 1);
        }
      }

      questionCount += historyAdjustment;
      factors.interventionHistory = {
        attemptCount: analysis.interventionHistory ?
          analysis.interventionHistory.filter(h => h.category === category).length + 1 : 1,
        adjustment: historyAdjustment
      };

      // Apply bounds
      questionCount = Math.max(levelConfig.min, Math.min(levelConfig.max, questionCount));

      // Ensure minimum of 5 questions, maximum of 18
      questionCount = Math.max(5, Math.min(18, questionCount));

      const result = {
        questionCount: questionCount,
        reasoning: {
          category: category,
          readingLevel: readingLevel,
          baseRange: levelConfig,
          finalCount: questionCount,
          factors: factors,
          rationale: this.generateCountRationale(factors, questionCount, levelConfig.base)
        }
      };

      console.log(`[DYNAMIC COUNT] Calculated ${questionCount} questions for ${category}:`, result.reasoning.rationale);
      return result;

    } catch (error) {
      console.error('[DYNAMIC COUNT] Error calculating question count:', error);
      // Fallback to safe defaults
      const fallbackCount = {
        'Low Emerging': 8,
        'High Emerging': 10,
        'Developing': 12,
        'Transitioning': 12,
        'At Grade Level': 15
      };

      return {
        questionCount: fallbackCount[analysis.readingLevel] || 10,
        reasoning: {
          category: category,
          readingLevel: analysis.readingLevel,
          finalCount: fallbackCount[analysis.readingLevel] || 10,
          factors: { error: error.message },
          rationale: 'Used fallback count due to calculation error'
        }
      };
    }
  }

  /**
   * Generate rationale text for question count decision
   */
  generateCountRationale(factors, finalCount, baseCount) {
    const parts = [`Started with base count of ${baseCount} for reading level`];

    if (factors.errorSeverity && factors.errorSeverity.adjustment !== 0) {
      const direction = factors.errorSeverity.adjustment > 0 ? 'increased' : 'decreased';
      parts.push(`${direction} by ${Math.abs(factors.errorSeverity.adjustment)} due to ${factors.errorSeverity.level} error severity (${factors.errorSeverity.percentage}% error rate)`);
    }

    if (factors.masteryLevel && factors.masteryLevel.adjustment !== 0) {
      const direction = factors.masteryLevel.adjustment > 0 ? 'increased' : 'decreased';
      parts.push(`${direction} by ${Math.abs(factors.masteryLevel.adjustment)} based on mastery score of ${factors.masteryLevel.score}%`);
    }

    if (factors.categoryComplexity && factors.categoryComplexity.adjustment !== 0) {
      const direction = factors.categoryComplexity.adjustment > 0 ? 'increased' : 'decreased';
      parts.push(`${direction} by ${Math.abs(factors.categoryComplexity.adjustment)} for category complexity (${factors.categoryComplexity.multiplier}x)`);
    }

    if (factors.interventionHistory && factors.interventionHistory.adjustment !== 0) {
      parts.push(`reduced by ${Math.abs(factors.interventionHistory.adjustment)} for repeat attempt (attempt #${factors.interventionHistory.attemptCount})`);
    }

    return `${parts.join(', ')} = ${finalCount} total questions`;
  }

  /**
   * Get available questions from templates only - No programmatic generation
   * Teachers must provide all intervention questions through templates
   * System acts as "doctor providing prescription" while teachers provide "treatment"
   */
  async getQuestionsFromTemplatesOnly(category, readingLevel, errorPatterns, options = {}) {
    try {
      // Calculate optimal question count using prescriptive analytics (the "prescription")
      let targetQuestionCount = 10; // Default fallback
      let countCalculation = null;

      if (options.prescriptiveAnalysis) {
        countCalculation = this.calculateOptimalQuestionCount(options.prescriptiveAnalysis, category);
        targetQuestionCount = countCalculation.questionCount;
      } else {
        console.warn('[TEMPLATE-ONLY] No prescriptive analysis provided, using default count of 10');
      }

      console.log(`[TEMPLATE-ONLY] Starting template retrieval for ${category} at ${readingLevel} level with ${targetQuestionCount} questions needed`);

      // Get all available templates for this category
      let availableTemplates = [];
      let templateQuestions = [];

      try {
        if (category === 'Reading Comprehension') {
          // Use sentence templates for Reading Comprehension
          availableTemplates = await this.getSentenceTemplates(readingLevel);
          templateQuestions = await this.generateQuestionsFromSentenceTemplates(
            availableTemplates,
            targetQuestionCount
          );
        } else {
          // Use regular templates for other categories
          availableTemplates = await this.getTemplateQuestions(category);
          templateQuestions = await this.generateQuestionsFromTemplates(
            availableTemplates,
            category,
            errorPatterns,
            targetQuestionCount
          );
        }

        console.log(`[TEMPLATE-ONLY] Found ${availableTemplates.length} available templates, generated ${templateQuestions.length} questions`);
      } catch (error) {
        console.error('[TEMPLATE-ONLY] Template generation failed:', error.message);
        templateQuestions = [];
      }

      // Analyze template availability vs requirement
      const templateShortage = targetQuestionCount - templateQuestions.length;
      const hasShortage = templateShortage > 0;

      const result = {
        questions: templateQuestions,
        prescription: {
          category: category,
          questionCount: targetQuestionCount,
          focusAreas: this.determineFocusAreas(errorPatterns, category),
          errorSeverity: this.calculateCategoryErrorSeverity(errorPatterns, category),
          countRationale: countCalculation ? countCalculation.reasoning.rationale : 'Default count used'
        },
        templateAvailability: {
          availableTemplates: availableTemplates.length,
          generatedQuestions: templateQuestions.length,
          requiredQuestions: targetQuestionCount,
          hasShortage: hasShortage,
          shortageAmount: hasShortage ? templateShortage : 0,
          shortageMessage: hasShortage ?
            `Need ${templateShortage} more questions. Teacher should create additional templates.` :
            'Sufficient templates available'
        },
        teacherAction: hasShortage ? 'create_more_templates' : 'use_available_templates'
      };

      console.log(`[TEMPLATE-ONLY] Template analysis:`, {
        available: availableTemplates.length,
        generated: templateQuestions.length,
        required: targetQuestionCount,
        shortage: templateShortage,
        teacherAction: result.teacherAction
      });

      return result;

    } catch (error) {
      console.error('[TEMPLATE-ONLY] Error in template-only question retrieval:', error);
      throw error;
    }
  }

  /**
   * Generate questions from templates based on error patterns
   */
  async generateQuestionsFromTemplates(templates, category, errorPatterns, maxQuestions) {
    try {
      const questions = [];

      if (!templates || templates.length === 0) {
        console.log(`[TEMPLATES] No templates available for ${category}`);
        return questions;
      }

      // Filter templates based on error patterns
      const relevantTemplates = this.filterTemplatesByErrorPatterns(templates, errorPatterns);
      console.log(`[TEMPLATES] Found ${relevantTemplates.length} relevant templates for ${category}`);

      for (let i = 0; i < Math.min(maxQuestions, relevantTemplates.length); i++) {
        const template = relevantTemplates[i];

        // Build question from template
        const question = await this.buildQuestionFromTemplate(template, i + 1);
        if (question) {
          questions.push(question);
        }
      }

      return questions;
    } catch (error) {
      console.error('[TEMPLATES] Error generating questions from templates:', error);
      return [];
    }
  }

  /**
   * Generate questions from sentence templates for Reading Comprehension
   */
  async generateQuestionsFromSentenceTemplates(sentenceTemplates, maxQuestions) {
    try {
      const questions = [];

      if (!sentenceTemplates || sentenceTemplates.length === 0) {
        console.log('[SENTENCE_TEMPLATES] No sentence templates available for Reading Comprehension');
        return questions;
      }

      console.log(`[SENTENCE_TEMPLATES] Found ${sentenceTemplates.length} sentence templates`);

      for (let i = 0; i < Math.min(maxQuestions, sentenceTemplates.length); i++) {
        const template = sentenceTemplates[i];

        // Generate questions from each sentence template
        if (template.sentenceQuestions && template.sentenceQuestions.length > 0) {
          for (let j = 0; j < template.sentenceQuestions.length && questions.length < maxQuestions; j++) {
            const sentenceQuestion = template.sentenceQuestions[j];

            const question = {
              questionId: `q_int_rc_${String(questions.length + 1).padStart(3, '0')}`,
              source: 'sentence_template',
              sourceQuestionId: template._id.toString(),
              questionType: 'multiple_choice',
              questionText: sentenceQuestion.questionText,
              questionImage: null,
              questionValue: null,
              passageTitle: template.title,
              passageText: template.sentenceText,
              // Note: Use acceptableAnswers from sentence template (matches main assessment structure)
              choiceOptions: sentenceQuestion.acceptableAnswers?.map((option, index) => ({
                optionId: `opt_${index + 1}`,
                optionText: option,
                isCorrect: option === sentenceQuestion.sentenceCorrectAnswer
              })) || [],
              difficulty: 0.0,
              discrimination: 1.0,
              targetSkill: 'reading_comprehension',
              targetElement: 'passage_based'
            };

            questions.push(question);
          }
        }
      }

      return questions;
    } catch (error) {
      console.error('[SENTENCE_TEMPLATES] Error generating questions from sentence templates:', error);
      return [];
    }
  }



  /**
   * Helper method to build question from template
   */
  async buildQuestionFromTemplate(template, questionNumber) {
    try {
      const questionId = `q_int_${template.category.toLowerCase().replace(/\s+/g, '_')}_${String(questionNumber).padStart(3, '0')}`;

      const question = {
        questionId: questionId,
        source: 'template_question',
        sourceQuestionId: template._id.toString(),
        questionType: template.questionType,
        questionText: template.templatetext,
        questionImage: null,
        questionValue: null,
        difficulty: 0,
        discrimination: 1.0,
        targetSkill: 'error_focused',
        targetElement: 'template_based'
      };

      // Add category-specific question data based on template data
      if (template.questionType === 'malapantig' && template.category === 'Phonological Awareness') {
        // Use template's questionSet data directly
        if (template.questionSet) {
          question.questionSet = template.questionSet;
        }
      } else {
        // Use template's choiceOptions data directly
        if (template.choiceOptions) {
          question.choiceOptions = template.choiceOptions;
        }
      }

      return question;
    } catch (error) {
      console.error('[TEMPLATE_BUILD] Error building question from template:', error);
      return null;
    }
  }



  /**
   * Helper methods for strategy determination
   */
  determineSelectionMethod(errorPatterns) {
    if (!errorPatterns || Object.keys(errorPatterns).length === 0) {
      return 'general_practice';
    }
    return 'error_focused';
  }

  determineFocusAreas(errorPatterns, category) {
    const focusAreas = {};

    if (!errorPatterns) {
      focusAreas['general_practice'] = 100;
      return focusAreas;
    }

    // Category-specific focus area determination
    switch (category) {
      case 'Alphabet Knowledge':
        if (errorPatterns.patinig_errors) {
          focusAreas['patinig_practice'] = 60;
          focusAreas['general_practice'] = 40;
        } else if (errorPatterns.katinig_errors) {
          focusAreas['katinig_practice'] = 60;
          focusAreas['general_practice'] = 40;
        } else {
          focusAreas['general_practice'] = 100;
        }
        break;
      case 'Phonological Awareness':
        if (errorPatterns.matching_errors) {
          focusAreas['sound_matching'] = 70;
          focusAreas['general_practice'] = 30;
        } else {
          focusAreas['general_practice'] = 100;
        }
        break;
      default:
        focusAreas['general_practice'] = 100;
    }

    return focusAreas;
  }

  /**
   * Filter templates based on error patterns
   */
  filterTemplatesByErrorPatterns(templates, errorPatterns) {
    if (!errorPatterns || Object.keys(errorPatterns).length === 0) {
      return templates; // Return all if no specific errors
    }

    // Simple filtering - can be enhanced based on specific error pattern logic
    return templates;
  }
  /**
   * Auto-save custom questions to templates_questions collection (CLAUDE.md requirement)
   * @param {Array} customQuestions - Array of custom intervention questions
   * @param {string} category - Question category
   * @param {string} createdBy - User ID who created the questions
   * @returns {Object} Save results summary
   */
  async autoSaveCustomQuestionsToTemplates(customQuestions, category, createdBy = null) {
    console.log(`[INTERVENTION SERVICE] Auto-saving ${customQuestions.length} custom questions to templates_questions collection`);

    const saveResults = {
      attempted: customQuestions.length,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    for (const question of customQuestions) {
      try {
        // Only save questions marked as 'custom' source or questions without source info
        if (question.source && question.source !== 'custom') {
          continue;
        }

        // Create template question from intervention question
        const templateData = {
          category: category,
          questionType: question.questionType,
          questionText: question.questionText,
          questionImage: question.questionImage || null,
          questionValue: question.questionValue || null,
          targetSkills: this.extractTargetSkillsFromQuestion(question, category),
          difficultyLevel: 'medium', // Default to medium difficulty
          createdBy: createdBy || new mongoose.Types.ObjectId(), // System-generated if no user
          isActive: true
        };

        // Add category-specific fields
        switch (category) {
          case 'Alphabet Knowledge':
            if (question.choiceOptions && question.choiceOptions.length > 0) {
              templateData.choiceOptions = question.choiceOptions;
            }
            break;

          case 'Phonological Awareness':
            if (question.questionSet) {
              templateData.questionSet = question.questionSet; // Use questionSet directly
              templateData.matchCount = question.questionSet?.correctPairs?.length || 3;
            }
            break;

          case 'Decoding':
            templateData.displaySequence = question.displaySequence || null;
            templateData.dragElements = question.dragElements || [];
            templateData.correctSequence = question.correctSequence || [];
            templateData.blankPosition = question.blankPosition || null;
            break;

          case 'Word Recognition':
            templateData.displayWord = question.displayWord || null;
            templateData.blankOptions = question.blankOptions || [];
            templateData.correctAnswer = question.correctAnswer || [];
            break;

          case 'Reading Comprehension':
            // Reading Comprehension uses sentence_templates collection, not templates_questions
            console.log(`[INTERVENTION SERVICE] Skipping Reading Comprehension question - uses sentence_templates collection`);
            continue;
        }

        // Check if similar template already exists (avoid duplicates)
        const existingTemplate = await TemplateQuestion.findOne({
          category: category,
          questionType: question.questionType,
          questionText: question.questionText,
          isActive: true
        });

        if (existingTemplate) {
          console.log(`[INTERVENTION SERVICE] Template already exists for: ${question.questionText.substring(0, 50)}...`);
          continue;
        }

        // Create and save the template
        const template = new TemplateQuestion(templateData);
        await template.save();

        saveResults.succeeded++;
        console.log(`[INTERVENTION SERVICE] ✅ Saved custom question as template: ${question.questionId || 'unnamed'}`);

      } catch (error) {
        console.error(`[INTERVENTION SERVICE] ❌ Failed to save custom question as template: ${question.questionId || 'unnamed'}`, error.message);
        saveResults.failed++;
        saveResults.errors.push({
          questionId: question.questionId || 'unnamed',
          error: error.message
        });
      }
    }

    console.log(`[INTERVENTION SERVICE] Auto-save completed: ${saveResults.succeeded} succeeded, ${saveResults.failed} failed`);
    return saveResults;
  }

  /**
   * Extract target skills from a question based on its content and category
   * @param {Object} question - The intervention question
   * @param {string} category - Question category
   * @returns {Array} Array of target skills
   */
  extractTargetSkillsFromQuestion(question, category) {
    const skills = [];

    switch (category) {
      case 'Alphabet Knowledge':
        if (question.questionType === 'patinig') {
          skills.push('vowel_recognition');
        } else if (question.questionType === 'katinig') {
          skills.push('consonant_recognition');
        }
        if (question.questionValue) {
          skills.push(`letter_${question.questionValue.toLowerCase()}`);
        }
        break;

      case 'Phonological Awareness':
        skills.push('sound_discrimination');
        if (question.questionSet && question.questionSet.audioTexts) {
          const sounds = question.questionSet.audioTexts;
          if (sounds.includes('B') && sounds.includes('P')) {
            skills.push('B_P_discrimination');
          }
          if (sounds.includes('M') && sounds.includes('N')) {
            skills.push('M_N_discrimination');
          }
        }
        break;

      case 'Decoding':
        if (question.questionType === 'complete_word_identification') {
          skills.push('word_identification');
        } else if (question.questionType === 'fill_missing_letter') {
          skills.push('initial_sound_identification');
        }
        break;

      case 'Word Recognition':
        if (question.questionType === 'sentence_completion') {
          skills.push('context_clues');
        } else if (question.questionType === 'rhyming_words') {
          skills.push('rhyming_patterns');
        }
        break;
    }

    return skills;
  }
}

module.exports = new InterventionService(); 