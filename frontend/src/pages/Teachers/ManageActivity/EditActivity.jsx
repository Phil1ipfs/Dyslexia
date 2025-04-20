// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { 
//   faArrowLeft, 
//   faSave, 
//   faSpinner, 
//   faCloudUploadAlt, 
//   faInfoCircle, 
//   faExclamationTriangle,
//   faCheck,
//   faTrash,
//   faPlus,
//   faImage,
//   faHeadphones,
//   faFont,
//   faFileAlt,
//   faVolumeUp
// } from '@fortawesome/free-solid-svg-icons';
// import '../../../css/Teachers/EditActivity.css';

// // Import mock data
// import { 
//   readingLevels, 
//   categories 
// } from "../../../data/Teachers/activityData";

// const EditActivity = () => {
//   const navigate = useNavigate();
//   const { id } = useParams();
//   const [loading, setLoading] = useState(true);
//   const [activityData, setActivityData] = useState(null);
//   const [error, setError] = useState(null);
//   const [currentStep, setCurrentStep] = useState(1);
//   const [contentTypes, setContentTypes] = useState([
//     { id: 'reading', name: 'Reading Passages', icon: faFileAlt },
//     { id: 'image', name: 'Image Based', icon: faImage },
//     { id: 'voice', name: 'Voice to Text', icon: faVolumeUp }
//   ]);
//   const [contentType, setContentType] = useState('');
//   const [questions, setQuestions] = useState([]);
//   const [readingContent, setReadingContent] = useState([]);
//   const [submitting, setSubmitting] = useState(false);
//   const [submitSuccess, setSubmitSuccess] = useState(false);
  
//   // Pagination variables
//   const [itemsPerPage] = useState(5);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
  
//   // Calculate total pages for questions
//   useEffect(() => {
//     if (questions.length > 0) {
//       setTotalPages(Math.ceil(questions.length / itemsPerPage));
//     } else {
//       setTotalPages(1);
//     }
//   }, [questions, itemsPerPage]);
  
//   // Get current items for pagination
//   const getCurrentItems = () => {
//     const indexOfLastItem = currentPage * itemsPerPage;
//     const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//     return questions.slice(indexOfFirstItem, indexOfLastItem);
//   };
  
//   // Change page
//   const paginate = (pageNumber) => {
//     setCurrentPage(pageNumber);
//     window.scrollTo(0, 0);
//   };
  
//   // Fetch activity data when component mounts
//   useEffect(() => {
//     const fetchActivity = async () => {
//       setLoading(true);
//       try {
//         // In a real app, you would fetch from your API
//         const mockResponse = await import('../../../data/Teachers/activitiesMockData');
//         const activities = mockResponse.default;
//         const activity = activities.find(a => a.id === parseInt(id));
        
//         if (!activity) {
//           throw new Error('Activity not found');
//         }
        
//         setActivityData({
//           id: activity.id,
//           title: activity.title,
//           level: activity.level,
//           category: activity.categories[0], // Using first category
//           type: activity.type,
//           contentType: activity.contentType.toLowerCase(),
//           description: activity.description,
//           status: activity.status
//         });
        
//         setContentType(activity.contentType.toLowerCase());
        
//         // Initialize with sample reading content with more fields
//         setReadingContent([
//           {
//             id: 1,
//             text: 'Sample reading passage text',
//             translation: 'Translation or notes',
//             syllableBreakdown: 'Sam-ple read-ing pas-sage text',
//             supportingImage: null,
//             audioRecording: null
//           }
//         ]);
        
//       } catch (err) {
//         console.error('Error fetching activity:', err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchActivity();
//   }, [id]);

//   // Handle activity data changes
//   const handleActivityDataChange = (e) => {
//     const { name, value } = e.target;
//     setActivityData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };
  
//   // Handle content type change
//   const handleContentTypeChange = (type) => {
//     setContentType(type);
//     setActivityData(prev => ({
//       ...prev,
//       contentType: type
//     }));
//   };
  
//   // Handle reading content changes
//   const handleReadingContentChange = (index, field, value) => {
//     const newContent = [...readingContent];
//     newContent[index] = {
//       ...newContent[index],
//       [field]: value
//     };
//     setReadingContent(newContent);
//   };
  
//   // Add new reading content
//   const addReadingContent = () => {
//     setReadingContent([
//       ...readingContent,
//       {
//         id: Date.now(),
//         text: '',
//         translation: '',
//         syllableBreakdown: '',
//         supportingImage: null,
//         audioRecording: null
//       }
//     ]);
//   };
  
//   // Remove reading content
//   const removeReadingContent = (id) => {
//     if (readingContent.length <= 1) return;
//     setReadingContent(readingContent.filter(content => content.id !== id));
//   };
  
//   // Handle file upload for images
//   const handleImageUpload = (index, e) => {
//     const file = e.target.files[0];
//     if (file) {
//       // In a real app, you would upload this to a server
//       // Here we're just creating a local URL
//       const imageUrl = URL.createObjectURL(file);
//       handleReadingContentChange(index, 'supportingImage', imageUrl);
//     }
//   };
  
//   // Handle file upload for audio
//   const handleAudioUpload = (index, e) => {
//     const file = e.target.files[0];
//     if (file) {
//       // In a real app, you would upload this to a server
//       // Here we're just creating a local URL
//       const audioUrl = URL.createObjectURL(file);
//       handleReadingContentChange(index, 'audioRecording', audioUrl);
//     }
//   };
  
//   // Handle question changes
//   const handleQuestionChange = (index, field, value) => {
//     const newQuestions = [...questions];
//     newQuestions[index] = {
//       ...newQuestions[index],
//       [field]: value
//     };
//     setQuestions(newQuestions);
//   };
  
//   // Handle option changes
//   const handleOptionChange = (questionIndex, optionIndex, value) => {
//     const newQuestions = [...questions];
//     newQuestions[questionIndex].options[optionIndex] = value;
//     setQuestions(newQuestions);
//   };
  
//   // Handle correct answer selection
//   const handleCorrectAnswerChange = (questionIndex, optionIndex) => {
//     const newQuestions = [...questions];
//     newQuestions[questionIndex].correctAnswer = optionIndex;
//     setQuestions(newQuestions);
//   };
  
//   // Add new question
//   const addQuestion = () => {
//     setQuestions([
//       ...questions,
//       { 
//         id: Date.now(), 
//         text: '', 
//         options: ['', ''], 
//         correctAnswer: 0,
//         hint: ''
//       }
//     ]);
//   };
  
//   // Remove question
//   const removeQuestion = (id) => {
//     if (questions.length <= 1) return;
//     setQuestions(questions.filter(q => q.id !== id));
//   };
  
//   // Validate form
//   const validateForm = (step) => {
//     if (step === 1) {
//       if (!activityData?.title?.trim()) {
//         setError('Activity title is required');
//         return false;
//       }
//       if (!activityData?.description?.trim()) {
//         setError('Activity description is required');
//         return false;
//       }
//     } else if (step === 2) {
//       // Validate content
//       if (contentType === 'reading' && readingContent.some(c => !c.text.trim())) {
//         setError('All reading passages must have text');
//         return false;
//       }
      
//       // Validate questions
//       if (questions.some(q => !q.text.trim())) {
//         setError('All questions must have text');
//         return false;
//       }
      
//       if (questions.some(q => q.options.some(opt => !opt.trim()))) {
//         setError('All options must have text');
//         return false;
//       }
//     }
    
//     return true;
//   };
  
//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (currentStep === 1) {
//       if (validateForm(1)) {
//         setError(null);
//         setCurrentStep(2);
//         setCurrentPage(1); // Reset to first page when moving to step 2
//         window.scrollTo(0, 0);
//       }
//     } else {
//       if (validateForm(2)) {
//         setError(null);
//         setSubmitting(true);
        
//         try {
//           // Build the complete updated activity data
//           const updatedActivity = {
//             ...activityData,
//             content: contentType === 'reading' ? readingContent : [],
//             questions: questions,
//             status: 'pending',
//             lastModified: new Date().toISOString(),
//             submittedAt: new Date().toISOString()
//           };
          
//           // In a real app, this would be an API call
//           console.log('Submitting for approval:', updatedActivity);
          
//           // Simulate API call
//           await new Promise(resolve => setTimeout(resolve, 1500));
          
//           setSubmitSuccess(true);
          
//           // Redirect after success message
//           setTimeout(() => {
//             navigate('/teacher/manage-activities');
//           }, 2000);
//         } catch (err) {
//           console.error('Error submitting activity:', err);
//           setError('Failed to submit activity. Please try again.');
//         } finally {
//           setSubmitting(false);
//         }
//       }
//     }
//   };
  
//   // Go back to previous step or to manage activities
//   const handleBack = () => {
//     if (currentStep === 2) {
//       setCurrentStep(1);
//       window.scrollTo(0, 0);
//     } else {
//       navigate('/teacher/manage-activities');
//     }
//   };
  
//   // Render content type selection
//   const renderContentTypeSelection = () => {
//     return (
//       <div className="content-type-selection">
//         <h3 className="section-title">Content Type</h3>
//         <div className="content-type-options">
//           {contentTypes.map(type => (
//             <div 
//               key={type.id}
//               className={`content-type-option ${contentType === type.id ? 'active' : ''}`}
//               onClick={() => handleContentTypeChange(type.id)}
//             >
//               <div className="content-type-icon">
//                 <FontAwesomeIcon icon={type.icon} />
//               </div>
//               <div className="content-type-details">
//                 <div className="content-type-name">{type.name}</div>
//                 <div className="content-type-description">
//                   {type.id === 'reading' && 'Text-based activities with syllable breakdowns and supporting visuals'}
//                   {type.id === 'image' && 'Visually-driven activities with supporting captions and questions'}
//                   {type.id === 'voice' && 'Pronunciation and speaking activities with audio samples'}
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };
  
//   // Loading state
//   if (loading) {
//     return (
//       <div className="edit-activity-container">
//         <div className="loading-state">
//           <FontAwesomeIcon icon={faSpinner} spin className="spinner-icon" />
//           <p>Loading activity data...</p>
//         </div>
//       </div>
//     );
//   }
  
//   // Error state
//   if (error && !activityData) {
//     return (
//       <div className="edit-activity-container">
//         <div className="error-state">
//           <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
//           <h2>Error Loading Activity</h2>
//           <p>{error}</p>
//           <button 
//             className="btn-back" 
//             onClick={() => navigate('/teacher/manage-activities')}
//           >
//             <FontAwesomeIcon icon={faArrowLeft} /> Back to Activities
//           </button>
//         </div>
//       </div>
//     );
//   }
  
//   // Success state after submission
//   if (submitSuccess) {
//     return (
//       <div className="edit-activity-container">
//         <div className="success-state">
//           <FontAwesomeIcon icon={faCheck} className="success-icon" />
//           <h2>Activity Submitted for Approval</h2>
//           <p>Your edited activity has been submitted and is awaiting admin approval.</p>
//           <p>You will be redirected to the activities page.</p>
//         </div>
//       </div>
//     );
//   }
  
//   if (!activityData) return null;

//   return (
//     <div className="edit-activity-container">
//       <div className="edit-activity-header">
//         <h1 className="page-title">
//           {currentStep === 1 ? 'Edit Activity' : 'Configure Content & Questions'}
//         </h1>
//         <p className="page-subtitle">
//           Edit activity details and submit for approval
//         </p>
//       </div>
      
//       <div className="steps-indicator">
//         <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
//           <div className="step-number">1</div>
//           <div className="step-label">Basic Information</div>
//         </div>
//         <div className="step-connector"></div>
//         <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
//           <div className="step-number">2</div>
//           <div className="step-label">Content Configuration</div>
//         </div>
//       </div>
      
//       {error && (
//         <div className="error-message">
//           <FontAwesomeIcon icon={faExclamationTriangle} />
//           <span>{error}</span>
//         </div>
//       )}
      
//       <div className="activity-form-container">
//         <form onSubmit={handleSubmit}>
//           {/* Step 1: Basic Information */}
//           {currentStep === 1 && (
//             <div className="form-section">
//               <h2 className="section-title">Basic Information</h2>
              
//               <div className="form-group">
//                 <label htmlFor="title">Activity Title</label>
//                 <input
//                   type="text"
//                   id="title"
//                   name="title"
//                   value={activityData.title}
//                   onChange={handleActivityDataChange}
//                   required
//                   placeholder="Enter a descriptive title..."
//                 />
//               </div>
              
//               <div className="form-row">
//                 <div className="form-group">
//                   <label htmlFor="level">Reading Level (Antas)</label>
//                   <div className="custom-select">
//                     <select
//                       id="level"
//                       name="level"
//                       value={activityData.level}
//                       onChange={handleActivityDataChange}
//                       required
//                     >
//                       {readingLevels.slice(1).map((level, index) => (
//                         <option key={index} value={level}>{level}</option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
                
//                 <div className="form-group">
//                   <label htmlFor="category">Category</label>
//                   <div className="custom-select">
//                     <select
//                       id="category"
//                       name="category"
//                       value={activityData.category}
//                       onChange={handleActivityDataChange}
//                       required
//                     >
//                       {categories.slice(1).map((category, index) => (
//                         <option key={index} value={category}>{category}</option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>
//               </div>
              
//               <div className="form-row">
//                 <div className="form-group">
//                   <label htmlFor="type">Activity Type</label>
//                   <div className="custom-select">
//                     <select
//                       id="type"
//                       name="type"
//                       value={activityData.type}
//                       onChange={handleActivityDataChange}
//                       required
//                     >
//                       <option value="template">Activity Template</option>
//                       <option value="assessment">Pre-Assessment</option>
//                       <option value="practice">Practice Module</option>
//                     </select>
//                   </div>
//                 </div>
//               </div>
              
//               {/* Content Type Selection */}
//               {renderContentTypeSelection()}
              
//               <div className="form-group">
//                 <label htmlFor="description">Description</label>
//                 <textarea
//                   id="description"
//                   name="description"
//                   value={activityData.description}
//                   onChange={handleActivityDataChange}
//                   rows="3"
//                   placeholder="Describe the activity and its learning objectives..."
//                   required
//                 ></textarea>
//               </div>
//             </div>
//           )}
          
//           {/* Step 2: Content and Questions */}
//           {currentStep === 2 && (
//             <>
//               {/* Reading Content Section */}
//               {contentType === 'reading' && (
//                 <div className="form-section">
//                   <h2 className="section-title">Reading Passages <span className="badge">{readingContent.length}</span></h2>
                  
//                   {readingContent.map((content, index) => (
//                     <div key={content.id} className="content-item">
//                       <div className="passage-header">
//                         <h3 className="passage-number">Passage {index + 1}</h3>
//                         <button 
//                           type="button" 
//                           className="btn-remove"
//                           onClick={() => removeReadingContent(content.id)}
//                           disabled={readingContent.length <= 1}
//                         >
//                           <FontAwesomeIcon icon={faTrash} /> Remove
//                         </button>
//                       </div>
                      
//                       <div className="passage-grid">
//                         <div className="passage-main">
//                           <div className="form-group">
//                             <label>Passage Text <span className="required">*</span></label>
//                             <textarea
//                               value={content.text}
//                               onChange={(e) => handleReadingContentChange(index, 'text', e.target.value)}
//                               rows="4"
//                               placeholder="Enter the reading passage text..."
//                               required
//                               className="passage-text-input"
//                             ></textarea>
//                           </div>
//                         </div>
                        
//                         <div className="passage-syllable">
//                           <div className="form-group">
//                             <label>Syllable Breakdown</label>
//                             <textarea
//                               value={content.syllableBreakdown}
//                               onChange={(e) => handleReadingContentChange(index, 'syllableBreakdown', e.target.value)}
//                               rows="4"
//                               placeholder="Ex: A-so ni Li-za"
//                               className="syllable-input"
//                             ></textarea>
//                           </div>
//                         </div>
                        
//                         <div className="passage-translation">
//                           <div className="form-group">
//                             <label>Translation/Notes (optional)</label>
//                             <textarea
//                               value={content.translation}
//                               onChange={(e) => handleReadingContentChange(index, 'translation', e.target.value)}
//                               rows="3"
//                               placeholder="Translation or additional notes..."
//                               className="translation-input"
//                             ></textarea>
//                           </div>
//                         </div>
                        
//                         <div className="passage-image">
//                           <label>Supporting Image</label>
//                           <div className="upload-container">
//                             {content.supportingImage ? (
//                               <div className="image-preview">
//                                 <img 
//                                   src={content.supportingImage} 
//                                   alt="Supporting visual" 
//                                   className="preview-image"
//                                 />
//                                 <button 
//                                   type="button" 
//                                   className="remove-image"
//                                   onClick={() => handleReadingContentChange(index, 'supportingImage', null)}
//                                 >
//                                   Remove
//                                 </button>
//                               </div>
//                             ) : (
//                               <div className="upload-placeholder">
//                                 <label htmlFor={`image-upload-${index}`} className="upload-label">
//                                   <FontAwesomeIcon icon={faImage} className="upload-icon" />
//                                   <div>Choose Image</div>
//                                 </label>
//                                 <input 
//                                   type="file" 
//                                   id={`image-upload-${index}`}
//                                   accept="image/*" 
//                                   className="file-input"
//                                   onChange={(e) => handleImageUpload(index, e)}
//                                 />
//                               </div>
//                             )}
//                           </div>
//                         </div>
                        
//                         <div className="passage-audio">
//                           <label>Audio Recording (optional)</label>
//                           <div className="upload-container">
//                             {content.audioRecording ? (
//                               <div className="audio-preview">
//                                 <audio 
//                                   controls
//                                   src={content.audioRecording}
//                                   className="audio-player"
//                                 ></audio>
//                                 <button 
//                                   type="button" 
//                                   className="remove-audio"
//                                   onClick={() => handleReadingContentChange(index, 'audioRecording', null)}
//                                 >
//                                   Remove
//                                 </button>
//                               </div>
//                             ) : (
//                               <div className="upload-placeholder">
//                                 <label htmlFor={`audio-upload-${index}`} className="upload-label">
//                                   <FontAwesomeIcon icon={faHeadphones} className="upload-icon" />
//                                   <div>Upload Audio</div>
//                                 </label>
//                                 <input 
//                                   type="file" 
//                                   id={`audio-upload-${index}`}
//                                   accept="audio/*" 
//                                   className="file-input"
//                                   onChange={(e) => handleAudioUpload(index, e)}
//                                 />
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   ))}
                  
//                   <button 
//                     type="button" 
//                     className="btn-add-passage"
//                     onClick={addReadingContent}
//                   >
//                     <FontAwesomeIcon icon={faPlus} /> Add Another Passage
//                   </button>
//                 </div>
//               )}
              
//               {/* Questions Section */}
//               <div className="form-section">
//                 <h2 className="section-title">Questions</h2>
//                 <div className="questions-pagination-info">
//                   Showing page {currentPage} of {totalPages} ({questions.length} total questions)
//                 </div>
                
//                 {getCurrentItems().map((question, qIndex) => {
//                   // Calculate the actual question index in the full array
//                   const actualIndex = (currentPage - 1) * itemsPerPage + qIndex;
                  
//                   return (
//                     <div key={question.id} className="question-item">
//                       <div className="question-header">
//                         <h3>Question {actualIndex + 1}</h3>
//                         <button 
//                           type="button" 
//                           className="btn-remove"
//                           onClick={() => removeQuestion(question.id)}
//                           disabled={questions.length <= 1}
//                         >
//                           Remove
//                         </button>
//                       </div>
                      
//                       <div className="form-group">
//                         <label>Question Text</label>
//                         <textarea
//                           value={question.text}
//                           onChange={(e) => handleQuestionChange(actualIndex, 'text', e.target.value)}
//                           rows="2"
//                           placeholder="Enter the question..."
//                           required
//                         ></textarea>
//                       </div>
                      
//                       <div className="options-container">
//                         <label>Answer Options</label>
                        
//                         {question.options.map((option, optIndex) => (
//                           <div key={optIndex} className="option-row">
//                             <div className="radio-input">
//                               <input
//                                 type="radio"
//                                 id={`q${question.id}_opt${optIndex}`}
//                                 name={`q${question.id}_correct`}
//                                 checked={question.correctAnswer === optIndex}
//                                 onChange={() => handleCorrectAnswerChange(actualIndex, optIndex)}
//                               />
//                               <label htmlFor={`q${question.id}_opt${optIndex}`}>
//                                 {optIndex === 0 ? 'A' : 'B'}
//                               </label>
//                             </div>
//                             <input
//                               type="text"
//                               value={option}
//                               onChange={(e) => handleOptionChange(actualIndex, optIndex, e.target.value)}
//                               placeholder={`Option ${optIndex === 0 ? 'A' : 'B'}`}
//                               required
//                             />
//                           </div>
//                         ))}
//                       </div>
                      
//                       <div className="form-group">
//                         <label>Hint/Explanation (optional)</label>
//                         <textarea
//                           value={question.hint}
//                           onChange={(e) => handleQuestionChange(actualIndex, 'hint', e.target.value)}
//                           rows="2"
//                           placeholder="Hint or explanation to help students understand the correct answer..."
//                         ></textarea>
//                       </div>
//                     </div>
//                   );
//                 })}
                
//                 {/* Pagination Controls */}
//                 {totalPages > 1 && (
//                   <div className="pagination-controls">
//                     <button 
//                       className="pagination-button"
//                       onClick={() => paginate(1)} 
//                       disabled={currentPage === 1}
//                     >
//                       First
//                     </button>
//                     <button 
//                       className="pagination-button"
//                       onClick={() => paginate(currentPage - 1)} 
//                       disabled={currentPage === 1}
//                     >
//                       Previous
//                     </button>
                    
//                     <div className="pagination-numbers">
//                       {[...Array(totalPages)].map((_, i) => (
//                         <button
//                           key={i}
//                           className={`pagination-number ${i + 1 === currentPage ? 'active' : ''}`}
//                           onClick={() => paginate(i + 1)}
//                         >
//                           {i + 1}
//                         </button>
//                       ))}
//                     </div>
                    
//                     <button 
//                       className="pagination-button"
//                       onClick={() => paginate(currentPage + 1)} 
//                       disabled={currentPage === totalPages}
//                     >
//                       Next
//                     </button>
//                     <button 
//                       className="pagination-button"
//                       onClick={() => paginate(totalPages)} 
//                       disabled={currentPage === totalPages}
//                     >
//                       Last
//                     </button>
//                   </div>
//                 )}
                
//                 <button 
//                   type="button" 
//                   className="btn-add"
//                   onClick={addQuestion}
//                 >
//                   Add Another Question
//                 </button>
//               </div>
              
//               <div className="admin-approval-note">
//                 <FontAwesomeIcon icon={faInfoCircle} className="note-icon" />
//                 <p>
//                   This activity will be submitted for admin approval. Once approved, it will be available
//                   for students. You cannot edit the activity while it is pending approval.
//                 </p>
//               </div>
//             </>
//           )}
          
//           <div className="form-actions">
//             <button 
//               type="button" 
//               className="btn-back"
//               onClick={handleBack}
//               disabled={submitting}
//             >
//               <FontAwesomeIcon icon={faArrowLeft} /> {currentStep === 1 ? 'Cancel' : 'Back'}
//             </button>
            
//             <button 
//               type="submit" 
//               className="btn-next"
//               disabled={submitting}
//             >
//               {submitting ? (
//                 <>
//                   <FontAwesomeIcon icon={faSpinner} spin /> Submitting...
//                 </>
//               ) : currentStep === 1 ? (
//                 <>
//                   Next <FontAwesomeIcon icon={faArrowLeft} rotation={180} />
//                 </>
//               ) : (
//                 <>
//                   <FontAwesomeIcon icon={faCloudUploadAlt} /> Submit for Approval
//                 </>
//               )}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default EditActivity;
        

// src/pages/Teachers/ManageActivity/EditActivity.jsx
// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams }  from 'react-router-dom';
// import { FontAwesomeIcon }         from '@fortawesome/react-fontawesome';
// import {
//   faArrowLeft, faArrowRight,
//   faSpinner, faCloudUploadAlt,
//   faExclamationTriangle, faCheck,
//   faTrash, faPlus, faImage,
//   faHeadphones, faFileAlt,
//   faVolumeUp, faLayerGroup,
//   faInfoCircle, faQuestionCircle
// } from '@fortawesome/free-solid-svg-icons';
// import '../../../css/Teachers/EditActivity.css';
// import { readingLevels, categories } from '../../../data/Teachers/activityData';

// export default function EditActivity() {
//   const navigate = useNavigate();
//   const { id }  = useParams();

//   // ─── State ────────────────────────────────────────────────────────────────
//   const [loading, setLoading]           = useState(true);
//   const [error, setError]               = useState(null);
//   const [submitting, setSubmitting]     = useState(false);
//   const [submitSuccess, setSubmitSuccess] = useState(false);

//   const [activityData, setActivityData] = useState({
//     title:'', level:'', category:'', type:'', description:''
//   });

//   // each level: { id, levelName, contentType, content:[], questions:[] }
//   const [levels, setLevels]             = useState([]);
//   const [currentLevel, setCurrentLevel] = useState(null);

//   const [currentStep, setCurrentStep]   = useState(1);

//   // questions pagination
//   const [itemsPerPage] = useState(5);
//   const [currentPage,  setCurrentPage]  = useState(1);

//   // ─── Load mock data ──────────────────────────────────────────────────────
//   useEffect(() => {
//     async function load() {
//       try {
//         const mod = await import('../../../data/Teachers/activitiesMockData');
//         const act = mod.default.find(a => a.id===+id);
//         if (!act) throw new Error('Activity not found');

//         // Basic info
//         setActivityData({
//           title:       act.title,
//           level:       act.level,
//           category:    act.categories[0] || '',
//           type:        act.type,
//           description: act.description
//         });

//         // If your mock has `levels`, use them; otherwise seed one
//         let lvls = (act.levels && [...act.levels]) || [{
//           id: Date.now(),
//           levelName: act.level,
//           contentType: act.contentType.toLowerCase(),
//           content:    act.content || [],
//           questions:  act.questions || []
//         }];

//         setLevels(lvls);
//         setCurrentLevel(lvls[0].id);
//       } catch(err) {
//         console.error(err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   },[id]);

//   // ─── Helpers ─────────────────────────────────────────────────────────────
//   const getLevelObj = () => levels.find(l=>l.id===currentLevel);

//   const updateLevel = updated =>
//     setLevels(levels.map(l=>l.id===currentLevel ? updated : l));

//   const changeLevelField = (field,value) => {
//     const lvl = getLevelObj();
//     updateLevel({...lvl, [field]:value});
//   };

//   const defaultContentItem = type => {
//     const base = { id:Date.now() };
//     if (type==='reading') return { ...base, text:'', translation:'', syllables:'', imagePreview:null, audioPreview:null };
//     if (type==='image')   return { ...base, imagePreview:null, caption:'' };
//     return /*voice*/              { ...base, text:'', audioSample:null };
//   };

//   // ─── Validation ──────────────────────────────────────────────────────────
//   function validate(step) {
//     if (step===1) {
//       if (!activityData.title.trim()) { setError('Title required'); return false; }
//       if (!activityData.level)        { setError('Level required'); return false; }
//       if (!activityData.category)     { setError('Category required'); return false; }
//     }
//     if (step===2) {
//       const lvl = getLevelObj();
//       // content:
//       if (lvl.contentType==='reading' && lvl.content.some(c=>!c.text.trim())) {
//         setError('All passages need text'); return false;
//       }
//       if (lvl.contentType==='image' && lvl.content.some(c=>!c.imagePreview)) {
//         setError('All images required'); return false;
//       }
//       // questions:
//       if (lvl.questions.some(q=>!q.questionText.trim())) {
//         setError('All questions need text'); return false;
//       }
//       if (lvl.questions.some(q=>q.options.some(o=>!o.trim()))) {
//         setError('All options need text'); return false;
//       }
//     }
//     setError(null);
//     return true;
//   }

//   // ─── Handlers ────────────────────────────────────────────────────────────
//   const handleBasicChange = e => {
//     const { name,value } = e.target;
//     setActivityData(d => ({...d,[name]:value}));
//   };

//   // Levels
//   const addLevel = () => {
//     const newLevel = {
//       id: Date.now(),
//       levelName: `Level ${levels.length+1}`,
//       contentType:'reading',
//       content:[ defaultContentItem('reading') ],
//       questions:[{ id:Date.now(), questionText:'', options:['',''], correctAnswer:0, hint:'' }]
//     };
//     setLevels([...levels,newLevel]);
//   };
//   const removeLevel = id => {
//     if (levels.length===1) return;
//     const nxt = levels.filter(l=>l.id!==id);
//     setLevels(nxt);
//     if (currentLevel===id) setCurrentLevel(nxt[0].id);
//   };

//   // Content type switch
//   const pickContentType = type => {
//     const lvl = getLevelObj();
//     updateLevel({...lvl, contentType:type, content:[ defaultContentItem(type) ]});
//   };

//   // Content item CRUD
//   const addContentItem = () => {
//     const lvl = getLevelObj();
//     lvl.content.push(defaultContentItem(lvl.contentType));
//     updateLevel({...lvl});
//   };
//   const removeContentItem = cid => {
//     const lvl = getLevelObj();
//     if (lvl.content.length===1) return;
//     updateLevel({...lvl, content: lvl.content.filter(c=>c.id!==cid)});
//   };
//   const changeContentItem = (idx,field,value) => {
//     const lvl = getLevelObj();
//     lvl.content[idx][field]=value;
//     updateLevel({...lvl});
//   };
//   const uploadPreview = (idx,e,field) => {
//     const file = e.target.files[0];
//     if (!file) return;
//     if (field==='imagePreview') {
//       const url=URL.createObjectURL(file);
//       changeContentItem(idx,field,url);
//     } else {
//       // audioPreview
//       const url=URL.createObjectURL(file);
//       changeContentItem(idx,field,url);
//     }
//   };

//   // Questions
//   const addQuestion = () => {
//     const lvl=getLevelObj();
//     lvl.questions.push({ id:Date.now(), questionText:'', options:['',''], correctAnswer:0, hint:'' });
//     updateLevel({...lvl});
//   };
//   const removeQuestion = qid => {
//     const lvl=getLevelObj();
//     if (lvl.questions.length===1) return;
//     updateLevel({...lvl, questions:lvl.questions.filter(q=>q.id!==qid)});
//   };
//   const changeQuestion = (i,field,val) => {
//     const lvl=getLevelObj();
//     lvl.questions[i][field]=val;
//     updateLevel({...lvl});
//   };
//   const changeOption = (qi,oi,val) => {
//     const lvl=getLevelObj();
//     lvl.questions[qi].options[oi]=val;
//     updateLevel({...lvl});
//   };
//   const pickCorrect = (qi,oi) => {
//     const lvl=getLevelObj();
//     lvl.questions[qi].correctAnswer=oi;
//     updateLevel({...lvl});
//   };

//   // Pagination
//   useEffect(()=>{
//     const lvl=getLevelObj();
//     if (!lvl) return;
//     setCurrentPage(1);
//   },[currentLevel]);
//   const lvl=getLevelObj();
//   const totalPages = lvl ? Math.ceil(lvl.questions.length / itemsPerPage) : 1;
//   const pageQuestions = lvl 
//     ? lvl.questions.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage)
//     : [];

//   // Step navigation
//   const nextStep = () => {
//     if (!validate(currentStep)) return;
//     if (currentStep===1) return setCurrentStep(2);
//     // if more levels? stay at 2, but user switches tabs manually
//     setCurrentStep(3);
//   };
//   const prevStep = () => {
//     if (currentStep>1) return setCurrentStep(currentStep-1);
//     navigate('/teacher/manage-activities');
//   };

//   // Submit
//   const handleSubmit = async e => {
//     e.preventDefault();
//     if (currentStep < 3) return nextStep();
//     if (!validate(2)) return setCurrentStep(2);
//     setSubmitting(true);
//     try {
//       const payload = { ...activityData, levels, status:'pending' };
//       console.log('→ submitting', payload);
//       await new Promise(r=>setTimeout(r,1200));
//       setSubmitSuccess(true);
//       setTimeout(()=>navigate('/teacher/manage-activities'),1500);
//     } catch(err) {
//       setError('Submit failed');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   // ─── Render ──────────────────────────────────────────────────────────────
//   if (loading) return (
//     <div className="edit-activity-container">
//       <div className="loading-state">
//         <FontAwesomeIcon icon={faSpinner} spin/> Loading…
//       </div>
//     </div>
//   );
//   if (error && !levels.length) return (
//     <div className="edit-activity-container">
//       <div className="error-state">
//         <FontAwesomeIcon icon={faExclamationTriangle}/> {error}
//         <button onClick={()=>navigate('/teacher/manage-activities')}>Back</button>
//       </div>
//     </div>
//   );
//   if (submitSuccess) return (
//     <div className="edit-activity-container">
//       <div className="success-state">
//         <FontAwesomeIcon icon={faCheck}/> Submitted!
//       </div>
//     </div>
//   );

//   return (
//     <div className="edit-activity-container">
//       {/* Header */}
//       <header className="edit-activity-header">
//         <h1>{currentStep===1
//           ? 'Edit Activity'
//           : currentStep===2
//             ? `Configure ${getLevelObj().levelName}`
//             : 'Review & Submit'}</h1>
//         <p>
//           {currentStep===1
//             ? 'Update basic info'
//             : currentStep===2
//               ? 'Edit content & questions'
//               : 'Ready to send for approval'}
//         </p>
//       </header>

//       {/* Steps */}
//       <div className="steps-indicator">
//         {['Basic Info','Content','Review'].map((lbl,i)=>(
//           <React.Fragment key={i}>
//             <div className={`step ${currentStep>i?'active':''}`}>
//               <div className="step-number">{i+1}</div>
//               <div className="step-label">{lbl}</div>
//             </div>
//             {i<2 && <div className="step-connector"/>}
//           </React.Fragment>
//         ))}
//       </div>

//       {error && (
//         <div className="error-message">
//           <FontAwesomeIcon icon={faExclamationTriangle}/> {error}
//         </div>
//       )}

//       <form onSubmit={handleSubmit}>
//         {/* ─── STEP 1: Basic Info & Levels ───────────────────────────── */}
//         {currentStep===1 && (
//           <div className="form-section">
//             <h2 className="section-title">Basic Information</h2>
//             <div className="form-group">
//               <label>Title</label>
//               <input
//                 name="title" value={activityData.title}
//                 onChange={handleBasicChange}
//               />
//             </div>
//             <div className="form-row">
//               <div className="form-group">
//                 <label>Level Label</label>
//                 <input
//                   name="level" value={activityData.level}
//                   onChange={handleBasicChange}
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Category</label>
//                 <select
//                   name="category" value={activityData.category}
//                   onChange={handleBasicChange}
//                 >
//                   {categories.slice(1).map(c=>(
//                     <option key={c} value={c}>{c}</option>
//                   ))}
//                 </select>
//               </div>
//             </div>
//             <div className="form-group">
//               <label>Type</label>
//               <select
//                 name="type" value={activityData.type}
//                 onChange={handleBasicChange}
//               >
//                 <option value="template">Template</option>
//                 <option value="assessment">Assessment</option>
//                 <option value="practice">Practice</option>
//               </select>
//             </div>
//             <div className="form-group">
//               <label>Description</label>
//               <textarea
//                 name="description" rows={3}
//                 value={activityData.description}
//                 onChange={handleBasicChange}
//               />
//             </div>

//             <hr/>
//             <h2><FontAwesomeIcon icon={faLayerGroup}/> Levels</h2>
//             <div className="level-list">
//               {levels.map(l=>(
//                 <div key={l.id} className="level-item">
//                   <button
//                     type="button"
//                     className={`level-tab ${l.id===currentLevel?'active':''}`}
//                     onClick={()=>setCurrentLevel(l.id)}
//                   >
//                     {l.levelName}
//                   </button>
//                   {levels.length>1 && (
//                     <button
//                       type="button"
//                       className="remove-level-btn"
//                       onClick={()=>removeLevel(l.id)}
//                     >
//                       <FontAwesomeIcon icon={faTrash}/>
//                     </button>
//                   )}
//                 </div>
//               ))}
//               <button
//                 type="button"
//                 className="add-level-btn"
//                 onClick={addLevel}
//               >
//                 <FontAwesomeIcon icon={faPlus}/> Add Level
//               </button>
//             </div>
//           </div>
//         )}

//         {/* ─── STEP 2: Content & Questions ──────────────────────────── */}
//         {currentStep===2 && lvl && (
//           <div className="form-section">
//             <h2 className="section-title">Configure {lvl.levelName}</h2>

//             {/* Content Type Picker */}
//             <div className="content-type-selection">
//               {['reading','image','voice'].map(type=>(
//                 <div
//                   key={type}
//                   className={`content-type-option ${lvl.contentType===type?'active':''}`}
//                   onClick={()=>pickContentType(type)}
//                 >
//                   <FontAwesomeIcon
//                     icon={ type==='reading'?faFileAlt
//                          : type==='image'?faImage
//                          : faVolumeUp}
//                   />
//                   <span>
//                     {type==='reading'?'Reading'
//                      :type==='image'?'Image'
//                      :'Voice'}
//                   </span>
//                 </div>
//               ))}
//             </div>

//             {/* CONTENT ITEMS */}
//             <h3 className="section-title">Content Items</h3>
//             {lvl.content.map((c,i)=>(
//               <div className="content-item" key={c.id}>
//                 <div className="item-header">
//                   <h4>Item {i+1}</h4>
//                   <button onClick={()=>removeContentItem(c.id)}>
//                     <FontAwesomeIcon icon={faTrash}/>
//                   </button>
//                 </div>

