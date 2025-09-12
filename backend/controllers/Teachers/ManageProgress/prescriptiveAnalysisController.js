const mongoose = require('mongoose');
const PrescriptiveAnalysis = require('../../../models/Teachers/ManageProgress/prescriptiveAnalysisModel');
const CategoryResultsService = require('../../../services/Teachers/CategoryResultsService');
const InterventionService = require('../../../services/Teachers/InterventionService');

/**
 * Mathematical Analytics Engine
 * Implements BKT (Bayesian Knowledge Tracing) and IRT (Item Response Theory) models
 */
class MathematicalAnalyticsEngine {
  constructor() {
    // BKT Parameters for each skill
    this.bktParams = {
      P_L0: 0.5,  // Initial probability of mastery
      P_T: 0.1,   // Probability of learning
      P_G: 0.3,   // Probability of guessing
      P_S: 0.1    // Probability of slipping
    };

    // Category weights by reading level
    this.categoryWeights = {
      "Low Emerging": {
        "Alphabet Knowledge": 1.0,
        "Phonological Awareness": 0.0,
        "Decoding": 0.0,
        "Word Recognition": 0.0,
        "Reading Comprehension": 0.0
      },
      "High Emerging": {
        "Alphabet Knowledge": 0.6,
        "Phonological Awareness": 0.4,
        "Decoding": 0.0,
        "Word Recognition": 0.0,
        "Reading Comprehension": 0.0
      },
      "Developing": {
        "Alphabet Knowledge": 0.35,
        "Phonological Awareness": 0.30,
        "Decoding": 0.35,
        "Word Recognition": 0.0,
        "Reading Comprehension": 0.0
      },
      "Transitioning": {
        "Alphabet Knowledge": 0.20,
        "Phonological Awareness": 0.25,
        "Decoding": 0.25,
        "Word Recognition": 0.30,
        "Reading Comprehension": 0.0
      },
      "At Grade Level": {
        "Alphabet Knowledge": 0.10,
        "Phonological Awareness": 0.15,
        "Decoding": 0.15,
        "Word Recognition": 0.20,
        "Reading Comprehension": 0.40
      }
    };

    // Error patterns for analysis
    this.errorPatterns = {
      "phonological": {
        "sound_substitution": { weight: 0.3 },
        "phoneme_deletion": { weight: 0.25 },
        "blending_difficulty": { weight: 0.25 },
        "sound_symbol_mismatch": { weight: 0.2 }
      },
      "orthographic": {
        "letter_sequence": { weight: 0.3 },
        "morphological_violation": { weight: 0.2 },
        "pattern_recognition": { weight: 0.3 },
        "visual_spatial": { weight: 0.2 }
      },
      "semantic": {
        "context_inappropriate": { weight: 0.35 },
        "meaning_based_miscue": { weight: 0.3 },
        "comprehension_error": { weight: 0.2 },
        "vocabulary_gap": { weight: 0.15 }
      }
    };
  }

  /**
   * Update mastery probability using BKT
   * @param {number} P_L_n - Current probability of mastery
   * @param {boolean} isCorrect - Whether response was correct
   * @returns {number} - Updated mastery probability
   */
  updateMasteryProbability(P_L_n, isCorrect) {
    const { P_T, P_G, P_S } = this.bktParams;
    
    let P_L_n_given_evidence;
    
    if (isCorrect) {
      P_L_n_given_evidence = (P_L_n * (1 - P_S)) / (P_L_n * (1 - P_S) + (1 - P_L_n) * P_G);
    } else {
      P_L_n_given_evidence = (P_L_n * P_S) / (P_L_n * P_S + (1 - P_L_n) * (1 - P_G));
    }
    
    return P_L_n_given_evidence + (1 - P_L_n_given_evidence) * P_T;
  }

  /**
   * Calculate probability of correct response using IRT 2PL model
   * @param {number} ability - Student ability level (theta)
   * @param {number} difficulty - Item difficulty (b)
   * @param {number} discrimination - Item discrimination (a)
   * @returns {number} - Probability of correct response
   */
  calculateIRTProbability(ability, difficulty, discrimination = 1.0) {
    return 1 / (1 + Math.exp(-1.702 * discrimination * (ability - difficulty)));
  }

  /**
   * Calculate weighted composite score based on reading level
   * @param {Object} categoryScores - Scores by category
   * @param {string} readingLevel - Student's reading level
   * @returns {number} - Weighted composite score
   */
  calculateCompositeScore(categoryScores, readingLevel) {
    const weights = this.categoryWeights[readingLevel] || this.categoryWeights["Low Emerging"];
    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([category, weight]) => {
      if (weight > 0 && categoryScores[category] !== undefined) {
        weightedSum += categoryScores[category] * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  }

  /**
   * Analyze error patterns from category results
   * @param {Object} categoryData - Category result data
   * @param {string} categoryName - Name of the category
   * @returns {Object} - Error pattern analysis
   */
  analyzeErrorPatterns(categoryData, categoryName) {
    const errorAnalysis = {};

    if (categoryName === 'Alphabet Knowledge') {
      // Analyze patinig/katinig errors
      const patinigErrors = this.findPatinigErrors(categoryData);
      const katinigErrors = this.findKatinigErrors(categoryData);
      
      if (patinigErrors.count > 0) {
        errorAnalysis.patinig_errors = patinigErrors;
      }
      if (katinigErrors.count > 0) {
        errorAnalysis.katinig_errors = katinigErrors;
      }
    } else if (categoryName === 'Phonological Awareness') {
      // Analyze matching errors
      const matchingErrors = this.findMatchingErrors(categoryData);
      if (matchingErrors.count > 0) {
        errorAnalysis.matching_errors = matchingErrors;
      }
    } else if (categoryName === 'Decoding') {
      // Analyze decoding errors
      const decodingErrors = this.findDecodingErrors(categoryData);
      if (decodingErrors.count > 0) {
        errorAnalysis.decoding_errors = decodingErrors;
      }
    }

    return errorAnalysis;
  }

  /**
   * Find patinig (vowel) errors
   */
  findPatinigErrors(categoryData) {
    // This would analyze specific vowel recognition errors
    // For now, return a basic structure
    return {
      count: 0,
      total: 0,
      percentage: 0,
      specific_letters: [],
      error_type: "visual_confusion",
      questionIds: []
    };
  }

  /**
   * Find katinig (consonant) errors
   */
  findKatinigErrors(categoryData) {
    return {
      count: 0,
      total: 0,
      percentage: 0,
      specific_letters: [],
      error_type: "sound_discrimination",
      questionIds: []
    };
  }

  /**
   * Find matching errors in phonological awareness
   */
  findMatchingErrors(categoryData) {
    const totalMatches = categoryData.totalPossibleMatches || 0;
    const correctMatches = categoryData.correctMatches || 0;
    const errors = totalMatches - correctMatches;

    return {
      count: errors,
      total: totalMatches,
      percentage: totalMatches > 0 ? Math.round((errors / totalMatches) * 100) : 0,
      avg_partial_success: totalMatches > 0 ? correctMatches / totalMatches : 0,
      error_type: "sound_discrimination",
      questionIds: []
    };
  }

  /**
   * Find decoding pattern errors
   */
  findDecodingErrors(categoryData) {
    const total = categoryData.totalQuestions || 0;
    const correct = categoryData.correctAnswers || 0;
    const errors = total - correct;

    return {
      count: errors,
      total: total,
      percentage: total > 0 ? Math.round((errors / total) * 100) : 0,
      error_type: "specific_pattern",
      most_error_position: 0, // Beginning of words
      questionIds: []
    };
  }

  /**
   * Generate intervention plan based on analysis
   * @param {Object} analysisResults - Complete analysis results
   * @returns {Object} - Intervention plan
   */
  generateInterventionPlan(analysisResults) {
    const failedCategories = [];
    const specificFocus = {};

    // Identify failed categories and generate specific recommendations
    Object.entries(analysisResults.skillMastery || {}).forEach(([category, mastery]) => {
      if (!mastery.isPassed) {
        failedCategories.push(category);
        
        if (category === 'Phonological Awareness') {
          specificFocus[category] = {
            focus: "sound_matching",
            targetSounds: ["B-P", "M-N", "D-T"],
            recommendedActivities: ["sound_discrimination", "minimal_pairs", "rhyming_practice"],
            questionDistribution: { matching: 100 }
          };
        } else if (category === 'Decoding') {
          specificFocus[category] = {
            focus: "initial_sounds",
            targetPatterns: ["CVC", "CVCV"],
            recommendedActivities: ["syllable_blending", "word_building", "pattern_recognition"],
            questionDistribution: { drag_drop: 100 }
          };
        }
      }
    });

    return {
      required: failedCategories.length > 0,
      priority: failedCategories,
      specificFocus: specificFocus
    };
  }
}

/**
 * Object-Oriented Recommendation Template System
 * Easy to update and modify recommendations based on category and reading level
 */
class RecommendationTemplateEngine {
  constructor() {
    // Template system for easy updates - organized by category and reading level
    this.templates = {
      'Alphabet Knowledge': {
        'Low Emerging': {
          strengths: ['Can recognize some basic letters'],
          weaknesses: [
            'Significant difficulty recognizing basic letters',
            'Limited understanding of letter-sound relationships',
            'Struggles with distinguishing between similar letters (e.g., b/d, p/q)'
          ],
          recommendations: [
            'Start with a limited set of high-frequency letters',
            'Use multi-sensory approaches (tactile letters, tracing in sand)',
            'Daily letter recognition practice with visual aids',
            'Focus on one letter-sound correspondence at a time'
          ]
        },
        'High Emerging': {
          strengths: ['Can recognize some common letters'],
          weaknesses: [
            'Difficulty with less common letters',
            'Inconsistent recall of letter names',
            'Struggles with lowercase forms'
          ],
          recommendations: [
            'Practice matching uppercase to lowercase letters',
            'Use letter-object associations (A is for apple)',
            'Regular review of problematic letters',
            'Incorporate letter hunts in reading materials'
          ]
        },
        'Developing': {
          strengths: [
            'Recognizes most letters',
            'Some understanding of letter-sound relationships'
          ],
          weaknesses: [
            'Occasional confusion with similar-looking letters',
            'Difficulty with less frequent letters',
            'Inconsistent letter-sound correspondence'
          ],
          recommendations: [
            'Targeted practice with confusing letter pairs',
            'Word-building activities using known letters',
            'Games that reinforce quick letter recognition',
            'Begin connecting letters to simple words'
          ]
        },
        'Transitioning': {
          strengths: [
            'Strong letter recognition skills',
            'Good understanding of letter-sound relationships'
          ],
          weaknesses: [
            'Minor inconsistencies with complex letter combinations'
          ],
          recommendations: [
            'Practice with complex letter patterns',
            'Introduce digraphs and blends',
            'Challenge with more advanced phonics concepts'
          ]
        },
        'At Grade Level': {
          strengths: [
            'Excellent recognition of all letters',
            'Strong understanding of letter-sound relationships',
            'Consistent ability to identify letters in various contexts'
          ],
          weaknesses: [],
          recommendations: [
            'Continue to challenge with more complex letter patterns',
            'Introduce more advanced phonics concepts',
            'Encourage reading materials that reinforce letter recognition'
          ]
        }
      },
      
      'Phonological Awareness': {
        'Low Emerging': {
          strengths: ['Shows some awareness of word sounds'],
          weaknesses: [
            'Significant difficulty identifying sounds in words',
            'Unable to segment words into syllables',
            'Limited awareness of rhyming patterns'
          ],
          recommendations: [
            'Start with awareness of words in sentences',
            'Clapping or tapping syllable activities',
            'Listening exercises to identify environmental sounds',
            'Simple rhyming activities with picture support'
          ]
        },
        'High Emerging': {
          strengths: ['Can identify some beginning sounds', 'Basic syllable awareness'],
          weaknesses: [
            'Difficulty blending sounds to form words',
            'Struggles with identifying ending sounds',
            'Limited phoneme manipulation skills'
          ],
          recommendations: [
            'Syllable blending and segmentation activities',
            'Sound isolation exercises (beginning, middle, end)',
            'Phoneme counting with manipulatives',
            'Rhyming games and songs'
          ]
        },
        'Developing': {
          strengths: [
            'Can identify beginning and ending sounds',
            'Recognizes syllable patterns',
            'Some phoneme blending ability'
          ],
          weaknesses: [
            'Difficulty with vowel sounds',
            'Struggles with phoneme manipulation',
            'Inconsistent with complex phonological tasks'
          ],
          recommendations: [
            'Word building with phoneme substitution',
            'Activities focusing on middle/vowel sounds',
            'Sound deletion and addition games',
            'More complex phoneme manipulation tasks'
          ]
        },
        'Transitioning': {
          strengths: [
            'Good phoneme awareness',
            'Can manipulate sounds in words',
            'Strong syllable recognition'
          ],
          weaknesses: [
            'Occasional difficulty with complex sound patterns'
          ],
          recommendations: [
            'Advanced phonological awareness activities',
            'Complex sound manipulation tasks',
            'Preparation for advanced reading skills'
          ]
        },
        'At Grade Level': {
          strengths: [
            'Advanced phoneme manipulation skills',
            'Strong ability to identify and work with sounds in words',
            'Excellent awareness of sound patterns in language'
          ],
          weaknesses: [],
          recommendations: [
            'Continue with more complex phonological activities',
            'Introduce more challenging sound manipulation tasks',
            'Connect phonological awareness to spelling patterns'
          ]
        }
      },
      
      'Word Recognition': {
        'Low Emerging': {
          strengths: ['Can recognize a few common words'],
          weaknesses: [
            'Significant difficulty recognizing common words',
            'Limited sight word vocabulary',
            'Struggles with word-picture matching'
          ],
          recommendations: [
            'Begin with a small set of high-frequency words',
            'Use picture-word matching activities',
            'Repetitive reading of familiar texts',
            'Word recognition games with visual support'
          ]
        },
        'High Emerging': {
          strengths: ['Recognizes some common words', 'Can match some words to pictures'],
          weaknesses: [
            'Difficulty recognizing words in different contexts',
            'Limited recall of previously learned words',
            'Slow word recognition speed'
          ],
          recommendations: [
            'Flash card practice with high-frequency words',
            'Word hunts in familiar texts',
            'Word sorting by categories',
            'Word recognition activities in different fonts'
          ]
        },
        'Developing': {
          strengths: [
            'Recognizes many common words',
            'Growing sight word vocabulary',
            'Can identify familiar words in text'
          ],
          weaknesses: [
            'Difficulty with less common words',
            'Inconsistent recognition in longer texts',
            'Struggles when reading words in context'
          ],
          recommendations: [
            'Expand sight word vocabulary systematically',
            'Word recognition activities in authentic texts',
            'Speed drills for quick word recognition',
            'Word building with word families'
          ]
        },
        'Transitioning': {
          strengths: [
            'Strong sight word vocabulary',
            'Quick recognition of familiar words',
            'Good contextual word recognition'
          ],
          weaknesses: [
            'Occasional difficulty with unfamiliar words'
          ],
          recommendations: [
            'Expand vocabulary with more challenging words',
            'Practice with context clues',
            'Advanced word recognition strategies'
          ]
        },
        'At Grade Level': {
          strengths: [
            'Extensive sight word vocabulary',
            'Quick and accurate word recognition',
            'Strong ability to recognize words in various contexts'
          ],
          weaknesses: [],
          recommendations: [
            'Continue to expand vocabulary with more complex words',
            'Encourage fluent reading of texts at appropriate level',
            'Introduce more challenging word families and patterns'
          ]
        }
      },
      
      'Decoding': {
        'Low Emerging': {
          strengths: ['Shows some understanding of letter-sound relationships'],
          weaknesses: [
            'Significant difficulty applying phonics rules',
            'Unable to blend sounds to decode words',
            'Limited understanding of sound-symbol relationships'
          ],
          recommendations: [
            'Start with simple CVC (consonant-vowel-consonant) words',
            'Use manipulatives for sound blending',
            'Sound-by-sound blending activities',
            'Picture support for word decoding'
          ]
        },
        'High Emerging': {
          strengths: ['Can decode some simple words', 'Basic sound blending ability'],
          weaknesses: [
            'Difficulty with vowel sounds',
            'Struggles with multi-syllable words',
            'Inconsistent application of phonics rules'
          ],
          recommendations: [
            'Systematic practice with vowel patterns',
            'Word family activities',
            'Progressive introduction of more complex phonics patterns',
            'Decodable texts that match current skills'
          ]
        },
        'Developing': {
          strengths: [
            'Can decode many regular words',
            'Applies basic phonics rules',
            'Good sound blending ability'
          ],
          weaknesses: [
            'Difficulty with irregular words',
            'Struggles with more complex phonics patterns',
            'Decoding speed needs improvement'
          ],
          recommendations: [
            'Advanced phonics pattern practice',
            'Word sorting by spelling patterns',
            'Fluency-building with decodable texts',
            'Strategies for tackling multi-syllable words'
          ]
        },
        'Transitioning': {
          strengths: [
            'Strong decoding skills',
            'Good application of phonics rules',
            'Can decode most regular and some irregular words'
          ],
          weaknesses: [
            'Occasional difficulty with complex words'
          ],
          recommendations: [
            'Practice with advanced phonics patterns',
            'Multi-syllable word strategies',
            'Reading fluency development'
          ]
        },
        'At Grade Level': {
          strengths: [
            'Strong application of phonics rules',
            'Excellent ability to decode unfamiliar words',
            'Consistent use of decoding strategies'
          ],
          weaknesses: [],
          recommendations: [
            'Introduce more complex decoding patterns',
            'Challenge with multisyllabic words',
            'Encourage application of decoding skills in authentic reading'
          ]
        }
      },
      
      'Reading Comprehension': {
        'Low Emerging': {
          strengths: ['Shows interest in stories'],
          weaknesses: [
            'Significant difficulty understanding text',
            'Limited ability to recall story details',
            'Struggles with answering basic questions about text'
          ],
          recommendations: [
            'Picture walk before reading',
            'Simple comprehension questions during reading',
            'Story sequence activities with pictures',
            'Read-alouds with discussion'
          ]
        },
        'High Emerging': {
          strengths: ['Can recall some story details', 'Understands simple texts with support'],
          weaknesses: [
            'Difficulty making inferences',
            'Limited understanding of story structure',
            'Struggles with independent comprehension'
          ],
          recommendations: [
            'Story mapping activities',
            'Before-during-after reading questions',
            'Retelling practice with visual aids',
            'Think-aloud strategies during reading'
          ]
        },
        'Developing': {
          strengths: [
            'Understands literal meaning in texts',
            'Can recall major story events',
            'Answers basic comprehension questions'
          ],
          weaknesses: [
            'Difficulty with deeper meaning',
            'Limited ability to connect ideas across text',
            'Struggles with drawing conclusions'
          ],
          recommendations: [
            'Inference training with guided practice',
            'Graphic organizers for text structure',
            'Question generation strategies',
            'Making connections (text-to-self, text-to-text)'
          ]
        },
        'Transitioning': {
          strengths: [
            'Good literal comprehension',
            'Can make some inferences',
            'Understanding of basic story structure'
          ],
          weaknesses: [
            'Occasional difficulty with complex texts'
          ],
          recommendations: [
            'Advanced comprehension strategies',
            'Critical thinking activities',
            'Complex text analysis'
          ]
        },
        'At Grade Level': {
          strengths: [
            'Strong understanding of text meaning',
            'Excellent recall and analysis of details',
            'Ability to make connections and inferences'
          ],
          weaknesses: [],
          recommendations: [
            'Introduce more complex texts with deeper themes',
            'Encourage critical thinking about text content',
            'Provide opportunities for comparing and analyzing different texts'
          ]
        }
      }
    };
  }

  /**
   * Generate analysis for a category based on score and reading level
   * @param {string} categoryName - Category name
   * @param {number} score - Assessment score (0-100)
   * @param {string} readingLevel - Student's reading level
   * @returns {Object} Generated analysis with strengths, weaknesses, recommendations
   */
  generateAnalysis(categoryName, score, readingLevel) {
    console.log(`Generating analysis for: ${categoryName}, Score: ${score}, Level: ${readingLevel}`);
    
    // Get template for category and reading level
    const categoryTemplates = this.templates[categoryName];
    if (!categoryTemplates) {
      console.warn(`No templates found for category: ${categoryName}`);
      return this.getDefaultAnalysis(categoryName, score);
    }

    const template = categoryTemplates[readingLevel];
    if (!template) {
      console.warn(`No template found for reading level: ${readingLevel} in category: ${categoryName}`);
      return this.getDefaultAnalysis(categoryName, score);
    }

    // For high scores (90+), focus on strengths
    if (score >= 90) {
      return {
        strengths: template.strengths,
        weaknesses: [],
        recommendations: template.recommendations
      };
    }

    // For passing scores (75-89), mix of strengths and minimal weaknesses
    if (score >= 75) {
      return {
        strengths: template.strengths,
        weaknesses: template.weaknesses.slice(0, 1), // Only show first weakness
        recommendations: template.recommendations.slice(0, 2) // Show fewer recommendations
      };
    }

    // For failing scores (<75), show full template
    return template;
  }

  /**
   * Get default analysis when template not found
   */
  getDefaultAnalysis(categoryName, score) {
    if (score >= 75) {
      return {
        strengths: [`Shows proficiency in ${categoryName} skills`],
        weaknesses: [],
        recommendations: [`Continue practicing ${categoryName} to maintain skills`]
      };
    }
    
    return {
      strengths: [`Shows some understanding of ${categoryName} concepts`],
      weaknesses: [`Needs additional support in ${categoryName}`],
      recommendations: [
        `Provide targeted instruction in ${categoryName}`,
        `Use varied teaching methods to support learning`,
        `Regular assessment to track progress`
      ]
    };
  }

  /**
   * Update recommendations for a specific category and reading level
   * @param {string} categoryName - Category to update
   * @param {string} readingLevel - Reading level to update
   * @param {Object} newTemplate - New template with strengths, weaknesses, recommendations
   */
  updateTemplate(categoryName, readingLevel, newTemplate) {
    if (!this.templates[categoryName]) {
      this.templates[categoryName] = {};
    }
    
    this.templates[categoryName][readingLevel] = {
      strengths: newTemplate.strengths || [],
      weaknesses: newTemplate.weaknesses || [],
      recommendations: newTemplate.recommendations || []
    };
    
    console.log(`Updated template for ${categoryName} - ${readingLevel}`);
  }

  /**
   * Get all available categories
   */
  getCategories() {
    return Object.keys(this.templates);
  }

  /**
   * Get all reading levels for a category
   */
  getReadingLevels(categoryName) {
    return this.templates[categoryName] ? Object.keys(this.templates[categoryName]) : [];
  }
}

/**
 * Prescriptive Analysis Controller
 * Handles CRUD operations for prescriptive analysis with template-based generation
 */
class PrescriptiveAnalysisController {
  constructor() {
    this.recommendationEngine = new RecommendationTemplateEngine();
    this.analyticsEngine = new MathematicalAnalyticsEngine();
  }

  /**
   * Get prescriptive analyses for a student
   */
  async getStudentAnalyses(req, res) {
    try {
      const { studentId } = req.params;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      // Convert to ObjectId if it's a valid ObjectId string
      let studentObjectId;
      try {
        if (mongoose.Types.ObjectId.isValid(studentId)) {
          studentObjectId = new mongoose.Types.ObjectId(studentId);
        } else {
          // If not a valid ObjectId, look up by idNumber
          const user = await mongoose.connection.db.collection('users').findOne({ 
            idNumber: studentId 
          });
          
          if (!user) {
            return res.status(404).json({
              success: false,
              message: 'Student not found'
            });
          }
          
          studentObjectId = user._id;
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID format'
        });
      }

      // Get analyses for this student
      const analyses = await PrescriptiveAnalysis.find({
        studentId: studentObjectId
      }).sort({ categoryId: 1 });

      // If no analyses exist, check if student has been assessed
      if (analyses.length === 0) {
        const user = await mongoose.connection.db.collection('users').findOne({
          _id: studentObjectId
        });
        
        if (!user || !user.readingLevel || user.readingLevel === 'Not Assessed') {
          return res.status(200).json({
            success: true,
            data: null,
            message: 'Student has not been assessed yet'
          });
        }
      }

      return res.status(200).json({
        success: true,
        data: analyses
      });
    } catch (error) {
      console.error('Error getting student analyses:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while retrieving analyses',
        error: error.message
      });
    }
  }

