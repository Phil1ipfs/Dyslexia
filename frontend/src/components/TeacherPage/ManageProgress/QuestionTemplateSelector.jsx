// components/TeacherPage/ManageProgress/QuestionTemplateSelector.jsx

import React, { useState, useEffect } from 'react';
import {
    FaSearch, FaClone, FaPlus, FaMinus, FaExchangeAlt, FaRandom,
    FaCheck, FaFilter, FaArrowDown, FaInfoCircle, FaTimes
} from 'react-icons/fa';

// Import services
import AssessmentApiService from '../../../services/Teachers/ManageProgress/AssessmentApiService';
import ContentApiService from '../../../services/Teachers/ManageProgress/ContentApiService';

import './css/QuestionTemplateSelector.css';

const QuestionTemplateSelector = ({
    categoryId,
    readingLevel,
    onAddQuestion,
    onClose
}) => {
    // States
    const [loading, setLoading] = useState(true);
    const [templateQuestions, setTemplateQuestions] = useState([]);
    const [filteredQuestions, setFilteredQuestions] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [contentCollections, setContentCollections] = useState({
        letters: [],
        syllables: [],
        words: [],
        sentences: [],
        shortstories: []
    });
    const [selectedContent, setSelectedContent] = useState(null);
    const [contentSearchQuery, setContentSearchQuery] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [activeTab, setActiveTab] = useState('templates');
    const [questionTypeFilter, setQuestionTypeFilter] = useState('all');

    useEffect(() => {


        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch template questions for this category and reading level
                const templates = await AssessmentApiService.getTemplateQuestions(categoryId, readingLevel);

                if (templates && templates.templateQuestions) {
                    setTemplateQuestions(templates.templateQuestions);
                    setFilteredQuestions(templates.templateQuestions);
                }

                // Fetch content collections
                await fetchContentCollections();

                setLoading(false);
            } catch (error) {
                console.error("Error loading template questions:", error);
                setError("Failed to load question templates. Please try again.");
                setLoading(false);
            }
        };

        fetchData();
    }, [categoryId, readingLevel]);

    const fetchContentCollections = async () => {
        try {
            const contentLoading = true;
            setError(null);

            // Initialize collections with empty arrays
            const collections = {
                letters: [],
                syllables: [],
                words: [],
                sentences: [],
                shortstories: []
            };
            
            // Use Promise.allSettled to prevent one failure from blocking everything
            const results = await Promise.allSettled([
                ContentApiService.getLetters(),
                ContentApiService.getSyllables(),
                ContentApiService.getWords(),
                ContentApiService.getSentences(),
                ContentApiService.getShortStories()
            ]);

            // Process results regardless of status
            if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
                collections.letters = results[0].value;
            }

            if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
                collections.syllables = results[1].value;
            }

            if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
                collections.words = results[2].value;
            }

            if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) {
                collections.sentences = results[3].value;
            }

            if (results[4].status === 'fulfilled' && Array.isArray(results[4].value)) {
                collections.shortstories = results[4].value;
            }

            setContentCollections(collections);
        } catch (error) {
            console.error('Error fetching content collections:', error);
            setError("Could not load content collections for questions.");
        }
    };




    // Apply search and type filters to template questions
    useEffect(() => {
        if (!templateQuestions || templateQuestions.length === 0) return;

        const filtered = templateQuestions.filter(item => {
            // Filter by search query
            const matchesSearch = !searchQuery || (
                item.question.questionText?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.assessmentTitle?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            // Filter by question type
            const matchesType = questionTypeFilter === 'all' ||
                item.question.typeId?.toLowerCase() === questionTypeFilter.toLowerCase();

            return matchesSearch && matchesType;
        });

        setFilteredQuestions(filtered);
    }, [searchQuery, questionTypeFilter, templateQuestions]);

    // Select a question template to customize
    const handleSelectQuestion = (question) => {
        setCurrentQuestion(question);
        setActiveTab('content');
        setSelectedContent(null);
        setContentSearchQuery('');
    };

    // Get collection type from content reference
    const getCollectionType = (contentReference) => {
        if (!contentReference || !contentReference.collection) return null;

        return contentReference.collection.replace('_collection', '');
    };

    // Get filtered content based on collection type and search query
    const getFilteredContent = () => {
        if (!currentQuestion || !currentQuestion.question.contentReference) {
            return [];
        }

        const collectionType = getCollectionType(currentQuestion.question.contentReference);
        if (!collectionType) return [];

        let contentArray = contentCollections[collectionType] || [];

        // Filter by search query
        if (contentSearchQuery) {
            return contentArray.filter(item => {
                // Different search criteria based on content type
                if (collectionType === 'letters') {
                    return (
                        item.smallLetter?.toLowerCase().includes(contentSearchQuery.toLowerCase()) ||
                        item.bigLetter?.toLowerCase().includes(contentSearchQuery.toLowerCase()) ||
                        item.soundText?.toLowerCase().includes(contentSearchQuery.toLowerCase())
                    );
                } else if (collectionType === 'syllables' || collectionType === 'words') {
                    return (
                        item.text?.toLowerCase().includes(contentSearchQuery.toLowerCase()) ||
                        item.soundText?.toLowerCase().includes(contentSearchQuery.toLowerCase())
                    );
                } else if (collectionType === 'sentences' || collectionType === 'shortstories') {
                    return (
                        item.text?.toLowerCase().includes(contentSearchQuery.toLowerCase()) ||
                        item.title?.toLowerCase().includes(contentSearchQuery.toLowerCase())
                    );
                }
                return false;
            });
        }

        return contentArray;
    };

    // Select content for the question
    const handleSelectContent = (content) => {
        setSelectedContent(content);
    };

    // Continuing QuestionTemplateSelector.jsx

    // Add the question with selected content
    const handleAddQuestion = () => {
        if (!currentQuestion) return;

        try {
            // Clone the question
            const clonedQuestion = JSON.parse(JSON.stringify(currentQuestion.question));

            // If content was selected, update the content reference
            if (selectedContent) {
                const collectionType = getCollectionType(clonedQuestion.contentReference);

                if (collectionType) {
                    clonedQuestion.contentReference = {
                        collection: `${collectionType}_collection`,
                        contentId: selectedContent._id
                    };
                }
            }

            // Generate a new ID for the question
            clonedQuestion.originalQuestionId = clonedQuestion.questionId;
            clonedQuestion.questionId = Date.now().toString();

            // Call the callback to add the question
            onAddQuestion(clonedQuestion);

            // Show success message
            setSuccess("Question successfully added to the assessment!");

            // Reset states
            setCurrentQuestion(null);
            setSelectedContent(null);
            setActiveTab('templates');

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccess(null);
            }, 3000);
        } catch (error) {
            console.error("Error adding question:", error);
            setError("Failed to add question. Please try again.");
        }
    };

    // Randomly select content for the current question
    const handleRandomContent = () => {
        if (!currentQuestion || !currentQuestion.question.contentReference) {
            return;
        }

        const collectionType = getCollectionType(currentQuestion.question.contentReference);
        if (!collectionType) return;

        const contentArray = contentCollections[collectionType] || [];
        if (contentArray.length === 0) return;

        // Pick a random item
        const randomIndex = Math.floor(Math.random() * contentArray.length);
        const randomContent = contentArray[randomIndex];

        setSelectedContent(randomContent);
    };

    // Get unique question types from templates
    const getQuestionTypes = () => {
        if (!templateQuestions || templateQuestions.length === 0) return ['all'];

        const types = templateQuestions.map(item => item.question.typeId)
            .filter(type => !!type)
            .filter((type, index, self) => self.indexOf(type) === index);

        return ['all', ...types];
    };

    // Format content for display based on type
    const formatContentForDisplay = (content, type) => {
        if (!content) return "No content available";

        switch (type) {
            case 'letters':
                return `${content.bigLetter}/${content.smallLetter} - Sound: ${content.soundText || ""}`;
            case 'syllables':
                return `${content.text} - Sound: ${content.soundText || ""}`;
            case 'words':
                return `${content.text}${content.meaning ? ` - Meaning: ${content.meaning}` : ""}`;
            case 'sentences':
                return content.text;
            case 'shortstories':
                return content.title ? `${content.title}: ${content.content.substring(0, 50)}...` : content.content.substring(0, 50) + "...";
            default:
                return "Unknown content type";
        }
    };

    // Get content preview element based on content and type
    const getContentPreviewElement = (content, type) => {
        if (!content) return <div className="qts-no-content">No content available</div>;

        switch (type) {
            case 'letters':
                return (
                    <div className="qts-letter-content">
                        <div className="qts-letter-pair">
                            <div className="qts-big-letter">{content.bigLetter}</div>
                            <div className="qts-small-letter">{content.smallLetter}</div>
                        </div>
                        {content.soundText && (
                            <div className="qts-sound-text">Sound: {content.soundText}</div>
                        )}
                    </div>
                );
            case 'syllables':
                return (
                    <div className="qts-syllable-content">
                        <div className="qts-syllable-text">{content.text}</div>
                        {content.soundText && (
                            <div className="qts-sound-text">Sound: {content.soundText}</div>
                        )}
                    </div>
                );
            case 'words':
                return (
                    <div className="qts-word-content">
                        <div className="qts-word-text">{content.text}</div>
                        {content.meaning && (
                            <div className="qts-word-meaning">Meaning: {content.meaning}</div>
                        )}
                        {content.imageUrl && (
                            <div className="qts-word-image">
                                <img src={content.imageUrl} alt={content.text} />
                            </div>
                        )}
                    </div>
                );
            case 'sentences':
                return (
                    <div className="qts-sentence-content">
                        <div className="qts-sentence-text">"{content.text}"</div>
                    </div>
                );
            case 'shortstories':
                return (
                    <div className="qts-shortstory-content">
                        {content.title && (
                            <div className="qts-shortstory-title">{content.title}</div>
                        )}
                        <div className="qts-shortstory-text">
                            {content.content.length > 200
                                ? content.content.substring(0, 200) + "..."
                                : content.content}
                        </div>
                    </div>
                );
            default:
                return <div className="qts-no-content">Unknown content type</div>;
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="qts-container">
                <div className="qts-loading">
                    <div className="qts-spinner"></div>
                    <p>Loading question templates...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="qts-container">
            {/* Close button */}
            <button className="qts-close-btn" onClick={onClose}>
                <FaTimes />
            </button>

            {/* Header */}
            <div className="qts-header">
                <h2>Add Question from Templates</h2>
                <p>Select a question template and customize its content</p>
            </div>

            {/* Error message */}
            {error && (
                <div className="qts-error">
                    <FaInfoCircle /> {error}
                </div>
            )}

            {/* Success message */}
            {success && (
                <div className="qts-success">
                    <FaCheck /> {success}
                </div>
            )}

            {/* Tabs */}
            <div className="qts-tabs">
                <button
                    className={`qts-tab ${activeTab === 'templates' ? 'active' : ''}`}
                    onClick={() => setActiveTab('templates')}
                >
                    Question Templates
                </button>
                <button
                    className={`qts-tab ${activeTab === 'content' ? 'active' : ''}`}
                    onClick={() => setActiveTab('content')}
                    disabled={!currentQuestion}
                >
                    Content Selection
                </button>
            </div>

            {/* Template Tab Content */}
            {activeTab === 'templates' && (
                <div className="qts-template-content">
                    {/* Search and filters */}
                    <div className="qts-filters">
                        <div className="qts-search">
                            <FaSearch />
                            <input
                                type="text"
                                placeholder="Search question templates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <div className="qts-type-filter">
                            <label><FaFilter /> Question Type:</label>
                            <select
                                value={questionTypeFilter}
                                onChange={(e) => setQuestionTypeFilter(e.target.value)}
                            >
                                {getQuestionTypes().map(type => (
                                    <option key={type} value={type}>
                                        {type === 'all' ? 'All Types' : type.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Templates list */}
                    {filteredQuestions.length === 0 ? (
                        <div className="qts-no-templates">
                            <FaInfoCircle />
                            <p>No question templates found. Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <div className="qts-templates-list">
                            {filteredQuestions.map((item, index) => (
                                <div key={index} className="qts-template-item">
                                    <div className="qts-template-info">
                                        <div className="qts-template-title">
                                            Q{item.question.questionNumber || item.question.questionId}: {item.question.questionText}
                                        </div>
                                        <div className="qts-template-meta">
                                            <span className="qts-template-type">
                                                <FaFilter /> {item.question.typeId.replace(/_/g, ' ')}
                                            </span>
                                            <span className="qts-template-assessment">
                                                From: {item.assessmentTitle}
                                            </span>
                                        </div>
                                        {item.question.contentReference && (
                                            <div className="qts-template-content-type">
                                                <FaInfoCircle /> Uses content from: {getCollectionType(item.question.contentReference)}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        className="qts-select-template-btn"
                                        onClick={() => handleSelectQuestion(item)}
                                    >
                                        <FaClone /> Select
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Content Tab Content */}
            {activeTab === 'content' && currentQuestion && (
                <div className="qts-content-tab">
                    <div className="qts-selected-question">
                        <h3>Selected Question Template</h3>
                        <div className="qts-selected-question-text">
                            {currentQuestion.question.questionText}
                        </div>
                        <div className="qts-selected-question-type">
                            <FaFilter /> Type: {currentQuestion.question.typeId.replace(/_/g, ' ')}
                        </div>
                    </div>

                    {currentQuestion.question.contentReference ? (
                        <>
                            <div className="qts-content-selection">
                                <h3>Select Content for this Question</h3>
                                <p>Choose content from the {getCollectionType(currentQuestion.question.contentReference)} collection</p>

                                <div className="qts-content-search">
                                    <FaSearch />
                                    <input
                                        type="text"
                                        placeholder={`Search ${getCollectionType(currentQuestion.question.contentReference)}...`}
                                        value={contentSearchQuery}
                                        onChange={(e) => setContentSearchQuery(e.target.value)}
                                    />
                                    <button
                                        className="qts-random-content-btn"
                                        onClick={handleRandomContent}
                                        title="Pick random content"
                                    >
                                        <FaRandom />
                                    </button>
                                </div>

                                <div className="qts-content-preview">
                                    <div className="qts-current-content">
                                        <h4>Original Content</h4>
                                        {getContentPreviewElement(
                                            // Fetch original content here
                                            null,
                                            getCollectionType(currentQuestion.question.contentReference)
                                        )}
                                    </div>

                                    <div className="qts-arrow">
                                        <FaArrowDown />
                                    </div>

                                    <div className="qts-new-content">
                                        <h4>New Content</h4>
                                        {selectedContent ? (
                                            getContentPreviewElement(
                                                selectedContent,
                                                getCollectionType(currentQuestion.question.contentReference)
                                            )
                                        ) : (
                                            <div className="qts-no-selection">
                                                <FaInfoCircle />
                                                <p>No content selected yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="qts-content-list">
                                    <h4>Available Content Items</h4>
                                    <div className="qts-content-grid">
                                        {getFilteredContent().length === 0 ? (
                                            <div className="qts-no-content-items">
                                                <FaInfoCircle />
                                                <p>No content items found. Try adjusting your search.</p>
                                            </div>
                                        ) : (
                                            getFilteredContent().map((content, index) => (
                                                <div
                                                    key={index}
                                                    className={`qts-content-item ${selectedContent && selectedContent._id === content._id ? 'selected' : ''}`}
                                                    onClick={() => handleSelectContent(content)}
                                                >
                                                    <div className="qts-content-item-preview">
                                                        {getContentPreviewElement(
                                                            content,
                                                            getCollectionType(currentQuestion.question.contentReference)
                                                        )}
                                                    </div>
                                                    <div className="qts-content-item-select">
                                                        {selectedContent && selectedContent._id === content._id ? (
                                                            <FaCheck />
                                                        ) : (
                                                            <FaPlus />
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="qts-actions">
                                <button
                                    className="qts-back-btn"
                                    onClick={() => setActiveTab('templates')}
                                >
                                    <FaTimes /> Cancel
                                </button>
                                <button
                                    className="qts-add-btn"
                                    onClick={handleAddQuestion}
                                    disabled={!currentQuestion}
                                >
                                    <FaPlus /> Add Question to Assessment
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="qts-no-content-reference">
                            <FaInfoCircle />
                            <p>This question template doesn't use content references.</p>
                            <div className="qts-actions">
                                <button
                                    className="qts-back-btn"
                                    onClick={() => setActiveTab('templates')}
                                >
                                    <FaTimes /> Cancel
                                </button>
                                <button
                                    className="qts-add-btn"
                                    onClick={handleAddQuestion}
                                >
                                    <FaPlus /> Add Question to Assessment
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default QuestionTemplateSelector;