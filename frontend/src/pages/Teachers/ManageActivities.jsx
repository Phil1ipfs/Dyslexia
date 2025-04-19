import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../../css/Teachers/ManageActivity.css";

// Import mock data
import { 
  readingLevels, 
  categories, 
  sortOptions
} from "../../data/Teachers/activityData";

// Import icons
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faPlus, 
  faEdit, 
  faEye, 
  faFileAlt, 
  faFont,
  faBook,
  faLock, 
  faClock,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf
} from '@fortawesome/free-solid-svg-icons';

function ManageActivities() {
  // State variables
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("All Levels");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [sortOption, setSortOption] = useState("Newest First");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("templates");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Define tabs
  const tabs = [
    { id: "templates", label: "Activity Templates", active: activeTab === "templates" },
    { id: "assessments", label: "Pre-Assessments", active: activeTab === "assessments" },
    { id: "practice", label: "Practice Modules", active: activeTab === "practice" },
    { id: "pending", label: "Pending Approval", active: activeTab === "pending" },
  ];

  // Fetch activities (simulated)
  useEffect(() => {
    // This would be an API call in production
    import("../../data/Teachers/activitiesMockData").then(module => {
      setActivities(module.default);
      setLoading(false);
    });
  }, []);

  // Filter activities based on current filters
  const filteredActivities = activities.filter(activity => {
    // Filter by tab
    if (activeTab === "templates" && activity.type !== "template") return false;
    if (activeTab === "assessments" && activity.type !== "assessment") return false;
    if (activeTab === "practice" && activity.type !== "practice") return false;
    if (activeTab === "pending" && activity.status !== "pending") return false;
    
    // Filter by antas level
    if (selectedLevel !== "All Levels" && activity.level !== selectedLevel) return false;
    
    // Filter by category
    if (selectedCategory !== "All Categories" && !activity.categories.includes(selectedCategory)) return false;
    
    // Filter by search query
    if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
    return true;
  });

  // Sort filtered activities
  const sortedActivities = [...filteredActivities].sort((a, b) => {
    if (sortOption === "Newest First") return new Date(b.createdAt) - new Date(a.createdAt);
    if (sortOption === "Oldest First") return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortOption === "Alphabetical") return a.title.localeCompare(b.title);
    return 0;
  });

  // Render category tags
  const renderCategoryTags = (categories) => {
    return categories.map((category, index) => (
      <span key={index} className="category-tag">{category}</span>
    ));
  };

  // Get activity icon based on categories
  const getActivityIcon = (categories) => {
    if (categories.includes("Ponetiko") || categories.includes("Pagtukoy ng Tunog")) {
      return <FontAwesomeIcon icon={faFont} className="activity-icon ponetiko" />;
    } else if (categories.includes("Talasalitaan") || categories.includes("Pagbasa ng Salita")) {
      return <FontAwesomeIcon icon={faFileAlt} className="activity-icon talasalitaan" />;
    } else if (categories.includes("Pantig") || categories.includes("Pangungusap")) {
      return <FontAwesomeIcon icon={faBook} className="activity-icon pantig" />;
    } else {
      return <FontAwesomeIcon icon={faFileAlt} className="activity-icon" />;
    }
  };

  // Get status icon and label
  const getStatusIndicator = (status) => {
    if (status === "locked") {
      return (
        <div className="status-indicator locked">
          <FontAwesomeIcon icon={faLock} />
          <span>Approved & Locked</span>
        </div>
      );
    } else if (status === "pending") {
      return (
        <div className="status-indicator pending">
          <FontAwesomeIcon icon={faHourglassHalf} />
          <span>Pending Approval</span>
        </div>
      );
    } else if (status === "approved") {
      return (
        <div className="status-indicator approved">
          <FontAwesomeIcon icon={faCheckCircle} />
          <span>Approved</span>
        </div>
      );
    } else if (status === "rejected") {
      return (
        <div className="status-indicator rejected">
          <FontAwesomeIcon icon={faTimesCircle} />
          <span>Rejected</span>
        </div>
      );
    }
    return null;
  };

  const handleLevelChange = (e) => {
    setSelectedLevel(e.target.value);
    setCurrentPage(1);
  };
  
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };
  
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
    setCurrentPage(1);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSelectedLevel("All Levels");
    setSelectedCategory("All Categories");
    setSortOption("Newest First");
    setSearchQuery("");
    setCurrentPage(1);
  };

  return (
    <div className="manage-activities-page">
      <div className="manage-activities-header">
        <div>
          <h1 className="page-title">Manage Activities</h1>
          <p className="page-subtitle">Create, edit, and manage activities for students</p>
        </div>
        <Link to="/teacher/create-activity" className="add-activity-btn">
          <FontAwesomeIcon icon={faPlus} />
          <span>Add New Activity</span>
        </Link>
      </div>

      <div className="manage-activities-container">
        {/* Filters Section */}
        <div className="filters-panel">
          <h2 className="filters-title">Filters</h2>
          
          <div className="filter-group">
            <label className="filter-label">Antas Level</label>
            <div className="select-wrapper">
              <select 
                className="filter-select" 
                value={selectedLevel}
                onChange={handleLevelChange}
              >
                {readingLevels.map((level, index) => (
                  <option key={index} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Category</label>
            <div className="select-wrapper">
              <select 
                className="filter-select"
                value={selectedCategory}
                onChange={handleCategoryChange}
              >
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Sort By</label>
            <div className="select-wrapper">
              <select 
                className="filter-select"
                value={sortOption}
                onChange={handleSortChange}
              >
                {sortOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="filter-group">
            <label className="filter-label">Search</label>
            <div className="search-container">
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search activities..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
            </div>
          </div>
          
          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
        
        {/* Main Content */}
        <div className="content-area">
          {/* Tabs Navigation */}
          <div className="tabs-navigation">
            {tabs.map(tab => (
              <button 
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="tab-content">
            <div className="tab-header">
              <h2 className="content-title">
                {activeTab === "templates" && "Activity Templates"}
                {activeTab === "assessments" && "Pre-Assessment Activities"}
                {activeTab === "practice" && "Practice Module Templates"}
                {activeTab === "pending" && "Activities Pending Approval"}
              </h2>
              {activeTab !== "pending" && (
                <Link to="/teacher/create-activity" className="create-new-btn">
                  Create New
                </Link>
              )}
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading activities...</p>
              </div>
            ) : sortedActivities.length === 0 ? (
              <div className="empty-state">
                <div className="empty-illustration">
                  <FontAwesomeIcon icon={faFileAlt} size="3x" />
                </div>
                <h3>No Activities Found</h3>
                <p>No activities match your current filters.</p>
                <button className="clear-filters-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
                {activeTab !== "pending" && (
                  <>
                    <p>Or</p>
                    <Link to="/teacher/create-activity" className="create-new-btn">
                      Create New Activity
                    </Link>
                  </>
                )}
              </div>
            ) : (
              <div className={`activities-grid ${activeTab === "pending" ? 'pending-grid' : ''}`}>
                {sortedActivities.map(activity => (
                  <div 
                    key={activity.id} 
                    className={`activity-card ${activity.status} ${activity.type}`}
                  >
                    <div className={`activity-card-header ${activity.type}`}>
                      <div className="activity-title-area">
                        {getActivityIcon(activity.categories)}
                        <h3 className="activity-title">{activity.title}</h3>
                      </div>
                      {getStatusIndicator(activity.status)}
                    </div>
                    
                    <div className="activity-card-body">
                      <div className="activity-metadata">
                        <div className="metadata-row">
                          <span className="metadata-label">Antas:</span>
                          <span className="metadata-value">{activity.level}</span>
                        </div>
                        
                        <div className="metadata-row">
                          <span className="metadata-label">Categories:</span>
                          <div className="category-tags">
                            {renderCategoryTags(activity.categories)}
                          </div>
                        </div>
                        
                        <div className="metadata-row">
                          <span className="metadata-label">Type:</span>
                          <span className="metadata-value">
                            {activity.type === 'template' && 'Activity Template'}
                            {activity.type === 'assessment' && 'Pre-Assessment'}
                            {activity.type === 'practice' && 'Practice Module'}
                          </span>
                        </div>
                        
                        <div className="metadata-row">
                          <span className="metadata-label">Created:</span>
                          <span className="metadata-value">
                            {new Date(activity.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                        
                        {activity.description && activeTab === "pending" && (
                          <div className="metadata-row description-row">
                            <span className="metadata-label">Description:</span>
                            <p className="description-text">{activity.description}</p>
                          </div>
                        )}

                        {activity.adminRemarks && (
                          <div className="metadata-row admin-remarks">
                            <span className="metadata-label">Admin Remarks:</span>
                            <p className="admin-remarks-text">{activity.adminRemarks}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="activity-content-type">
                        <span className="content-type-label">
                          {activity.contentType === 'Reading' || activity.contentType === 'Text' 
                            ? 'Pagkilala sa mga Salita' 
                            : activity.contentType === 'Image' 
                              ? 'Image Based Content' 
                              : 'Voice-to-Text Activity'}
                        </span>
                      </div>
                      
                      <div className="activity-actions">
                        {activeTab === "pending" ? (
                          <div className="pending-message">
                            <FontAwesomeIcon icon={faHourglassHalf} className="pending-icon" />
                            <span>Waiting for admin approval</span>
                          </div>
                        ) : (
                          <>
                            <Link 
                              to={`/teacher/preview-activity/${activity.id}`} 
                              className="action-btn preview-btn"
                            >
                              <FontAwesomeIcon icon={faEye} /> Preview
                            </Link>
                            
                            {activity.status !== "locked" && activity.status !== "approved" && (
                              <Link 
                                to={`/teacher/edit-activity/${activity.id}`} 
                                className="action-btn edit-btn"
                              >
                                <FontAwesomeIcon icon={faEdit} /> Edit
                              </Link>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Empty space placeholder when few items */}
            <div className="content-min-height"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageActivities;


// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import "../../css/Teachers/ManageActivity.css";

// // Import mock data
// import { 
//   readingLevels, 
//   categories, 
//   sortOptions
// } from "../../data/Teachers/activityData";

// // Import icons
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { 
//   faSearch, 
//   faPlus, 
//   faEdit, 
//   faEye, 
//   faFileAlt, 
//   faFont,
//   faBook,
//   faLock, 
//   faClock,
//   faCheckCircle,
//   faTimesCircle,
//   faHourglassHalf,
//   faFilter
// } from '@fortawesome/free-solid-svg-icons';

// function ManageActivities() {
//   // State variables
//   const [activities, setActivities] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedLevel, setSelectedLevel] = useState("All Levels");
//   const [selectedCategory, setSelectedCategory] = useState("All Categories");
//   const [sortOption, setSortOption] = useState("Newest First");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [activeTab, setActiveTab] = useState("templates");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [selectedStatus, setSelectedStatus] = useState("All Statuses");
//   const [showMobileFilters, setShowMobileFilters] = useState(false);
  
//   // Define tabs
//   const tabs = [
//     { id: "templates", label: "Activity Templates", active: activeTab === "templates" },
//     { id: "assessments", label: "Pre-Assessments", active: activeTab === "assessments" },
//     { id: "practice", label: "Practice Modules", active: activeTab === "practice" },
//     { id: "pending", label: "Pending Approval", active: activeTab === "pending" },
//   ];

//   // Status options for filtering
//   const statusOptions = [
//     "All Statuses",
//     "Approved",
//     "Locked",
//     "Pending",
//     "Rejected"
//   ];

//   // Fetch activities (simulated)
//   useEffect(() => {
//     // This would be an API call in production
//     import("../../data/Teachers/activitiesMockData").then(module => {
//       setActivities(module.default);
//       setLoading(false);
//     });
//   }, []);

//   // Filter activities based on current filters
//   const filteredActivities = activities.filter(activity => {
//     // Filter by tab
//     if (activeTab === "templates" && activity.type !== "template") return false;
//     if (activeTab === "assessments" && activity.type !== "assessment") return false;
//     if (activeTab === "practice" && activity.type !== "practice") return false;
//     if (activeTab === "pending" && activity.status !== "pending") return false;
    
//     // Filter by antas level
//     if (selectedLevel !== "All Levels" && activity.level !== selectedLevel) return false;
    
//     // Filter by category
//     if (selectedCategory !== "All Categories" && !activity.categories.includes(selectedCategory)) return false;
    
//     // Filter by status
//     if (selectedStatus !== "All Statuses") {
//       const statusLower = selectedStatus.toLowerCase();
//       if (activity.status !== statusLower) return false;
//     }
    
//     // Filter by search query
//     if (searchQuery && !activity.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    
//     return true;
//   });

//   // Sort filtered activities
//   const sortedActivities = [...filteredActivities].sort((a, b) => {
//     if (sortOption === "Newest First") return new Date(b.createdAt) - new Date(a.createdAt);
//     if (sortOption === "Oldest First") return new Date(a.createdAt) - new Date(b.createdAt);
//     if (sortOption === "Alphabetical") return a.title.localeCompare(b.title);
//     return 0;
//   });

//   // Render category tags
//   const renderCategoryTags = (categories) => {
//     return categories.map((category, index) => (
//       <span key={index} className="category-tag">{category}</span>
//     ));
//   };

//   // Get activity icon based on categories
//   const getActivityIcon = (categories) => {
//     if (categories.includes("Ponetiko") || categories.includes("Pagtukoy ng Tunog")) {
//       return <FontAwesomeIcon icon={faFont} className="activity-icon ponetiko" />;
//     } else if (categories.includes("Talasalitaan") || categories.includes("Pagbasa ng Salita")) {
//       return <FontAwesomeIcon icon={faFileAlt} className="activity-icon talasalitaan" />;
//     } else if (categories.includes("Pantig") || categories.includes("Pangungusap")) {
//       return <FontAwesomeIcon icon={faBook} className="activity-icon pantig" />;
//     } else {
//       return <FontAwesomeIcon icon={faFileAlt} className="activity-icon" />;
//     }
//   };

//   // Get status badge
//   const getStatusBadge = (status) => {
//     if (status === "locked") {
//       return <div className="status-badge locked"><FontAwesomeIcon icon={faLock} /> Approved & Locked</div>;
//     } else if (status === "pending") {
//       return <div className="status-badge pending"><FontAwesomeIcon icon={faHourglassHalf} /> Pending Approval</div>;
//     } else if (status === "approved") {
//       return <div className="status-badge approved"><FontAwesomeIcon icon={faCheckCircle} /> Approved</div>;
//     } else if (status === "rejected") {
//       return <div className="status-badge rejected"><FontAwesomeIcon icon={faTimesCircle} /> Rejected</div>;
//     }
//     return null;
//   };

//   const handleLevelChange = (e) => {
//     setSelectedLevel(e.target.value);
//     setCurrentPage(1);
//   };
  
//   const handleCategoryChange = (e) => {
//     setSelectedCategory(e.target.value);
//     setCurrentPage(1);
//   };
  
//   const handleSortChange = (e) => {
//     setSortOption(e.target.value);
//     setCurrentPage(1);
//   };
  
//   const handleStatusChange = (e) => {
//     setSelectedStatus(e.target.value);
//     setCurrentPage(1);
//   };
  
//   const handleSearchChange = (e) => {
//     setSearchQuery(e.target.value);
//     setCurrentPage(1);
//   };

//   const clearFilters = () => {
//     setSelectedLevel("All Levels");
//     setSelectedCategory("All Categories");
//     setSelectedStatus("All Statuses");
//     setSortOption("Newest First");
//     setSearchQuery("");
//     setCurrentPage(1);
//   };

//   // Toggle mobile filters
//   const toggleMobileFilters = () => {
//     setShowMobileFilters(!showMobileFilters);
//   };

//   return (
//     <div className="manage-activities-page">
//       <div className="manage-activities-header">
//         <div>
//           <h1 className="page-title">Manage Activities</h1>
//           <p className="page-subtitle">Create, edit, and manage activities for students</p>
//         </div>
//         <div className="header-actions">
//           <button 
//             className="mobile-filter-btn" 
//             onClick={toggleMobileFilters}
//           >
//             <FontAwesomeIcon icon={faFilter} /> Filters
//           </button>
//           {activeTab !== "pending" && (
//             <Link to={`/teacher/create-${activeTab.slice(0, -1)}`} className="add-activity-btn">
//               <FontAwesomeIcon icon={faPlus} />
//               <span>Add New {activeTab === "templates" ? "Activity" : 
//                        activeTab === "assessments" ? "Assessment" : 
//                        "Practice Module"}</span>
//             </Link>
//           )}
//         </div>
//       </div>

//       <div className="manage-activities-container">
//         {/* Filters Panel */}
//         <div className={`filters-panel ${showMobileFilters ? 'show-mobile' : ''}`}>
//           <div className="filters-header">
//             <h2 className="filters-title">Filters</h2>
//             <button 
//               className="close-filters-btn"
//               onClick={toggleMobileFilters}
//             >
//               &times;
//             </button>
//           </div>
          
//           <div className="filter-group">
//             <label className="filter-label">Antas Level</label>
//             <div className="select-wrapper">
//               <select 
//                 className="filter-select" 
//                 value={selectedLevel}
//                 onChange={handleLevelChange}
//               >
//                 {readingLevels.map((level, index) => (
//                   <option key={index} value={level}>{level}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
          
//           <div className="filter-group">
//             <label className="filter-label">Category</label>
//             <div className="select-wrapper">
//               <select 
//                 className="filter-select"
//                 value={selectedCategory}
//                 onChange={handleCategoryChange}
//               >
//                 {categories.map((category, index) => (
//                   <option key={index} value={category}>{category}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
          
//           <div className="filter-group">
//             <label className="filter-label">Status</label>
//             <div className="select-wrapper">
//               <select 
//                 className="filter-select"
//                 value={selectedStatus}
//                 onChange={handleStatusChange}
//               >
//                 {statusOptions.map((status, index) => (
//                   <option key={index} value={status}>{status}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
          
//           <div className="filter-group">
//             <label className="filter-label">Sort By</label>
//             <div className="select-wrapper">
//               <select 
//                 className="filter-select"
//                 value={sortOption}
//                 onChange={handleSortChange}
//               >
//                 {sortOptions.map((option, index) => (
//                   <option key={index} value={option}>{option}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
          
//           <div className="filter-group">
//             <label className="filter-label">Search</label>
//             <div className="search-container">
//               <input 
//                 type="text" 
//                 className="search-input" 
//                 placeholder="Search activities..."
//                 value={searchQuery}
//                 onChange={handleSearchChange}
//               />
//               <FontAwesomeIcon icon={faSearch} className="search-icon" />
//             </div>
//           </div>
          
//           <button className="clear-filters-btn" onClick={clearFilters}>
//             Clear Filters
//           </button>
//         </div>
        
//         {/* Main Content */}
//         <div className="content-area">
//           {/* Tabs Navigation */}
//           <div className="tabs-navigation">
//             {tabs.map(tab => (
//               <button 
//                 key={tab.id}
//                 className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
//                 onClick={() => {
//                   setActiveTab(tab.id);
//                   setCurrentPage(1);
//                 }}
//               >
//                 {tab.label}
//               </button>
//             ))}
//           </div>
          
//           {/* Tab Content */}
//           <div className="tab-content">
//             <div className="tab-header">
//               <h2 className="content-title">
//                 {activeTab === "templates" && "Activity Templates"}
//                 {activeTab === "assessments" && "Pre-Assessment Activities"}
//                 {activeTab === "practice" && "Practice Module Templates"}
//                 {activeTab === "pending" && "Activities Pending Approval"}
//               </h2>
//               {activeTab !== "pending" && (
//                 <Link 
//                   to={`/teacher/create-${activeTab.slice(0, -1)}`} 
//                   className="create-new-btn"
//                 >
//                   Create New
//                 </Link>
//               )}
//             </div>

//             {loading ? (
//               <div className="loading-state">
//                 <div className="spinner"></div>
//                 <p>Loading activities...</p>
//               </div>
//             ) : sortedActivities.length === 0 ? (
//               <div className="empty-state">
//                 <div className="empty-illustration">
//                   <FontAwesomeIcon icon={faFileAlt} size="3x" />
//                 </div>
//                 <h3>No Activities Found</h3>
//                 <p>No activities match your current filters.</p>
//                 <button className="clear-filters-btn" onClick={clearFilters}>
//                   Clear Filters
//                 </button>
//                 {activeTab !== "pending" && (
//                   <>
//                     <p className="empty-state-or">Or</p>
//                     <Link 
//                       to={`/teacher/create-${activeTab.slice(0, -1)}`} 
//                       className="create-new-btn"
//                     >
//                       Create New Activity
//                     </Link>
//                   </>
//                 )}
//               </div>
//             ) : (
//               <div className={`activities-grid ${activeTab === "pending" ? 'single-column' : ''}`}>
//                 {sortedActivities.map(activity => (
//                   <div 
//                     key={activity.id} 
//                     className={`activity-card ${activeTab === "pending" ? 'pending-card' : ''}`}
//                     style={{ 
//                       borderLeft: `4px solid ${
//                         activity.status === 'approved' ? '#28a745' : 
//                         activity.status === 'pending' ? '#ffc107' :
//                         activity.status === 'locked' ? '#6c757d' :
//                         activity.status === 'rejected' ? '#dc3545' : '#e9ecef'
//                       }`,
//                       borderTop: `4px solid ${
//                         activity.type === 'template' ? '#3b4f81' : 
//                         activity.type === 'assessment' ? '#fd7e14' :
//                         activity.type === 'practice' ? '#20c997' : '#e9ecef'
//                       }`
//                     }}
//                   >
//                     <div className="activity-card-header">
//                       <div className="activity-title-area">
//                         {getActivityIcon(activity.categories)}
//                         <h3 className="activity-title">{activity.title}</h3>
//                       </div>
//                       {getStatusBadge(activity.status)}
//                     </div>
                    
//                     <div className="activity-card-body">
//                       <div className="activity-metadata">
//                         <div className="metadata-row">
//                           <span className="metadata-label">Antas:</span>
//                           <span className="metadata-value">{activity.level}</span>
//                         </div>
                        
//                         <div className="metadata-row">
//                           <span className="metadata-label">Categories:</span>
//                           <div className="category-tags">
//                             {renderCategoryTags(activity.categories)}
//                           </div>
//                         </div>
                        
//                         <div className="metadata-row">
//                           <span className="metadata-label">Type:</span>
//                           <span className="metadata-value">
//                             {activity.type === 'template' && 'Activity Template'}
//                             {activity.type === 'assessment' && 'Pre-Assessment'}
//                             {activity.type === 'practice' && 'Practice Module'}
//                           </span>
//                         </div>
                        
//                         <div className="metadata-row">
//                           <span className="metadata-label">Created:</span>
//                           <span className="metadata-value">
//                             {new Date(activity.createdAt).toLocaleDateString('en-US', { 
//                               year: 'numeric', 
//                               month: 'short', 
//                               day: 'numeric' 
//                             })}
//                           </span>
//                         </div>
                        
//                         {activity.description && (
//                           <div className="metadata-row description-row">
//                             <span className="metadata-label">Description:</span>
//                             <p className="description-text">{activity.description}</p>
//                           </div>
//                         )}

//                         {activity.adminRemarks && (
//                           <div className="admin-remarks">
//                             <h4 className="remarks-title">Admin Remarks:</h4>
//                             <p className="remarks-text">{activity.adminRemarks}</p>
//                           </div>
//                         )}
//                       </div>
                      
//                       <div className="activity-actions">
//                         {activity.status === 'pending' ? (
//                           <div className="waiting-approval">
//                             <FontAwesomeIcon icon={faHourglassHalf} className="waiting-icon" /> 
//                             <span>Waiting for admin approval</span>
//                           </div>
//                         ) : (
//                           <div className="action-buttons">
//                             <Link 
//                               to={`/teacher/preview-activity/${activity.id}`} 
//                               className="preview-btn"
//                             >
//                               <FontAwesomeIcon icon={faEye} /> Preview
//                             </Link>
                            
//                             {(activity.status === 'rejected' || (activity.status !== 'locked' && activity.status !== 'approved')) && (
//                               <Link 
//                                 to={`/teacher/edit-activity/${activity.id}`} 
//                                 className="edit-btn"
//                               >
//                                 <FontAwesomeIcon icon={faEdit} /> Edit
//                               </Link>
//                             )}
//                           </div>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
            
//             {/* Empty space placeholder when few items */}
//             {sortedActivities.length > 0 && sortedActivities.length < 3 && (
//               <div className="content-min-height"></div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default ManageActivities;