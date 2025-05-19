import React, { useState, useEffect } from 'react';
import { Trash, Pencil, Filter, Search, X, Plus, Edit, Trash2, User } from 'lucide-react';
import axios from 'axios';
import './ParentsPage.css';

const ParentsPage = () => {
  // State variables
  const [parents, setParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentParent, setCurrentParent] = useState(null);
  const [currentParentId, setCurrentParentId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch parents data from MongoDB
  useEffect(() => {
    const fetchParents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5002/api/admin/manage/parents');
        if (response.data.success) {
          setParents(response.data.data);
          setFilteredParents(response.data.data);
        } else {
          console.error("Error fetching parents:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching parents data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParents();
  }, []);

  // Filter parents based on search term
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredParents(parents);
    } else {
      const filtered = parents.filter(parent => 
        `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParents(filtered);
    }
  }, [searchTerm, parents]);

  // View parent profile
  const handleViewProfile = (parent) => {
    setCurrentParent(parent);
    setIsViewModalOpen(true);
  };

  // Edit parent
  const handleEditParent = (parent) => {
    setCurrentParent(parent);
    setCurrentParentId(parent._id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Delete parent
  const handleDeleteParent = (id) => {
    setCurrentParentId(id);
    setIsDeleteModalOpen(true);
  };

  if (loading) {
    return (
      <div className="parents-page-container">
        {/* Header Section */}
        <div className="parents-page-header">
          <div className="parents-page-title-container">
            <h1 className="parents-page-title">Parent Lists</h1>
            <p className="parents-page-subtitle">Add, View the List of Parents and their Information</p>
          </div>
          <div className="parents-page-image">
            <div className="parents-page-placeholder"></div>
          </div>
        </div>

        {/* Controls Section */}
        <div className="parents-page-actions">
          <div className="parents-page-search-container">
            <div className="parents-page-search">
              <input
                type="text"
                placeholder="Search..."
                disabled
                className="parents-page-search-input"
              />
              <Search className="parents-page-search-icon" size={18} />
            </div>
            <button className="parents-page-filter-btn" disabled>
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="parents-page-add-btn" disabled>
              <Plus size={18} />
              Add New Parent
            </button>
          </div>
        </div>

        <div className="parents-page-table-container" style={{ opacity: 0.6 }}>
          <table className="parents-page-table">
            <thead>
              <tr>
                <th>Parent Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>View Profile</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((_, index) => (
                <tr key={index}>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-text"></div></td>
                  <td><div className="skeleton-button"></div></td>
                  <td><div className="skeleton-actions"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="parents-page-container">
      {/* Header Section */}
      <div className="parents-page-header">
        <div className="parents-page-title-container">
          <h1 className="parents-page-title">Parent Lists</h1>
          <p className="parents-page-subtitle">Add, View the List of Parents and their Information</p>
        </div>
        <div className="parents-page-image">
          <div className="parents-page-placeholder"></div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="parents-page-actions">
        <div className="parents-page-search-container">
          <div className="parents-page-search">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="parents-page-search-input"
            />
            <Search className="parents-page-search-icon" size={18} />
          </div>
          <button className="parents-page-filter-btn">
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <button 
            className="parents-page-add-btn"
            onClick={() => {
              setIsEditing(false);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            Add New Parent
          </button>
        </div>
      </div>

      <div className="parents-page-table-container">
        <table className="parents-page-table">
          <thead>
            <tr>
              <th>Parent Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>View Profile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredParents.map((parent) => (
              <tr key={parent._id}>
                <td>{`${parent.firstName} ${parent.lastName}`}</td>
                <td>{parent.email}</td>
                <td>{parent.address}</td>
                <td>
                  <button 
                    className="parents-page-view-btn"
                    onClick={() => handleViewProfile(parent)}
                  >
                    View Profile
                  </button>
                </td>
                <td className="parents-page-actions-cell">
                  <div className="parents-page-crud-btns">
                    <button 
                      className="parents-page-edit-btn"
                      onClick={() => handleEditParent(parent)}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="parents-page-delete-btn"
                      onClick={() => handleDeleteParent(parent._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View Parent Profile Modal */}
      {isViewModalOpen && currentParent && (
        <div className="parents-page-modal-overlay">
          <div className="parents-page-profile-modal">
            <div className="parents-page-modal-header">
              <h2>Parent Profile</h2>
              <button 
                className="parents-page-modal-close"
                onClick={() => setIsViewModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="parents-page-profile-content">
              <div className="parents-page-profile-avatar">
                {currentParent.profileImageUrl ? (
                  <img 
                    src={currentParent.profileImageUrl} 
                    alt={`${currentParent.firstName} ${currentParent.lastName}`}
                    className="parents-page-profile-image"
                  />
                ) : (
                  <User size={64} />
                )}
              </div>
              
              <div className="parents-page-profile-details">
                <h3 className="parents-page-profile-name">
                  {`${currentParent.firstName} ${currentParent.lastName}`}
                </h3>
                
                <div className="parents-page-profile-info">
                  <div className="parents-page-profile-info-item">
                    <span className="parents-page-profile-label">Email:</span>
                    <span className="parents-page-profile-value">{currentParent.email}</span>
                  </div>
                  
                  <div className="parents-page-profile-info-item">
                    <span className="parents-page-profile-label">Contact:</span>
                    <span className="parents-page-profile-value">{currentParent.contact}</span>
                  </div>
                  
                  <div className="parents-page-profile-info-item">
                    <span className="parents-page-profile-label">Address:</span>
                    <span className="parents-page-profile-value">{currentParent.address}</span>
                  </div>
                  
                  <div className="parents-page-profile-info-item">
                    <span className="parents-page-profile-label">Civil Status:</span>
                    <span className="parents-page-profile-value">{currentParent.civilStatus}</span>
                  </div>
                  
                  <div className="parents-page-profile-info-item">
                    <span className="parents-page-profile-label">Gender:</span>
                    <span className="parents-page-profile-value">{currentParent.gender}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="parents-page-modal-footer">
              <button 
                className="parents-page-close-btn"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentsPage;