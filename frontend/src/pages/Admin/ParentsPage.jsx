import React, { useState, useEffect } from 'react';
import { Trash, Pencil, Filter, Search, X } from 'lucide-react';

import './ParentsPage.css';



// Mock data for testing - will be replaced with MongoDB data
const initialParentsData = [
  { 
    _id: "1", 
    name: "Christine Brooks", 
    email: "crhistianbrooks@gmail.com", 
    address: "Sampaloc Manila",
    children: ["Jane Brooks", "John Brooks"],
    phone: "09123456789",
    occupation: "Doctor"
  },
  { 
    _id: "2", 
    name: "Rosie Pearson", 
    email: "crhistianbrooks@gmail.com", 
    address: "Sampaloc Manila",
    children: ["Mark Pearson"],
    phone: "09123456790",
    occupation: "Engineer"
  },
  { 
    _id: "3", 
    name: "Darrell Caldwell", 
    email: "crhistianbrooks@gmail.com", 
    address: "Sampaloc Manila",
    children: ["Lisa Caldwell", "Mike Caldwell"],
    phone: "09123456791",
    occupation: "Teacher"
  },
  { 
    _id: "4", 
    name: "Gilbert Johnston", 
    email: "crhistianbrooks@gmail.com", 
    address: "Sampaloc Manila",
    children: ["Sarah Johnston"],
    phone: "09123456792",
    occupation: "Lawyer"
  },
  { 
    _id: "5", 
    name: "Alan Cain", 
    email: "crhistianbrooks@gmail.com", 
    address: "Sampaloc Manila",
    children: ["Kevin Cain", "Melissa Cain"],
    phone: "09123456793",
    occupation: "Accountant"
  },
  { 
    _id: "6", 
    name: "Alfred Murray", 
    email: "crhistianbrooks@gmail.com", 
    address: "Sampaloc Manila",
    children: ["Thomas Murray"],
    phone: "09123456794",
    occupation: "Business Owner"
  }
];