  /**
   * Generate analyses for a student based on their category results
   */
  async generateAnalysesFromResults(req, res) {
    try {
      const { studentId } = req.params;
      const { categoryResults } = req.body;

      if (!studentId || !categoryResults) {
        return res.status(400).json({
          success: false,
          message: 'Student ID and category results are required'
        });
      }

      // Get student info
      const user = await mongoose.connection.db.collection('users').findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(studentId) ? new mongoose.Types.ObjectId(studentId) : null },
          { idNumber: studentId }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const readingLevel = user.readingLevel || 'Low Emerging';

      // Generate analyses for each category
      const generatedAnalyses = [];
      
      for (const category of categoryResults.categories || []) {
        const categoryName = category.categoryName
          .replace(/_/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        // Generate analysis using template engine
        const analysis = this.recommendationEngine.generateAnalysis(
          categoryName,
          category.score || 0,
          readingLevel
        );

        // Create or update analysis record
        const existingAnalysis = await PrescriptiveAnalysis.findOne({
          studentId: user._id,
          categoryId: categoryName
        });

        let savedAnalysis;
        if (existingAnalysis) {
          // Update existing
          existingAnalysis.readingLevel = readingLevel;
          existingAnalysis.strengths = analysis.strengths;
          existingAnalysis.weaknesses = analysis.weaknesses;
          existingAnalysis.recommendations = analysis.recommendations;
          existingAnalysis.updatedAt = new Date();
          
          savedAnalysis = await existingAnalysis.save();
        } else {
          // Create new
          savedAnalysis = await PrescriptiveAnalysis.create({
            studentId: user._id,
            categoryId: categoryName,
            readingLevel: readingLevel,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            recommendations: analysis.recommendations
          });
        }

        generatedAnalyses.push(savedAnalysis);
      }

      return res.status(200).json({
        success: true,
        data: generatedAnalyses,
        message: `Generated ${generatedAnalyses.length} analyses`
      });
    } catch (error) {
      console.error('Error generating analyses:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while generating analyses',
        error: error.message
      });
    }
  }

  /**
   * Generate comprehensive prescriptive analysis using mathematical models
   */
  async generateComprehensiveAnalysis(req, res) {
    try {
      const { studentId } = req.params;
      
      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      // Get student info
      const user = await mongoose.connection.db.collection('users').findOne({
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(studentId) ? new mongoose.Types.ObjectId(studentId) : null },
          { idNumber: parseInt(studentId) }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const readingLevel = user.readingLevel || 'Low Emerging';

      // Get category results using service
      const categoryResults = await CategoryResultsService.getCategoryResults(user.idNumber || user._id);
      
      if (categoryResults.length === 0) {
        return res.status(200).json({
          success: true,
          data: null,
          message: 'No category results found for analysis'
        });
      }

      // Use the most recent category result
      const mostRecentResult = categoryResults[0];
      
      // Build comprehensive analysis
      const analysisData = {
        studentId: user._id,
        assessmentDate: mostRecentResult.assessmentDate || new Date(),
        assessmentType: 'main',
        readingLevel: readingLevel,
        skillMastery: {},
        abilityEstimates: {},
        errorPatterns: {},
        interventionPlan: {},
        insights: {
          strengths: [],
          weaknesses: [],
          passedCategories: 0,
          failedCategories: 0
        }
      };

      const categoryScores = {};

      // Process each category with mathematical models
      for (const category of mostRecentResult.categories || []) {
        const categoryName = category.categoryName;
        const score = category.score || 0;
        const isPassed = category.isPassed || false;
        
        categoryScores[categoryName] = score;

        // BKT Analysis
        const initialMastery = this.analyticsEngine.bktParams.P_L0;
        let updatedMastery = initialMastery;
        
        // Simulate BKT updates based on performance
        const correctAnswers = category.correctAnswers || 0;
        const totalQuestions = category.totalQuestions || 1;
        
        for (let i = 0; i < totalQuestions; i++) {
          const isCorrect = i < correctAnswers;
          updatedMastery = this.analyticsEngine.updateMasteryProbability(updatedMastery, isCorrect);
        }

        // Store skill mastery data
        analysisData.skillMastery[categoryName] = {
          masteryProbability: Math.round(updatedMastery * 100) / 100,
          lastUpdated: new Date(),
          totalQuestions: totalQuestions,
          correctAnswers: correctAnswers,
          totalPossibleMatches: category.totalPossibleMatches || 0,
          correctMatches: category.correctMatches || 0,
          score: score,
          isPassed: isPassed,
          responseHistory: []
        };

        // IRT Ability Estimate (simplified)
        const abilityEstimate = (score - 50) / 25; // Convert 0-100 score to -2 to +2 range
        analysisData.abilityEstimates[categoryName] = Math.max(-3, Math.min(3, abilityEstimate));

        // Error Pattern Analysis
        const errorPatterns = this.analyticsEngine.analyzeErrorPatterns(category, categoryName);
        if (Object.keys(errorPatterns).length > 0) {
          analysisData.errorPatterns[categoryName] = errorPatterns;
        }

        // Update insights
        if (isPassed) {
          analysisData.insights.strengths.push(categoryName);
          analysisData.insights.passedCategories++;
        } else {
          analysisData.insights.weaknesses.push(`${categoryName} - ${score}%`);
          analysisData.insights.failedCategories++;
        }

        // Generate traditional recommendations for backward compatibility
        const templateAnalysis = this.recommendationEngine.generateAnalysis(categoryName, score, readingLevel);
        
        // Store legacy fields
        if (!analysisData.strengths) analysisData.strengths = [];
        if (!analysisData.weaknesses) analysisData.weaknesses = [];
        if (!analysisData.recommendations) analysisData.recommendations = [];
        
        analysisData.strengths = [...new Set([...analysisData.strengths, ...templateAnalysis.strengths])];
        analysisData.weaknesses = [...new Set([...analysisData.weaknesses, ...templateAnalysis.weaknesses])];
        analysisData.recommendations = [...new Set([...analysisData.recommendations, ...templateAnalysis.recommendations])];
      }

      // Calculate composite score
      analysisData.insights.overallScore = this.analyticsEngine.calculateCompositeScore(categoryScores, readingLevel);
      
      // Determine recommended action
      if (analysisData.insights.failedCategories === 0) {
        analysisData.insights.overallReadiness = 'Ready for next level';
        analysisData.insights.recommendedAction = 'success_ready';
      } else if (analysisData.insights.failedCategories <= 2) {
        analysisData.insights.overallReadiness = 'Needs targeted intervention';
        analysisData.insights.recommendedAction = 'immediate_intervention';
      } else {
        analysisData.insights.overallReadiness = 'Requires intensive support';
        analysisData.insights.recommendedAction = 'face_to_face_required';
      }

      // Generate intervention plan
      analysisData.interventionPlan = this.analyticsEngine.generateInterventionPlan(analysisData);

      // Create or update the prescriptive analysis record
      const existingAnalysis = await PrescriptiveAnalysis.findOne({
        studentId: user._id,
        assessmentType: 'main'
      });

      let savedAnalysis;
      if (existingAnalysis) {
        Object.assign(existingAnalysis, analysisData);
        existingAnalysis.updatedAt = new Date();
        savedAnalysis = await existingAnalysis.save();
      } else {
        savedAnalysis = await PrescriptiveAnalysis.create(analysisData);
      }

      return res.status(200).json({
        success: true,
        data: savedAnalysis,
        message: 'Comprehensive analysis generated successfully'
      });

    } catch (error) {
      console.error('Error generating comprehensive analysis:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while generating comprehensive analysis',
        error: error.message
      });
    }
  }

  /**
   * Generate prescriptive analysis from intervention results
   */
  async generateAnalysisFromIntervention(req, res) {
    try {
      const { interventionId } = req.params;

      if (!interventionId) {
        return res.status(400).json({
          success: false,
          message: 'Intervention ID is required'
        });
      }

      // Use the intervention service to generate analysis
      const result = await InterventionService.generateAnalysisFromIntervention(interventionId);

      return res.status(200).json({
        success: true,
        data: result.data,
        interventionOutcome: result.interventionOutcome,
        message: 'Prescriptive analysis generated from intervention results'
      });

    } catch (error) {
      console.error('Error generating analysis from intervention:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while generating analysis from intervention',
        error: error.message
      });
    }
  }

  /**
   * Get intervention history with analytics for a student
   */
  async getInterventionHistory(req, res) {
    try {
      const { studentId } = req.params;

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID is required'
        });
      }

      // Get student ObjectId
      let studentObjectId;
      try {
        if (mongoose.Types.ObjectId.isValid(studentId)) {
          studentObjectId = new mongoose.Types.ObjectId(studentId);
        } else {
          const user = await mongoose.connection.db.collection('users').findOne({ 
            idNumber: parseInt(studentId) 
          });
          
          if (!user) {
            return res.status(404).json({
              success: false,
              message: 'Student not found'
            });
          }
          
          studentObjectId = user._id;
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID format'
        });
      }

      // Get all intervention analyses for the student
      const interventionAnalyses = await PrescriptiveAnalysis.find({
        studentId: studentObjectId,
        assessmentType: 'intervention'
      }).sort({ updatedAt: -1 });

      // Get intervention details for context
      const interventions = await InterventionService.getStudentInterventions(studentId);

      // Combine analysis with intervention details
      const enrichedHistory = interventionAnalyses.map(analysis => ({
        ...analysis.toObject(),
        totalAttempts: analysis.interventionHistory?.length || 0,
        latestAttempt: analysis.interventionHistory?.[analysis.interventionHistory.length - 1] || null,
        escalationRequired: analysis.insights?.recommendedAction === 'face_to_face_required'
      }));

      return res.status(200).json({
        success: true,
        data: {
          analyses: enrichedHistory,
          interventions: interventions,
          summary: {
            totalCategories: enrichedHistory.length,
            categoriesRequiringEscalation: enrichedHistory.filter(a => a.escalationRequired).length,
            totalInterventionAttempts: enrichedHistory.reduce((sum, a) => sum + a.totalAttempts, 0)
          }
        }
      });

    } catch (error) {
      console.error('Error getting intervention history:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while retrieving intervention history',
        error: error.message
      });
    }
  }

  /**
   * Update template for easy recommendation changes
   */
  async updateRecommendationTemplate(req, res) {
    try {
      const { category, readingLevel, template } = req.body;

      if (!category || !readingLevel || !template) {
        return res.status(400).json({
          success: false,
          message: 'Category, reading level, and template are required'
        });
      }

      // Update the template
      this.recommendationEngine.updateTemplate(category, readingLevel, template);

      return res.status(200).json({
        success: true,
        message: `Updated template for ${category} - ${readingLevel}`
      });
    } catch (error) {
      console.error('Error updating template:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while updating template',
        error: error.message
      });
    }
  }

  /**
   * Get available templates (for admin interface)
   */
  async getAvailableTemplates(req, res) {
    try {
      const templates = {};
      const categories = this.recommendationEngine.getCategories();
      
      for (const category of categories) {
        templates[category] = this.recommendationEngine.getReadingLevels(category);
      }

      return res.status(200).json({
        success: true,
        data: templates
      });
    } catch (error) {
      console.error('Error getting templates:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error while retrieving templates',
        error: error.message
      });
    }
  }
}

// Create controller instance
const controller = new PrescriptiveAnalysisController();

module.exports = {
  getStudentAnalyses: controller.getStudentAnalyses.bind(controller),
  generateAnalysesFromResults: controller.generateAnalysesFromResults.bind(controller),
  generateComprehensiveAnalysis: controller.generateComprehensiveAnalysis.bind(controller),
  generateAnalysisFromIntervention: controller.generateAnalysisFromIntervention.bind(controller),
  getInterventionHistory: controller.getInterventionHistory.bind(controller),
  updateRecommendationTemplate: controller.updateRecommendationTemplate.bind(controller),
  getAvailableTemplates: controller.getAvailableTemplates.bind(controller)
};