//                 {lvl.contentType==='reading' && (
//                   <>
//                     <textarea
//                       placeholder="Text…"
//                       value={c.text}
//                       onChange={e=>changeContentItem(i,'text',e.target.value)}
//                     />
//                     <textarea
//                       placeholder="Translation"
//                       value={c.translation}
//                       onChange={e=>changeContentItem(i,'translation',e.target.value)}
//                     />
//                     <textarea
//                       placeholder="Syllables"
//                       value={c.syllables}
//                       onChange={e=>changeContentItem(i,'syllables',e.target.value)}
//                     />
//                   </>
//                 )}

//                 {/* IMAGE & VOICE share previews */}
//                 {['reading','image'].includes(lvl.contentType) && (
//                   <div className="upload-container">
//                     {c.imagePreview
//                       ? <div className="image-preview">
//                           <img src={c.imagePreview} alt=""/>
//                           <button onClick={()=>changeContentItem(i,'imagePreview',null)}>
//                             <FontAwesomeIcon icon={faTrash}/>
//                           </button>
//                         </div>
//                       : <label className="upload-placeholder">
//                           <FontAwesomeIcon icon={faImage}/>
//                           Choose Image
//                           <input
//                             type="file" accept="image/*"
//                             onChange={e=>uploadPreview(i,e,'imagePreview')}
//                           />
//                         </label>
//                     }
//                   </div>
//                 )}

//                 {lvl.contentType==='voice' && (
//                   <div className="upload-container">
//                     {c.audioPreview
//                       ? <div className="audio-preview">
//                           <audio controls src={c.audioPreview}/>
//                           <button onClick={()=>changeContentItem(i,'audioPreview',null)}>
//                             <FontAwesomeIcon icon={faTrash}/>
//                           </button>
//                         </div>
//                       : <label className="upload-placeholder">
//                           <FontAwesomeIcon icon={faHeadphones}/>
//                           Upload Audio
//                           <input
//                             type="file" accept="audio/*"
//                             onChange={e=>uploadPreview(i,e,'audioPreview')}
//                           />
//                         </label>
//                     }
//                   </div>
//                 )}
//               </div>
//             ))}
//             <button className="add-item-btn" onClick={addContentItem}>
//               <FontAwesomeIcon icon={faPlus}/> Add Item
//             </button>

//             {/* QUESTIONS */}
//             <h3 className="section-title">Questions</h3>
//             <p className="questions-pagination-info">
//               Page {currentPage} of {totalPages}
//             </p>
//             {pageQuestions.map((q,qi)=>(
//               <div className="question-item" key={q.id}>
//                 <div className="item-header">
//                   <h4>Q {(currentPage-1)*itemsPerPage + qi+1}</h4>
//                   <button onClick={()=>removeQuestion(q.id)}>
//                     <FontAwesomeIcon icon={faTrash}/>
//                   </button>
//                 </div>
//                 <textarea
//                   placeholder="Question…"
//                   value={q.questionText}
//                   onChange={e=>changeQuestion((currentPage-1)*itemsPerPage+qi,'questionText',e.target.value)}
//                 />
//                 {q.options.map((opt,oi)=>(
//                   <div className="option-row" key={oi}>
//                     <input
//                       type="radio"
//                       checked={q.correctAnswer===oi}
//                       onChange={()=>pickCorrect((currentPage-1)*itemsPerPage+qi,oi)}
//                     />
//                     <input
//                       placeholder={`Option ${oi+1}`}
//                       value={opt}
//                       onChange={e=>changeOption((currentPage-1)*itemsPerPage+qi,oi,e.target.value)}
//                     />
//                   </div>
//                 ))}
//                 <textarea
//                   placeholder="Hint…"
//                   value={q.hint}
//                   onChange={e=>changeQuestion((currentPage-1)*itemsPerPage+qi,'hint',e.target.value)}
//                 />
//               </div>
//             ))}
//             {/* pagination */}
//             <div className="pagination-controls">
//               <button disabled={currentPage===1} onClick={()=>setCurrentPage(1)}>First</button>
//               <button disabled={currentPage===1} onClick={()=>setCurrentPage(p=>p-1)}>Prev</button>
//               {Array.from({length:totalPages},(_,i)=>
//                 <button
//                   key={i} className={i+1===currentPage?'active':''}
//                   onClick={()=>setCurrentPage(i+1)}
//                 >{i+1}</button>
//               )}
//               <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(p=>p+1)}>Next</button>
//               <button disabled={currentPage===totalPages} onClick={()=>setCurrentPage(totalPages)}>Last</button>
//             </div>
//             <button className="add-item-btn" onClick={addQuestion}>
//               <FontAwesomeIcon icon={faPlus}/> Add Question
//             </button>
//           </div>
//         )}

//         {/* ─── STEP 3: Review ────────────────────────────────────────────── */}
//         {currentStep===3 && (
//           <div className="form-section">
//             <h2 className="section-title">Review & Submit</h2>
//             <p>Please double-check everything before sending for approval.</p>
//             <button
//               type="button"
//               onClick={()=>setCurrentStep(2)}
//               className="edit-level-btn"
//             >
//               <FontAwesomeIcon icon={faArrowLeft}/> Back to Content
//             </button>
//           </div>
//         )}

//         {/* ─── Actions ─────────────────────────────────────────────────── */}
//         <div className="form-actions">
//           <button type="button" onClick={prevStep} disabled={submitting}>
//             <FontAwesomeIcon icon={faArrowLeft}/> {currentStep===1?'Cancel':'Back'}
//           </button>
//           <button type="submit" disabled={submitting}>
//             {submitting
//               ? <><FontAwesomeIcon icon={faSpinner} spin/> Submitting…</>
//               : currentStep<3
//                 ? 'Next →'
//                 : <><FontAwesomeIcon icon={faCloudUploadAlt}/> Submit</>
//             }
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// }





import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faArrowRight,
  faSpinner,
  faCloudUploadAlt,
  faInfoCircle,
  faExclamationTriangle,
  faCheck,
  faTrash,
  faPlus,
  faImage,
  faHeadphones,
  faFileAlt,
  faVolumeUp,
  faLayerGroup,
  faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';
import '../../../css/Teachers/EditActivity.css';

import { readingLevels, categories } from '../../../data/Teachers/activityData';

const EditActivity = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState(null);
  const [levels, setLevels] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [currentLevel, setCurrentLevel] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const contentTypes = [
    { id: 'reading', name: 'Reading Passages', icon: faFileAlt },
    { id: 'image',   name: 'Image Based',     icon: faImage   },
    { id: 'voice',   name: 'Voice to Text',   icon: faVolumeUp }
  ];

  // Helpers
  const getCurrentLevel = () => levels.find(l => l.id === currentLevel) || {};
  const defaultContent = type => {
    const base = { id: Date.now() };
    if (type === 'reading')   return { ...base, text:'', syllables:'', translation:'', image:null, imagePreview:null, audio:null };
    if (type === 'image')     return { ...base, caption:'', image:null, imagePreview:null };
    if (type === 'voice')     return { ...base, text:'', pronunciation:'', audio:null, image:null, imagePreview:null };
    return base;
  };

  // Load mock data
  useEffect(() => {
    (async () => {
      try {
        const mock = await import('../../../data/Teachers/activitiesMockData');
        const act = mock.default.find(a => +a.id === +id);
        if (!act) throw new Error('Activity not found');
        setActivityData({
          id: act.id,
          title: act.title,
          level: act.level,
          category: act.categories[0],
          type: act.type,
          description: act.description
        });
        if (act.levels?.length) {
          setLevels(act.levels);
          setCurrentLevel(act.levels[0].id);
        } else {
          const lvl = {
            id: 1,
            levelName: 'Level 1',
            contentType: act.contentType.toLowerCase(),
            content: [ defaultContent(act.contentType.toLowerCase()) ],
            questions: [
              { id:1, questionText:'', options:['',''], correctAnswer:0, hint:'' }
            ]
          };
          setLevels([lvl]);
          setCurrentLevel(1);
        }
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Basic info handler
  const handleActivityChange = e => {
    const { name, value } = e.target;
    setActivityData(d => ({ ...d, [name]: value }));
  };

  // Wizard navigation
  const next = () => {
    if (currentStep === 1) return setCurrentStep(2);
    if (currentStep === 2) {
      const nxt = levels.find(l => l.id > currentLevel);
      return nxt ? setCurrentLevel(nxt.id) : setCurrentStep(3);
    }
  };
  const back = () => {
    if (currentStep === 3) return setCurrentStep(2);
    if (currentStep === 2) {
      const prev = levels.filter(l => l.id < currentLevel);
      return prev.length ? setCurrentLevel(prev.pop().id) : setCurrentStep(1);
    }
    return navigate('/teacher/manage-activities');
  };

  // Level CRUD
  const addLevel = () => {
    const newId = Math.max(...levels.map(l => l.id)) + 1;
    setLevels(ls => [
      ...ls,
      {
        id: newId,
        levelName: `Level ${newId}`,
        contentType: 'reading',
        content: [ defaultContent('reading') ],
        questions: [ { id:Date.now(), questionText:'', options:['',''], correctAnswer:0, hint:'' } ]
      }
    ]);
  };
  const removeLevel = lid => {
    if (levels.length === 1) return;
    setLevels(ls => ls.filter(l => l.id !== lid));
    if (lid === currentLevel) setCurrentLevel(levels[0].id);
  };

  // Content type switch
  const switchContentType = ct => {
    setLevels(ls => ls.map(l =>
      l.id === currentLevel
        ? { ...l, contentType:ct, content:[defaultContent(ct)] }
        : l
    ));
  };

  // Content CRUD & uploads
  const addContent = () => {
    setLevels(ls => ls.map(l =>
      l.id === currentLevel
        ? { ...l, content:[ ...l.content, defaultContent(l.contentType) ] }
        : l
    ));
  };
  const removeContent = cid => {
    setLevels(ls => ls.map(l =>
      l.id === currentLevel
        ? { ...l, content:l.content.length>1 ? l.content.filter(c=>c.id!==cid) : l.content }
        : l
    ));
  };
  const updateContent = (idx, field, val) => {
    setLevels(ls => ls.map(l =>
      l.id === currentLevel
        ? {
            ...l,
            content:l.content.map((c,i)=>i===idx?{...c,[field]:val}:c)
          }
        : l
    ));
  };
  const uploadImage = (idx,e) => {
    const f=e.target.files[0]; if(!f)return;
    const r=new FileReader();
    r.onload=()=>updateContent(idx,'imagePreview',r.result);
    r.readAsDataURL(f);
  };
  const uploadAudio = (idx,e) => {
    const f=e.target.files[0]; if(!f)return;
    updateContent(idx,'audio',URL.createObjectURL(f));
  };

  // Question CRUD
  const addQuestion = () => {
    setLevels(ls => ls.map(l =>
      l.id===currentLevel
        ? {
            ...l,
            questions:[
              ...l.questions,
              { id:Date.now(), questionText:'', options:['',''], correctAnswer:0, hint:'' }
            ]
          }
        : l
    ));
  };
  const removeQuestion = qid => {
    setLevels(ls => ls.map(l =>
      l.id===currentLevel
        ? { ...l, questions:l.questions.length>1?l.questions.filter(q=>q.id!==qid):l.questions }
        : l
    ));
  };
  const updateQuestion = (qIdx,field,val) => {
    setLevels(ls => ls.map(l =>
      l.id===currentLevel
        ? {
            ...l,
            questions:l.questions.map((q,i)=>i===qIdx?{...q,[field]:val}:q)
          }
        : l
    ));
  };
  const updateOption = (qIdx,optIdx,val) => {
    setLevels(ls => ls.map(l =>
      l.id===currentLevel
        ? {
            ...l,
            questions:l.questions.map((q,i)=>
              i===qIdx
                ? {...q,options:q.options.map((o,j)=>j===optIdx?val:o)}
                : q
            )
          }
        : l
    ));
  };
  const setAnswer = (qIdx,optIdx) => {
    setLevels(ls => ls.map(l =>
      l.id===currentLevel
        ? {
            ...l,
            questions:l.questions.map((q,i)=>i===qIdx?{...q,correctAnswer:optIdx}:q)
          }
        : l
    ));
  };

  // Final submit
  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...activityData,
        levels,
        status:'pending',
        lastModified:new Date().toISOString()
      };
      console.log('Submit',payload);
      await new Promise(r=>setTimeout(r,1000));
      setSubmitSuccess(true);
      setTimeout(()=>navigate('/teacher/manage-activities'),1200);
    } catch {
      setError('Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // === Render ===
  if (loading)
    return (
      <div className="edit-activity-container">
        <div className="loading-state">
          <FontAwesomeIcon icon={faSpinner} spin />
          <p>Loading activity…</p>
        </div>
      </div>
    );

  if (error && !activityData)
    return (
      <div className="edit-activity-container">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>{error}</p>
          <button onClick={()=>navigate('/teacher/manage-activities')}>
            Go Back
          </button>
        </div>
      </div>
    );

  if (submitSuccess)
    return (
      <div className="edit-activity-container">
        <div className="success-state">
          <FontAwesomeIcon icon={faCheck} />
          <p>Submitted! Redirecting…</p>
        </div>
      </div>
    );

  return (
    <div className="edit-activity-container">
      <header className="edit-activity-header">
        <h1>
          {currentStep===1
            ? 'Edit Activity'
            : currentStep===2
            ? `Configure ${getCurrentLevel().levelName}`
            : 'Review & Submit'}
        </h1>
        <p>
          {currentStep===1
            ? 'Fill in basic details'
            : currentStep===2
            ? 'Edit content & questions'
            : 'Confirm and submit'}
        </p>
      </header>

      <form onSubmit={handleSubmit}>
        {/* Steps */}
        <div className="steps-indicator">
          {['Basic Info','Content','Review'].map((lab,i)=>(
            <React.Fragment key={i}>
              <div className={`step ${currentStep===i+1?'active':''}`}>
                <div className="step-number">{i+1}</div>
                <div className="step-label">{lab}</div>
              </div>
              {i<2 && <div className="step-connector"/>}
            </React.Fragment>
          ))}
        </div>

        {error && currentStep>1 && (
          <div className="error-message">
            <FontAwesomeIcon icon={faExclamationTriangle}/>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1 */}
        {currentStep===1 && (
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                name="title"
                value={activityData.title}
                onChange={handleActivityChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Level</label>
                <select
                  name="level"
                  value={activityData.level}
                  onChange={handleActivityChange}
                  required
                >
                  {readingLevels.slice(1).map(lvl=>(
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Category</label>
                <select
                  name="category"
                  value={activityData.category}
                  onChange={handleActivityChange}
                  required
                >
                  {categories.slice(1).map(cat=>(
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                rows="3"
                value={activityData.description}
                onChange={handleActivityChange}
              />
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {currentStep===2 && (
          <div className="form-section">
            {/* Level Tabs */}
            <div className="level-list">
              {levels.map(l=>(
                <button
                  type="button"
                  key={l.id}
                  className={`level-tab ${l.id===currentLevel?'active':''}`}
                  onClick={()=>setCurrentLevel(l.id)}
                >
                  {l.levelName}
                </button>
              ))}
              <button className="add-level-btn" onClick={addLevel}>
                <FontAwesomeIcon icon={faPlus}/> Add Level
              </button>
            </div>

            {/* Content Type */}
            <div className="content-type-selection">
              {contentTypes.map(ct=>(
                <div
                  key={ct.id}
                  className={`content-type-option ${
                    getCurrentLevel().contentType===ct.id?'active':''
                  }`}
                  onClick={()=>switchContentType(ct.id)}
                >
                  <FontAwesomeIcon icon={ct.icon}/>
                  <span>{ct.name}</span>
                </div>
              ))}
            </div>

            {/* Content Items */}
            {getCurrentLevel().content.map((c,idx)=>(
              <div key={c.id} className="content-item">
                <div className="item-header">
                  <h4>Item {idx+1}</h4>
                  <button onClick={()=>removeContent(c.id)}>
                    <FontAwesomeIcon icon={faTrash}/>
                  </button>
                </div>

                {/* Reading */}
                {getCurrentLevel().contentType==='reading' && (
                  <>
                    <div className="form-group">
                      <label>Text</label>
                      <textarea
                        rows="2"
                        value={c.text}
                        onChange={e=>updateContent(idx,'text',e.target.value)}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Syllables</label>
                        <input
                          value={c.syllables}
                          onChange={e=>updateContent(idx,'syllables',e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Translation</label>
                        <input
                          value={c.translation}
                          onChange={e=>updateContent(idx,'translation',e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="upload-container">
                      {c.imagePreview ? (
                        <div className="image-preview">
                          <img src={c.imagePreview} alt=""/>
                          <button onClick={()=>updateContent(idx,'imagePreview',null)}>
                            <FontAwesomeIcon icon={faTrash}/>
                          </button>
                        </div>
                      ) : (
                        <label className="upload-placeholder">
                          <FontAwesomeIcon icon={faImage}/>
                          <input type="file" onChange={e=>uploadImage(idx,e)} hidden/>
                          <span>Choose Image</span>
                        </label>
                      )}
                    </div>
                    <div className="upload-container">
                      {c.audio ? (
                        <div className="audio-preview">
                          <audio controls src={c.audio}/>
                          <button onClick={()=>updateContent(idx,'audio',null)}>
                            <FontAwesomeIcon icon={faTrash}/>
                          </button>
                        </div>
                      ) : (
                        <label className="upload-placeholder">
                          <FontAwesomeIcon icon={faHeadphones}/>
                          <input type="file" accept="audio/*" onChange={e=>uploadAudio(idx,e)} hidden/>
                          <span>Upload Audio</span>
                        </label>
                      )}
                    </div>
                  </>
                )}

                {/* Image */}
                {getCurrentLevel().contentType==='image' && (
                  <>
                    <div className="upload-container">
                      {c.imagePreview ? (
                        <div className="image-preview">
                          <img src={c.imagePreview} alt=""/>
                          <button onClick={()=>updateContent(idx,'imagePreview',null)}>
                            <FontAwesomeIcon icon={faTrash}/>
                          </button>
                        </div>
                      ) : (
                        <label className="upload-placeholder">
                          <FontAwesomeIcon icon={faImage}/>
                          <input type="file" onChange={e=>uploadImage(idx,e)} hidden/>
                          <span>Choose Image</span>
                        </label>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Caption</label>
                      <textarea
                        rows="2"
                        value={c.caption}
                        onChange={e=>updateContent(idx,'caption',e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Voice */}
                {getCurrentLevel().contentType==='voice' && (
                  <>
                    <div className="form-group">
                      <label>Text Prompt</label>
                      <textarea
                        rows="2"
                        value={c.text}
                        onChange={e=>updateContent(idx,'text',e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Pronunciation</label>
                      <textarea
                        rows="1"
                        value={c.pronunciation}
                        onChange={e=>updateContent(idx,'pronunciation',e.target.value)}
                      />
                    </div>
                    <div className="upload-container">
                      {c.audio ? (
                        <div className="audio-preview">
                          <audio controls src={c.audio}/>
                          <button onClick={()=>updateContent(idx,'audio',null)}>
                            <FontAwesomeIcon icon={faTrash}/>
                          </button>
                        </div>
                      ) : (
                        <label className="upload-placeholder">
                          <FontAwesomeIcon icon={faHeadphones}/>
                          <input type="file" accept="audio/*" onChange={e=>uploadAudio(idx,e)} hidden/>
                          <span>Upload Audio</span>
                        </label>
                      )}
                    </div>
                    <div className="upload-container">
                      {c.imagePreview ? (
                        <div className="image-preview">
                          <img src={c.imagePreview} alt=""/>
                          <button onClick={()=>updateContent(idx,'imagePreview',null)}>
                            <FontAwesomeIcon icon={faTrash}/>
                          </button>
                        </div>
                      ) : (
                        <label className="upload-placeholder">
                          <FontAwesomeIcon icon={faImage}/>
                          <input type="file" onChange={e=>uploadImage(idx,e)} hidden/>
                          <span>Choose Image</span>
                        </label>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
            <button type="button" className="add-item-btn" onClick={addContent}>
              <FontAwesomeIcon icon={faPlus}/> Add Content
            </button>

            {/* Questions */}
            <div className="section-divider"/>
            <h2 className="section-title">Questions</h2>
            {getCurrentLevel().questions.map((q,qi)=>(
              <div key={q.id} className="question-item">
                <div className="item-header">
                  <h4>Q {qi+1}</h4>
                  <button onClick={()=>removeQuestion(q.id)}>
                    <FontAwesomeIcon icon={faTrash}/>
                  </button>
                </div>
                <div className="form-group">
                  <label>Question</label>
                  <textarea
                    rows="2"
                    value={q.questionText}
                    onChange={e=>updateQuestion(qi,'questionText',e.target.value)}
                  />
                </div>
                {q.options.map((opt,oi)=>(
                  <div key={oi} className="option-row">
                    <input
                      type="radio"
                      checked={q.correctAnswer===oi}
                      onChange={()=>setAnswer(qi,oi)}
                    />
                    <input
                      value={opt}
                      onChange={e=>updateOption(qi,oi,e.target.value)}
                    />
                  </div>
                ))}
                <div className="form-group">
                  <label>
                    Hint <FontAwesomeIcon icon={faQuestionCircle} className="question-tooltip"/>
                  </label>
                  <textarea
                    rows="1"
                    value={q.hint}
                    onChange={e=>updateQuestion(qi,'hint',e.target.value)}
                  />
                </div>
              </div>
            ))}
            <button type="button" className="add-item-btn" onClick={addQuestion}>
              <FontAwesomeIcon icon={faPlus}/> Add Question
            </button>
          </div>
        )}

        {/* STEP 3 */}
        {currentStep===3 && (
          <div className="form-section">
            <h2 className="section-title">Review & Submit</h2>
            <p>Everything looks good? Hit “Submit” below.</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={back} disabled={submitting}>
            <FontAwesomeIcon icon={faArrowLeft}/> {currentStep===1?'Cancel':'Back'}
          </button>
          {currentStep<3 ? (
            <button type="button" onClick={next} disabled={submitting}>
              Next <FontAwesomeIcon icon={faArrowRight}/>
            </button>
          ) : (
            <button type="submit" disabled={submitting}>
              {submitting
                ? <><FontAwesomeIcon icon={faSpinner} spin/> Submitting…</>
                : <><FontAwesomeIcon icon={faCloudUploadAlt}/> Submit</>
              }
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default EditActivity;