const ParentsPage = () => {
  // State variables
  const [parents, setParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentParent, setCurrentParent] = useState({
    name: '',
    email: '',
    address: '',
    children: [],
    phone: '',
    occupation: ''
  });
  const [currentParentId, setCurrentParentId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [childName, setChildName] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Fetch data - would be replaced with actual API call
  useEffect(() => {
    // Simulating API fetch
    const fetchParents = async () => {
      try {
        // In a real application, this would be:
        // const response = await fetch('/api/parents');
        // const data = await response.json();
        // setParents(data);
        // setFilteredParents(data);
        
        // For now using mock data
        setParents(initialParentsData);
        setFilteredParents(initialParentsData);
      } catch (error) {
        console.error("Error fetching parents data:", error);
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
        parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parent.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredParents(filtered);
    }
  }, [searchTerm, parents]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentParent(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Add child to current parent
  const handleAddChild = () => {
    if (childName.trim()) {
      setCurrentParent(prev => ({
        ...prev,
        children: [...prev.children, childName.trim()]
      }));
      setChildName('');
    }
  };

  // Remove child from current parent
  const handleRemoveChild = (index) => {
    setCurrentParent(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!currentParent.name.trim()) errors.name = 'Name is required';
    if (!currentParent.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(currentParent.email)) {
      errors.email = 'Email is invalid';
    }
    if (!currentParent.address.trim()) errors.address = 'Address is required';
    if (!currentParent.phone.trim()) errors.phone = 'Phone is required';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRUD Operations
  const handleAddParent = async () => {
    if (!validateForm()) return;
    
    try {
      // In a real application with MongoDB/API:
      // const response = await fetch('/api/parents', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(currentParent)
      // });
      // const newParent = await response.json();
      
      // Mock implementation
      const newParent = {
        ...currentParent,
        _id: (parents.length + 1).toString()
      };
      
      setParents([...parents, newParent]);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error adding parent:", error);
    }
  };

  const handleUpdateParent = async () => {
    if (!validateForm()) return;
    
    try {
      // In a real application with MongoDB/API:
      // await fetch(`/api/parents/${currentParentId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(currentParent)
      // });
      
      // Mock implementation
      const updatedParents = parents.map(parent => 
        parent._id === currentParentId ? { ...currentParent, _id: currentParentId } : parent
      );
      
      setParents(updatedParents);
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error updating parent:", error);
    }
  };

  const handleDeleteParent = async () => {
    try {
      // In a real application with MongoDB/API:
      // await fetch(`/api/parents/${currentParentId}`, {
      //   method: 'DELETE'
      // });
      
      // Mock implementation
      const updatedParents = parents.filter(parent => parent._id !== currentParentId);
      
      setParents(updatedParents);
      setIsDeleteModalOpen(false);
      setCurrentParentId(null);
    } catch (error) {
      console.error("Error deleting parent:", error);
    }
  };

  // Open modals
  const openAddModal = () => {
    setIsEditing(false);
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (parent) => {
    setIsEditing(true);
    setCurrentParent({
      name: parent.name,
      email: parent.email,
      address: parent.address,
      children: [...parent.children],
      phone: parent.phone || '',
      occupation: parent.occupation || ''
    });
    setCurrentParentId(parent._id);
    setIsModalOpen(true);
  };

  const openDeleteModal = (id) => {
    setCurrentParentId(id);
    setIsDeleteModalOpen(true);
  };

  const openViewModal = (parent) => {
    setCurrentParent({
      name: parent.name,
      email: parent.email,
      address: parent.address,
      children: [...parent.children],
      phone: parent.phone || '',
      occupation: parent.occupation || ''
    });
    setIsViewModalOpen(true);
  };

  // Close modals and reset form
  const resetForm = () => {
    setCurrentParent({
      name: '',
      email: '',
      address: '',
      children: [],
      phone: '',
      occupation: ''
    });
    setCurrentParentId(null);
    setFormErrors({});
  };

  const handleSendEmail = (email) => {
    // In a real application, this would trigger an email sending functionality
    console.log(`Sending email to: ${email}`);
    // Could open a modal with email template or redirect to email service
    alert(`Email would be sent to: ${email}`);
  };

  return (
    <div className="parents-page-container">
      <div className="parents-page-header">
        <h1 className="parents-page-title">Parent Lists</h1>
        <p className="parents-page-subtitle">Add, View and Manage the List of Parents and their Information</p>
      </div>

      <div className="parents-page-actions">
        <div className="parents-page-search">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="parents-page-search-input"
          />
          <Search className="parents-page-search-icon" size={20} />
        </div>
        <div className="parents-page-filters">
          <button className="parents-page-filter-btn">
            <Filter size={18} />
            <span>Filter</span>
          </button>
        </div>
        <button 
          className="parents-page-add-btn"
          onClick={openAddModal}
        >
          Add New Parent
        </button>
      </div>

      <div className="parents-page-table-container">
        <table className="parents-page-table">
          <thead>
            <tr>
              <th>Parent Name</th>
              <th>Email</th>
              <th>Address</th>
              <th>View Profile</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filteredParents.map((parent) => (
              <tr key={parent._id}>
                <td>{parent.name}</td>
                <td>{parent.email}</td>
                <td>{parent.address}</td>
                <td>
                  <button 
                    className="parents-page-view-btn"
                    onClick={() => openViewModal(parent)}
                  >
                    View Profile
                  </button>
                </td>
                <td className="parents-page-actions-cell">
                  <button 
                    className="parents-page-email-btn"
                    onClick={() => handleSendEmail(parent.email)}
                  >
                    Send Email
                  </button>
                  <div className="parents-page-crud-btns">
                    <button 
                      className="parents-page-edit-btn"
                      onClick={() => openEditModal(parent)}
                    >
                      <Pencil size={18} />
                    </button>
                    <button 
                      className="parents-page-delete-btn"
                      onClick={() => openDeleteModal(parent._id)}
                    >
                      <Trash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Parent Modal */}
      {isModalOpen && (
        <div className="parents-page-modal-overlay">
          <div className="parents-page-modal">
            <div className="parents-page-modal-header">
              <h2>{isEditing ? 'Edit Parent' : 'Add New Parent'}</h2>
              <button 
                className="parents-page-modal-close"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="parents-page-modal-body">
              <div className="parents-page-form-group">
                <label htmlFor="parent-name">Parent Name</label>
                <input
                  id="parent-name"
                  name="name"
                  type="text"
                  value={currentParent.name}
                  onChange={handleInputChange}
                  className={`parents-page-input ${formErrors.name ? 'parents-page-input-error' : ''}`}
                />
                {formErrors.name && <p className="parents-page-error">{formErrors.name}</p>}
              </div>

              <div className="parents-page-form-group">
                <label htmlFor="parent-email">Email</label>
                <input
                  id="parent-email"
                  name="email"
                  type="email"
                  value={currentParent.email}
                  onChange={handleInputChange}
                  className={`parents-page-input ${formErrors.email ? 'parents-page-input-error' : ''}`}
                />
                {formErrors.email && <p className="parents-page-error">{formErrors.email}</p>}
              </div>

              <div className="parents-page-form-group">
                <label htmlFor="parent-address">Address</label>
                <input
                  id="parent-address"
                  name="address"
                  type="text"
                  value={currentParent.address}
                  onChange={handleInputChange}
                  className={`parents-page-input ${formErrors.address ? 'parents-page-input-error' : ''}`}
                />
                {formErrors.address && <p className="parents-page-error">{formErrors.address}</p>}
              </div>

              <div className="parents-page-form-group">
                <label htmlFor="parent-phone">Phone Number</label>
                <input
                  id="parent-phone"
                  name="phone"
                  type="text"
                  value={currentParent.phone}
                  onChange={handleInputChange}
                  className={`parents-page-input ${formErrors.phone ? 'parents-page-input-error' : ''}`}
                />
                {formErrors.phone && <p className="parents-page-error">{formErrors.phone}</p>}
              </div>

              <div className="parents-page-form-group">
                <label htmlFor="parent-occupation">Occupation</label>
                <input
                  id="parent-occupation"
                  name="occupation"
                  type="text"
                  value={currentParent.occupation}
                  onChange={handleInputChange}
                  className="parents-page-input"
                />
              </div>

              <div className="parents-page-form-group">
                <label>Children</label>
                <div className="parents-page-children-input-group">
                  <input
                    type="text"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Enter child name"
                    className="parents-page-input"
                  />
                  <button 
                    className="parents-page-add-child-btn"
                    onClick={handleAddChild}
                    type="button"
                  >
                    Add
                  </button>
                </div>
                <div className="parents-page-children-list">
                  {currentParent.children.map((child, index) => (
                    <div key={index} className="parents-page-child-item">
                      <span>{child}</span>
                      <button 
                        className="parents-page-remove-child-btn"
                        onClick={() => handleRemoveChild(index)}
                        type="button"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="parents-page-modal-footer">
              <button 
                className="parents-page-cancel-btn"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="parents-page-submit-btn"
                onClick={isEditing ? handleUpdateParent : handleAddParent}
              >
                {isEditing ? 'Update' : 'Add'} Parent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="parents-page-modal-overlay">
          <div className="parents-page-delete-modal">
            <div className="parents-page-modal-header">
              <h2>Delete Parent</h2>
              <button 
                className="parents-page-modal-close"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="parents-page-modal-body">
              <p>Are you sure you want to delete this parent record? This action cannot be undone.</p>
            </div>
            <div className="parents-page-modal-footer">
              <button 
                className="parents-page-cancel-btn"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="parents-page-delete-confirm-btn"
                onClick={handleDeleteParent}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Parent Details Modal */}
      {isViewModalOpen && (
        <div className="parents-page-modal-overlay">
          <div className="parents-page-modal">
            <div className="parents-page-modal-header">
              <h2>Parent Details</h2>
              <button 
                className="parents-page-modal-close"
                onClick={() => setIsViewModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>
            <div className="parents-page-profile-view">
              <div className="parents-page-profile-section">
                <h3>Personal Information</h3>
                <div className="parents-page-profile-info">
                  <div className="parents-page-profile-item">
                    <strong>Name:</strong>
                    <span>{currentParent.name}</span>
                  </div>
                  <div className="parents-page-profile-item">
                    <strong>Email:</strong>
                    <span>{currentParent.email}</span>
                  </div>
                  <div className="parents-page-profile-item">
                    <strong>Address:</strong>
                    <span>{currentParent.address}</span>
                  </div>
                  <div className="parents-page-profile-item">
                    <strong>Phone:</strong>
                    <span>{currentParent.phone}</span>
                  </div>
                  <div className="parents-page-profile-item">
                    <strong>Occupation:</strong>
                    <span>{currentParent.occupation}</span>
                  </div>
                </div>
              </div>

              <div className="parents-page-profile-section">
                <h3>Children</h3>
                {currentParent.children.length > 0 ? (
                  <ul className="parents-page-children-view-list">
                    {currentParent.children.map((child, index) => (
                      <li key={index}>{child}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No children listed.</p>
                )}
              </div>
            </div>
            <div className="parents-page-modal-footer">
              <button 
                className="parents-page-close-btn"
                onClick={() => setIsViewModalOpen(false)}
              >
                Close
              </button>
              <button 
                className="parents-page-edit-btn-large"
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal({...currentParent, _id: currentParentId});
                }}
              >
                Edit Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentsPage;