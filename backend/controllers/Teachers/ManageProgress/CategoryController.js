// controllers/Teachers/ManageProgress/CategoryController.js
const mongoose = require('mongoose');

/**
 * Get all assessment categories from the database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getCategories = async (req, res) => {
  try {
    const preAssessmentDb = mongoose.connection.useDb('Pre_Assessment');
    const categoriesCollection = preAssessmentDb.collection('assessment_categories');
    
    // Fetch categories from the database
    const categories = await categoriesCollection.find({}).toArray();
    
    // If categories are found, return them
    if (categories && categories.length > 0) {
      console.log(`Found ${categories.length} assessment categories`);
      return res.json(categories);
    }
    
    // Fallback: Return default categories if none found in database
    console.log('No categories found in database, returning default categories');
    const defaultCategories = [
      {
        categoryID: 1,
        categoryTitle: "Alphabet Knowledge",
        categoryDescription: "Assessment of letter recognition, uppercase and lowercase letters, and letter sounds",
        questionTypes: [
          "multiple_choice",
          "text_question",
          "letter_identification",
          "letter_matching",
          "audio_text_question",
          "classification_question",
          "image_question"
        ]
      },
      {
        categoryID: 2,
        categoryTitle: "Phonological Awareness",
        categoryDescription: "Assessment of sounds, sound patterns, and auditory processing skills",
        questionTypes: [
          "phonological_awareness",
          "audio_image_question",
          "phoneme_identification"
        ]
      },
      {
        categoryID: 3,
        categoryTitle: "Decoding",
        categoryDescription: "Assessment of ability to interpret written symbols and translate them into speech",
        questionTypes: [
          "word_formation",
          "text_question",
          "image_question"
        ]
      },
      {
        categoryID: 4,
        categoryTitle: "Word Recognition",
        categoryDescription: "Assessment of ability to recognize and understand common words",
        questionTypes: [
          "multiple_choice",
          "text_question",
          "audio_image_question",
          "image_question"
        ]
      },
      {
        categoryID: 5,
        categoryTitle: "Reading Comprehension",
        categoryDescription: "Assessment of understanding of text content",
        questionTypes: [
          "reading_comprehension",
          "text_question"
        ]
      }
    ];
    
    res.json(defaultCategories);
  } catch (error) {
    console.error('Error fetching assessment categories:', error);
    res.status(500).json({
      message: 'Error retrieving assessment categories',
      error: error.message
    });
  }
};

/**
 * Get assessment categories - alias for getCategories for compatibility
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAssessmentCategories = async (req, res) => {
  return exports.getCategories(req, res);
};

/**
 * Get all reading levels
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getReadingLevels = async (req, res) => {
  try {
    // First try to get reading levels from the database
    const testDb = mongoose.connection.useDb('test');
    const readingLevelsCollection = testDb.collection('reading_levels');
    
    // Check if collection exists and has documents
    const collections = await testDb.listCollections({ name: 'reading_levels' }).toArray();
    
    if (collections.length > 0) {
      const readingLevels = await readingLevelsCollection.find({}).toArray();
      
      if (readingLevels && readingLevels.length > 0) {
        return res.json(readingLevels);
      }
    }
    
    // Fallback: Return default reading levels if not found in database
    const defaultReadingLevels = [
      "Low Emerging",
      "High Emerging",
      "Developing",
      "Transitioning",
      "At Grade Level",
      "Fluent", 
      "Not Assessed"
    ];
    
    res.json(defaultReadingLevels);
  } catch (error) {
    console.error('Error fetching reading levels:', error);
    res.status(500).json({
      message: 'Error retrieving reading levels',
      error: error.message
    });
  }
};