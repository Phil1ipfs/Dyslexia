// controllers/Teachers/ManageProgress/contentProviderController.js
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;

// Helper function to get connection to Pre_Assessment database
const getPreAssessmentDb = () => mongoose.connection.useDb('Pre_Assessment');

// Get all letters from Pre_Assessment database
exports.getLetters = async (req, res) => {
  try {
    const { type } = req.query; 
    
    const preAssessmentDb = getPreAssessmentDb();
    const lettersCollection = preAssessmentDb.collection('letters_collection');
    
    const filter = {};
    if (type) {
      filter.type = type;
    }
    
    const letters = await lettersCollection.find(filter).toArray();
    
    res.json(letters);
  } catch (error) {
    console.error('Error fetching letters:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

app.get('/api/content/categories', async (req, res) => {
  try {
    const preAssessmentDb = mongoose.connection.useDb('Pre_Assessment');
    const categoriesCollection = preAssessmentDb.collection('assessment_categories');
    
    const categories = await categoriesCollection.find({}).toArray();
    res.json(categories);
  } catch (error) {
    console.error('Error fetching content categories:', error);
    res.status(500).json({
      message: 'Error retrieving content categories',
      error: error.message
    });
  }
});

// Get specific letter by id
exports.getLetterById = async (req, res) => {
  try {
    const letterId = req.params.id;
    
    const preAssessmentDb = getPreAssessmentDb();
    const lettersCollection = preAssessmentDb.collection('letters_collection');
    
    // Try to find by ObjectId first
    let letter = null;
    if (mongoose.Types.ObjectId.isValid(letterId)) {
      letter = await lettersCollection.findOne({
        _id: ObjectId(letterId)
      });
    }
    
    // If not found, try by letterID string
    if (!letter) {
      letter = await lettersCollection.findOne({
        letterID: letterId
      });
    }
    
    if (!letter) {
      return res.status(404).json({ message: 'Letter not found' });
    }
    
    res.json(letter);
  } catch (error) {
    console.error('Error fetching letter:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get syllables
exports.getSyllables = async (req, res) => {
  try {
    const preAssessmentDb = getPreAssessmentDb();
    const syllablesCollection = preAssessmentDb.collection('syllables_collection');
    
    const syllables = await syllablesCollection.find({}).toArray();
    
    res.json(syllables);
  } catch (error) {
    console.error('Error fetching syllables:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get specific syllable by id
exports.getSyllableById = async (req, res) => {
  try {
    const syllableId = req.params.id;
    
    const preAssessmentDb = getPreAssessmentDb();
    const syllablesCollection = preAssessmentDb.collection('syllables_collection');
    
    // Try to find by ObjectId first
    let syllable = null;
    if (mongoose.Types.ObjectId.isValid(syllableId)) {
      syllable = await syllablesCollection.findOne({
        _id: ObjectId(syllableId)
      });
    }
    
    // If not found, try by syllableID string
    if (!syllable) {
      syllable = await syllablesCollection.findOne({
        syllableID: syllableId
      });
    }
    
    if (!syllable) {
      return res.status(404).json({ message: 'Syllable not found' });
    }
    
    res.json(syllable);
  } catch (error) {
    console.error('Error fetching syllable:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get words
exports.getWords = async (req, res) => {
  try {
    const { category } = req.query;
    
    const preAssessmentDb = getPreAssessmentDb();
    const wordsCollection = preAssessmentDb.collection('words_collection');
    
    const filter = {};
    if (category) {
      filter.category = category;
    }
    
    const words = await wordsCollection.find(filter).toArray();
    
    res.json(words);
  } catch (error) {
    console.error('Error fetching words:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get specific word by id
exports.getWordById = async (req, res) => {
  try {
    const wordId = req.params.id;
    
    const preAssessmentDb = getPreAssessmentDb();
    const wordsCollection = preAssessmentDb.collection('words_collection');
    
    // Try to find by ObjectId first
    let word = null;
    if (mongoose.Types.ObjectId.isValid(wordId)) {
      word = await wordsCollection.findOne({
        _id: ObjectId(wordId)
      });
    }
    
    // If not found, try by wordID string
    if (!word) {
      word = await wordsCollection.findOne({
        wordID: wordId
      });
    }
    
    if (!word) {
      return res.status(404).json({ message: 'Word not found' });
    }
    
    res.json(word);
  } catch (error) {
    console.error('Error fetching word:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get sentences
exports.getSentences = async (req, res) => {
  try {
    const preAssessmentDb = getPreAssessmentDb();
    const sentencesCollection = preAssessmentDb.collection('sentences_collection');
    
    const sentences = await sentencesCollection.find({}).toArray();
    
    res.json(sentences);
  } catch (error) {
    console.error('Error fetching sentences:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get specific sentence by id
exports.getSentenceById = async (req, res) => {
  try {
    const sentenceId = req.params.id;
    
    const preAssessmentDb = getPreAssessmentDb();
    const sentencesCollection = preAssessmentDb.collection('sentences_collection');
    
    // Try to find by ObjectId first
    let sentence = null;
    if (mongoose.Types.ObjectId.isValid(sentenceId)) {
      sentence = await sentencesCollection.findOne({
        _id: ObjectId(sentenceId)
      });
    }
    
    // If not found, try by sentenceID string
    if (!sentence) {
      sentence = await sentencesCollection.findOne({
        sentenceID: sentenceId
      });
    }
    
    if (!sentence) {
      return res.status(404).json({ message: 'Sentence not found' });
    }
    
    res.json(sentence);
  } catch (error) {
    console.error('Error fetching sentence:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get short stories
exports.getShortStories = async (req, res) => {
  try {
    const preAssessmentDb = getPreAssessmentDb();
    const shortStoryCollection = preAssessmentDb.collection('shortstory_collection');
    
    const stories = await shortStoryCollection.find({}).toArray();
    
    res.json(stories);
  } catch (error) {
    console.error('Error fetching short stories:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get specific short story by id
exports.getShortStoryById = async (req, res) => {
  try {
    const storyId = req.params.id;
    
    const preAssessmentDb = getPreAssessmentDb();
    const shortStoryCollection = preAssessmentDb.collection('shortstory_collection');
    
    // Try to find by ObjectId first
    let story = null;
    if (mongoose.Types.ObjectId.isValid(storyId)) {
      story = await shortStoryCollection.findOne({
        _id: ObjectId(storyId)
      });
    }
    
    // If not found, try by storyID string
    if (!story) {
      story = await shortStoryCollection.findOne({
        storyID: storyId
      });
    }
    
    if (!story) {
      return res.status(404).json({ message: 'Short story not found' });
    }
    
    res.json(story);
  } catch (error) {
    console.error('Error fetching short story:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * Get content for a specific reference
 * @route POST /api/teacher/content/reference
 */
exports.getContentReference = async (req, res) => {
  try {
    const { collection, contentId } = req.body;
    
    if (!collection || !contentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Collection and content ID are required' 
      });
    }
    
    const preAssessmentDb = getPreAssessmentDb();
    const collectionObj = preAssessmentDb.collection(collection);
    
    // Try to find by ObjectId
    let content = null;
    if (mongoose.Types.ObjectId.isValid(contentId)) {
      content = await collectionObj.findOne({
        _id: ObjectId(contentId)
      });
    }
    
    // If not found and contentId is in $oid format
    if (!content && typeof contentId === 'object' && contentId.$oid) {
      content = await collectionObj.findOne({
        _id: ObjectId(contentId.$oid)
      });
    }
    
    // If still not found, try type-specific ID field
    if (!content) {
      const contentType = collection.replace('_collection', '');
      const idField = `${contentType}ID`;
      
      const query = {};
      query[idField] = contentId.toString();
      
      content = await collectionObj.findOne(query);
    }
    
    if (!content) {
      return res.status(404).json({ 
        success: false,
        message: 'Content not found' 
      });
    }
    
    res.json({
      success: true,
      content
    });
  } catch (error) {
    console.error('Error getting content reference:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};