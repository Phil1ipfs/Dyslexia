import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faSearch,
  faPlus,
  faFilter,
  faFileAlt,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

import FilterSidebar from "../../../components/TeacherPage/ManageActivity/FilterSidebar";
import TabNavigation from "../../../components/TeacherPage/ManageActivity/TabNavigation";
import ActivityCard from "../../../components/TeacherPage/ManageActivity/ActivityCard";
import AddActivityModal from "../../../components/TeacherPage/ManageActivity/AddActivityModal";
import "../../../css/Teachers/ManageActivity.css";

// import {
//   readingLevels,
//   categories,
//   sortOptions
// } from "../../../data/Teachers/activityData";

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
  const [itemsPerPage] = useState(2);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Define tabs with counts
  const [tabs, setTabs] = useState([
    { id: "templates", label: "Activity Templates", count: 0 },
    { id: "assessments", label: "Pre-Assessments", count: 0 },
    { id: "pending", label: "Pending Approval", count: 0 },
  ]);

  // Status options for filters
  const statusOptions = [
    "All Statuses",
    "Approved", 
    "Pending",
    "Locked",
    "Rejected"
  ];

  // Fetch and initialize activities
  useEffect(() => {
    // Clear existing activities before loading new ones
    setActivities([]);
    setLoading(true);

    const loadAllActivities = async () => {
      try {
        // Load mock activities from mock data module
        // const module = await import("../../../data/Teachers/activitiesMockData");
        const mockData = module.default;

        // Get newly added activities from localStorage
        const newlyAddedActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');

        // Process all activities to ensure they have the necessary properties
        const processedActivities = [...mockData, ...newlyAddedActivities].map(activity => {
          // Add levels property if missing
          if (!activity.levels) {
            return {
              ...activity,
              levels: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, i) => ({
                id: i + 1,
                levelName: `Level ${i + 1}`,
                questions: Array.from({ length: Math.floor(Math.random() * 5) + 3 }, (_, j) => ({
                  id: j + 1,
                  contentType: ['reading', 'image', 'voice'][Math.floor(Math.random() * 3)]
                }))
              }))
            };
          }
          return activity;
        });

        // Set activities state
        setActivities(processedActivities);

        // Update tab counts
        updateTabCounts(processedActivities);
      } catch (error) {
        console.error("Error loading activities:", error);
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    loadAllActivities();
  }, []);

  // Function to update tab counts
  const updateTabCounts = (activitiesList) => {
    setTabs(prevTabs => prevTabs.map(tab => {
      let count = 0;

      if (tab.id === 'templates') {
        count = activitiesList.filter(a => a.type === 'template').length;
      } else if (tab.id === 'assessments') {
        count = activitiesList.filter(a => a.type === 'assessment').length;
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
    if (activeTab === "templates" && activity.type !== "template") return false;
    if (activeTab === "assessments" && activity.type !== "assessment") return false;
    if (activeTab === "pending" && activity.status !== "pending") return false;
    
    // Other filters
    if (selectedLevel !== "All Levels" && activity.level !== selectedLevel) return false;
    if (selectedCategory !== "All Categories" && !activity.categories?.includes(selectedCategory)) return false;
    
    // Status filter
    if (statusFilter !== "All Statuses") {
      const statusLower = statusFilter.toLowerCase();
      if (activity.status !== statusLower) return false;
    }
    
    // Search filter
    if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
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

  const handleAddActivity = (newActivity) => {
    // Create a new activity with current date and proper formatting
    const activityToAdd = {
      ...newActivity,
      id: Date.now(), // Use timestamp as unique ID
      createdAt: new Date().toISOString(),
      status: 'pending', // New activities start as pending
      // Add other necessary default properties
    };

    // Update both state and localStorage
    setActivities(prevActivities => {
      const updatedActivities = [...prevActivities, activityToAdd];
      
      // Update localStorage
      const storedActivities = JSON.parse(localStorage.getItem('mockActivities') || '[]');
      localStorage.setItem('mockActivities', JSON.stringify([...storedActivities, activityToAdd]));
      
      // Update tab counts with the new activity included
      updateTabCounts(updatedActivities);
      
      return updatedActivities;
    });

    // Close modal
    setAddModalOpen(false);
    
    // If we're on a different tab than where the activity belongs,
    // we can optionally switch to that tab
    if (activityToAdd.type === 'template' && activeTab !== 'templates') {
      setActiveTab('templates');
    } else if (activityToAdd.type === 'assessment' && activeTab !== 'assessments') {
      setActiveTab('assessments');
    }
    
    // Always reset to first page to see the new activity
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
    if (activeTab === "assessments") return "/teacher/create-pre-assessment";
    return "/teacher/create-activity";
  };

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
          <p className="page-subtitle">Create, edit, and manage activities for students</p>
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
                {activeTab === "templates" && "Activity Templates"}
                {activeTab === "assessments" && "Pre-Assessment Activities"}
                {activeTab === "pending" && "Activities Pending Approval"}
              </h2>
              {activeTab !== "pending" && (
                <Link to={getCreateLink()} className="add-activity-btn">
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Add New {activeTab === "templates" ? "Activity Template" :
                    activeTab === "assessments" ? "Pre-Assessment" :
                      "Practice Module"}</span>
                </Link>
              )}
            </div>

            {/* Loading State */}
            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Loading activities...</p>
              </div>
            ) : sortedActivities.length === 0 ? (
              <div className="empty-state">
                <FontAwesomeIcon icon={faFileAlt} size="3x" className="empty-illustration" />
                <h3>No Activities Found</h3>
                <p>No activities match your current filters.</p>
                <button className="clear-filters-btn" onClick={clearFilters}>Clear Filters</button>
                {activeTab !== "pending" && (
                  <Link to={getCreateLink()} className="create-new-btn">Create New Activity</Link>
                )}
              </div>
            ) : (
              <>
                <div className="activity-count-info">
                  Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, sortedActivities.length)} of {sortedActivities.length} activities
                </div>
                <div className={`activities-grid ${activeTab === "pending" ? "pending-grid" : ""}`}>
                  {/* Show only the items for the current page */}
                  {currentActivities.map(activity => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
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
            <h3>Delete Activity</h3>
            <p>Are you sure you want to delete <strong>{activityToDelete.title}</strong>?</p>
            <p>This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={closeDeleteModal}>Cancel</button>
              <button className="delete-confirm-btn" onClick={handleDeleteActivity}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Activity Modal */}
      {addModalOpen && (
        <AddActivityModal
          onClose={() => setAddModalOpen(false)}
          onAddActivity={handleAddActivity}
          readingLevels={readingLevels}
          categories={categories}
          activityTypes={[
            { id: "template", name: "Activity Template" },
            { id: "assessment", name: "Pre-Assessment" },
          ]}
        />
      )}
    </div>
  );
}

export default ManageActivities;