import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faSearch,
  faPlus,
  faFilter,
  faFileAlt,
  faExclamationTriangle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

import FilterSidebar from "../../../components/TeacherPage/ManageActivity/FilterSidebar";
import TabNavigation from "../../../components/TeacherPage/ManageActivity/TabNavigation";
import ActivityCard from "../../../components/TeacherPage/ManageActivity/ActivityCard";
import "../../../css/Teachers/ManageActivity.css";

// Define reading levels, categories, and sort options
const readingLevels = [
  "All Levels",
  "Low Emerging",
  "Transitioning",
  "Developing",
  "Fluent"
];

const categories = [
  "All Categories",
  "Alphabet Knowledge",
  "Phonological Awareness",
  "Decoding",
  "Word Recognition",
  "Reading Comprehension"
];

const sortOptions = [
  "Newest First",
  "Oldest First", 
  "Alphabetical A-Z",
  "Alphabetical Z-A"
];

function ManageActivities() {
  // State variables
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortOption, setSortOption] = useState("Newest First");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("templates");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [error, setError] = useState(null);

  // Define tabs with counts
  const [tabs, setTabs] = useState([
    { id: "templates", label: "Activity Templates", count: 0 },
    { id: "questions", label: "Question Templates", count: 0 },
    { id: "choices", label: "Template Choices", count: 0 },
    { id: "sentences", label: "Reading Passages", count: 0 },
    { id: "pending", label: "Pending Approval", count: 0 },
  ]);

  // Status options for filters
  const statusOptions = [
    "All Statuses",
    "Approved", 
    "Pending",
    "Rejected"
  ];

  // Fetch and initialize activities
  useEffect(() => {
    // Clear existing activities before loading new ones
    setActivities([]);
    setLoading(true);
    setError(null);

    const loadAllActivities = async () => {
      try {
        // In a real implementation, these would be API calls to fetch different template types
        const mockTemplateQuestions = await fetchTemplateQuestions();
        const mockTemplateChoices = await fetchTemplateChoices();
        const mockSentenceTemplates = await fetchSentenceTemplates();
        const mockMainAssessments = await fetchMainAssessments();
        
        // Create a unified activities list that includes all template types
        // Each record is tagged with its type for filtering in the tabs
        const allActivities = [
          ...mockTemplateQuestions.map(q => ({...q, templateType: 'question'})),
          ...mockTemplateChoices.map(c => ({...c, templateType: 'choice'})),
          ...mockSentenceTemplates.map(s => ({...s, templateType: 'sentence'})),
          ...mockMainAssessments.map(a => ({...a, templateType: 'template'})),
        ];
        
        // Get newly added activities from localStorage if they exist
        const newlyAddedActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');
        
        // Combine all activities
        const combinedActivities = [...allActivities, ...newlyAddedActivities];
        
        setActivities(combinedActivities);
        
        // Update tab counts
        updateTabCounts(combinedActivities);
      } catch (error) {
        console.error("Error loading activities:", error);
        setError("Failed to load activity templates. Please try again later.");
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllActivities();
  }, []);
  
  // Mock function to fetch template questions (in real app, this would be an API call)
  const fetchTemplateQuestions = async () => {
    // This simulates fetching template questions from your backend
    // In a real implementation, this would make an API call to your server
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data based on the JSON files you provided
    return [
      {
        id: "6829799079a34741f9cd19ef",
        title: "Anong katumbas na maliit na letra?",
        category: "Alphabet Knowledge",
        questionType: "patinig",
        level: "Low Emerging",
        applicableChoiceTypes: ["patinigBigLetter", "patinigSmallLetter"],
        correctChoiceType: "patinigSmallLetter",
        status: "approved",
        createdAt: "2025-05-01T09:00:00.000Z",
        description: "Question template for matching uppercase and lowercase vowels"
      },
      {
        id: "6829799079a34741f9cd19f0",
        title: "Anong katumbas na malaking letra?", 
        category: "Alphabet Knowledge",
        questionType: "patinig",
        level: "Low Emerging",
        applicableChoiceTypes: ["patinigBigLetter", "patinigSmallLetter"],
        correctChoiceType: "patinigBigLetter",
        status: "approved",
        createdAt: "2025-05-01T09:05:00.000Z",
        description: "Question template for matching lowercase to uppercase vowels"
      },
      {
        id: "6829799079a34741f9cd19f1",
        title: "Anong tunog ng letra?",
        category: "Alphabet Knowledge",
        questionType: "patinig",
        level: "Low Emerging",
        applicableChoiceTypes: ["patinigBigLetter", "patinigSound"],
        correctChoiceType: "patinigSound",
        status: "approved",
        createdAt: "2025-05-01T09:10:00.000Z", 
        description: "Question template for identifying vowel sounds"
      },
      {
        id: "6829799079a34741f9cd19f5",
        title: "Kapag pinagsama ang mga pantig, ano ang mabubuo?",
        category: "Phonological Awareness",
        questionType: "malapantig",
        level: "Low Emerging",
        applicableChoiceTypes: ["malapatinigText", "wordText"],
        correctChoiceType: "wordText",
        status: "approved",
        createdAt: "2025-05-01T09:30:00.000Z",
        description: "Question template for word building from syllables"
      },
      {
        id: "6829799079a34741f9cd19f8",
        title: "Piliin ang tamang larawan para sa salitang:",
        category: "Word Recognition",
        questionType: "word",
        level: "Low Emerging",
        applicableChoiceTypes: ["wordText"],
        correctChoiceType: "wordText",
        status: "approved",
        createdAt: "2025-05-01T09:45:00.000Z",
        description: "Question template for matching words to images"
      },
      {
        id: "6829799079a34741f9cd19fa",
        title: "Paano babaybayin ang salitang ito?",
        category: "Decoding",
        questionType: "word",
        level: "Low Emerging",
        applicableChoiceTypes: ["wordText"],
        correctChoiceType: "wordText",
        status: "pending",
        createdAt: "2025-05-01T09:55:00.000Z",
        description: "Question template for spelling words"
      }
    ];
  };

  // Mock function to fetch template choices
  const fetchTemplateChoices = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data based on your templates_choices.json
    return [
      {
        id: "68297e4979a34741f9cd1a0f",
        title: "Letter A (Uppercase)",
        category: "Alphabet Knowledge",
        level: "Low Emerging",
        choiceType: "patinigBigLetter",
        choiceValue: "A",
        hasImage: true,
        status: "approved",
        createdAt: "2025-05-01T09:00:00.000Z",
        description: "Uppercase letter A choice template"
      },
      {
        id: "68297e4979a34741f9cd1a14",
        title: "Letter a (Lowercase)",
        category: "Alphabet Knowledge",
        level: "Low Emerging",
        choiceType: "patinigSmallLetter",
        choiceValue: "a",
        hasImage: true,
        status: "approved",
        createdAt: "2025-05-01T09:05:00.000Z",
        description: "Lowercase letter a choice template"
      },
      {
        id: "68297e4979a34741f9cd1a19",
        title: "A sound (/ah/)",
        category: "Alphabet Knowledge",
        level: "Low Emerging",
        choiceType: "patinigSound",
        soundText: "/ah/",
        hasAudio: true,
        status: "approved",
        createdAt: "2025-05-01T09:10:00.000Z",
        description: "Sound for letter A"
      },
      {
        id: "6829828a79a34741f9cd1a3e",
        title: "Syllable BA",
        category: "Phonological Awareness",
        level: "Low Emerging",
        choiceType: "malapatinigText",
        choiceValue: "BA",
        soundText: "/ba/",
        status: "approved",
        createdAt: "2025-05-01T09:45:00.000Z",
        description: "Syllable BA choice template"
      },
      {
        id: "6829828a79a34741f9cd1a47",
        title: "Word: aklat (book)",
        category: "Word Recognition",
        level: "Low Emerging",
        choiceType: "wordText",
        choiceValue: "aklat",
        hasImage: true,
        status: "approved",
        createdAt: "2025-05-01T09:58:00.000Z",
        description: "Word choice template for 'aklat'"
      },
      {
        id: "6829828a79a34741f9cd1a4c",
        title: "Word with Sound: damit (/da-mit/)",
        category: "Decoding",
        level: "Low Emerging",
        choiceType: "wordText",
        choiceValue: "damit",
        soundText: "/da-mit/",
        hasImage: true,
        hasAudio: true,
        status: "pending",
        createdAt: "2025-05-01T10:03:00.000Z",
        description: "Word with pronunciation for 'damit'"
      }
    ];
  };

  // Mock function to fetch sentence templates
  const fetchSentenceTemplates = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Return mock data based on your sentence_templates.json
    return [
      {
        id: "68297c4379a34741f9cd1a00",
        title: "Si Maria at ang mga Bulaklak",
        category: "Reading Comprehension",
        level: "Low Emerging",
        status: "approved",
        pages: 2,
        questions: 3,
        createdAt: "2025-05-01T10:30:00.000Z",
        description: "Story about Maria finding flowers in the park"
      },
      {
        id: "68297c4379a34741f9cd1a01",
        title: "Ang Batang Matulungin",
        category: "Reading Comprehension",
        level: "Transitioning",
        status: "approved",
        pages: 2,
        questions: 3,
        createdAt: "2025-05-01T11:00:00.000Z",
        description: "Story about a helpful child named Pedro"
      },
      {
        id: "68297c4379a34741f9cd1a02",
        title: "Si Lino at ang Kanyang Alagang Isda",
        category: "Reading Comprehension",
        level: "Developing",
        status: "pending",
        pages: 2,
        questions: 3,
        createdAt: "2025-05-01T11:30:00.000Z",
        description: "Story about Lino and his pet fish"
      }
    ];
  };

  // Mock function to fetch main assessments
  const fetchMainAssessments = async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return mock data based on your main_assessment.json
    return [
      {
        id: "68298fb179a34741f9cd1a01",
        title: "Alphabet Knowledge Assessment",
        category: "Alphabet Knowledge",
        level: "Low Emerging",
        questionCount: 9,
        status: "approved",
        createdAt: "2025-05-01T08:00:00.000Z",
        description: "Complete assessment for alphabet knowledge"
      },
      {
        id: "68298fb179a34741f9cd1a02",
        title: "Phonological Awareness Assessment",
        category: "Phonological Awareness",
        level: "Low Emerging",
        questionCount: 5,
        status: "approved",
        createdAt: "2025-05-01T08:45:00.000Z",
        description: "Complete assessment for phonological awareness"
      },
      {
        id: "68298fb179a34741f9cd1a03",
        title: "Word Recognition Assessment",
        category: "Word Recognition",
        level: "Low Emerging",
        questionCount: 5,
        status: "approved",
        createdAt: "2025-05-01T09:10:00.000Z",
        description: "Complete assessment for word recognition"
      },
      {
        id: "68298fb179a34741f9cd1a04",
        title: "Decoding Assessment",
        category: "Decoding",
        level: "Low Emerging",
        questionCount: 5,
        status: "pending",
        createdAt: "2025-05-01T09:35:00.000Z",
        description: "Complete assessment for decoding skills"
      },
      {
        id: "68298fb179a34741f9cd1a05",
        title: "Reading Comprehension Assessment",
        category: "Reading Comprehension",
        level: "Low Emerging",
        questionCount: 2,
        status: "pending",
        createdAt: "2025-05-01T10:00:00.000Z",
        description: "Complete assessment for reading comprehension with stories"
      }
    ];
  };

  // Function to update tab counts
  const updateTabCounts = (activitiesList) => {
    setTabs(prevTabs => prevTabs.map(tab => {
      let count = 0;

      if (tab.id === 'templates') {
        count = activitiesList.filter(a => a.templateType === 'template').length;
      } else if (tab.id === 'questions') {
        count = activitiesList.filter(a => a.templateType === 'question').length;
      } else if (tab.id === 'choices') {
        count = activitiesList.filter(a => a.templateType === 'choice').length;
      } else if (tab.id === 'sentences') {
        count = activitiesList.filter(a => a.templateType === 'sentence').length;
      } else if (tab.id === 'pending') {
        count = activitiesList.filter(a => a.status === 'pending').length;
      }

      return { ...tab, count };
    }));
  };

  // Reset to first page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Filter activities based on current filters
  const filteredActivities = activities.filter(activity => {
    // Type filter (tab selection)
    if (activeTab === "templates" && activity.templateType !== "template") return false;
    if (activeTab === "questions" && activity.templateType !== "question") return false;
    if (activeTab === "choices" && activity.templateType !== "choice") return false;
    if (activeTab === "sentences" && activity.templateType !== "sentence") return false;
    if (activeTab === "pending" && activity.status !== "pending") return false;
    
    // Other filters
    if (selectedLevel !== "All Levels" && activity.level !== selectedLevel) return false;
    if (selectedCategory !== "All Categories" && activity.category !== selectedCategory) return false;
    
    // Status filter
    if (statusFilter !== "All Statuses") {
      const statusLower = statusFilter.toLowerCase();
      if (activity.status !== statusLower) return false;
    }
    
    // Search filter - search in title and description
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = activity.title && activity.title.toLowerCase().includes(query);
      const descMatch = activity.description && activity.description.toLowerCase().includes(query);
      if (!titleMatch && !descMatch) return false;
    }
    
    return true;
  });

  // Sort filtered activities
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    if (sortOption === "Newest First") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortOption === "Oldest First") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortOption === "Alphabetical A-Z") return a.title.localeCompare(b.title);
    if (sortOption === "Alphabetical Z-A") return b.title.localeCompare(a.title);
    return 0;
  });

  // Reset to page 1 when filters change or sorted activities length changes
  useEffect(() => {
    if (currentPage > Math.ceil(sortedActivities.length / itemsPerPage) && sortedActivities.length > 0) {
      setCurrentPage(1);
    }
  }, [selectedLevel, selectedCategory, statusFilter, searchQuery, sortOption, sortedActivities.length, currentPage, itemsPerPage]);

  // Calculate pagination
  const totalPages = Math.max(1, Math.ceil(sortedActivities.length / itemsPerPage));
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // Get exactly the number of items for the current page
  const currentActivities = sortedActivities.slice(indexOfFirstItem, indexOfLastItem);

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  // Handlers
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    clearFilters();        
    setCurrentPage(1);     
  };

  const openDeleteModal = activity => {
    setActivityToDelete(activity);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setActivityToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDeleteActivity = () => {
    if (activityToDelete) {
      setActivities(prev => {
        const updatedActivities = prev.filter(a => a.id !== activityToDelete.id);
        
        // Update tab counts
        updateTabCounts(updatedActivities);
        
        return updatedActivities;
      });

      // Also remove from localStorage if it exists there
      const storedActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');
      const updatedStored = storedActivities.filter(a => a.id !== activityToDelete.id);
      localStorage.setItem('mockActivities', JSON.stringify(updatedStored));

      closeDeleteModal();
      
      // Check if we need to adjust current page after deletion
      const remainingItems = filteredActivities.length - 1;
      const newTotalPages = Math.ceil(remainingItems / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages);
      }
    }
  };

  const getCreateLink = () => {
    if (activeTab === "templates") return "/teacher/create-activity?type=template";
    if (activeTab === "questions") return "/teacher/create-question?type=question";
    if (activeTab === "choices") return "/teacher/create-choice?type=choice";
    if (activeTab === "sentences") return "/teacher/create-passage?type=sentence";
    return "/teacher/create-activity";
  };

  const getCreateButtonText = () => {
    if (activeTab === "templates") return "Add New Assessment Template";
    if (activeTab === "questions") return "Add New Question Template";
    if (activeTab === "choices") return "Add New Choice Template";
    if (activeTab === "sentences") return "Add New Reading Passage";
    return "Add New";
  }

  const clearFilters = () => {
    setSelectedLevel("All Levels");
    setSelectedCategory("All Categories");
    setSortOption("Newest First");
    setStatusFilter("All Statuses");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const toggleMobileFilters = () => {
    setShowMobileFilters(!showMobileFilters);
  };

  return (
    <div className="manage-activities-page">
      <header className="manage-activities-header">
        <div className="header-left">
          <h1>
            <FontAwesomeIcon icon={faList} className="header-icon" />
            Manage Activities
          </h1>
          <p className="page-subtitle">Create, edit, and manage activity templates and assessments</p>
        </div>
      </header>

      <div className="manage-activities-container">
        {/* Mobile filter toggle button - Only shown on small screens */}
        <button
          className="mobile-filters-toggle"
          onClick={toggleMobileFilters}
        >
          <FontAwesomeIcon icon={faFilter} /> Filter Activities
        </button>

        {/* Filters Panel */}
        <FilterSidebar
          className={showMobileFilters ? "mobile-visible" : ""}
          selectedLevel={selectedLevel}
          setSelectedLevel={value => {
            setSelectedLevel(value);
            setCurrentPage(1);
          }}
          selectedCategory={selectedCategory}
          setSelectedCategory={value => {
            setSelectedCategory(value);
            setCurrentPage(1);
          }}
          sortOption={sortOption}
          setSortOption={value => { 
            setSortOption(value); 
            setCurrentPage(1); 
          }}
          statusFilter={statusFilter}
          setStatusFilter={value => {
            setStatusFilter(value);
            setCurrentPage(1);
          }}
          searchQuery={searchQuery}
          setSearchQuery={value => { 
            setSearchQuery(value); 
            setCurrentPage(1); 
          }}
          readingLevels={readingLevels}
          categories={categories}
          sortOptions={sortOptions}
          statusOptions={statusOptions}
          closeMobileFilters={() => setShowMobileFilters(false)}
          clearFilters={clearFilters}
        />

        {/* Main Content */}
        <section className="content-area">
          <TabNavigation
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={handleTabChange}
          />

          <div className="tab-content">
            <div className="tab-header">
              <h2 className="content-title">
                {activeTab === "templates" && "Assessment Templates"}
                {activeTab === "questions" && "Question Templates"}
                {activeTab === "choices" && "Choice Templates"}
                {activeTab === "sentences" && "Reading Passages"}
                {activeTab === "pending" && "Templates Pending Approval"}
              </h2>
              {activeTab !== "pending" && (
                <Link to={getCreateLink()} className="add-activity-btn">
                  <FontAwesomeIcon icon={faPlus} />
                  <span>{getCreateButtonText()}</span>
                </Link>
              )}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="loading-state">
                <FontAwesomeIcon icon={faSpinner} spin className="spinner" />
                <p>Loading templates...</p>
              </div>
            ) : error ? (
              <div className="error-state">
                <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
                <h3>Error Loading Data</h3>
                <p>{error}</p>
                <button className="retry-btn" onClick={() => window.location.reload()}>Retry</button>
              </div>
            ) : sortedActivities.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faFileAlt} size="3x" className="empty-illustration" />
                <h3>No Templates Found</h3>
                <p>No templates match your current filters.</p>
                <button className="clear-filters-btn" onClick={clearFilters}>Clear Filters</button>
                {activeTab !== "pending" && (
                  <Link to={getCreateLink()} className="create-new-btn">Create New Template</Link>
                )}
              </div>
            ) : (
              <>
                <div className="activity-count-info">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedActivities.length)} of {sortedActivities.length} templates
                </div>
                <div className={`activities-grid ${activeTab === "pending" ? "pending-grid" : ""}`}>
                  {/* Show only the items for the current page */}
                  {currentActivities.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      templateType={activity.templateType}
                      onDelete={openDeleteModal}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="pagination-arrow"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      &lt; Prev
                    </button>

                    <div className="page-numbers">
                      {pageNumbers.map(number => (
                        <button
                          key={number}
                          onClick={() => setCurrentPage(number)}
                          className={currentPage === number ? 'active' : ''}
                        >
                          {number}
                        </button>
                      ))}
                    </div>

                    <button
                      className="pagination-arrow"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next &gt;
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && activityToDelete && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <h3>Delete Template</h3>
            <p>Are you sure you want to delete <strong>{activityToDelete.title}</strong>?</p>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeDeleteModal}>Cancel</button>
              <button className="delete-confirm-btn" onClick={handleDeleteActivity}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageActivities;