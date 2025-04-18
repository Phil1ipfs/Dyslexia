// src/pages/Admin/ParentListPage.jsx
import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Filter, Search, Plus } from 'lucide-react';
import './UserListPage.css';

const ParentListPage = () => {
  const [parents, setParents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('name');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [filteredParents, setFilteredParents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for parents
  useEffect(() => {
    // In a real app, this would be an API call
    const mockParents = [
      {
        id: 1,
        name: 'Christine Brooks',
        email: 'christinebrooks@gmail.com',
        phone: '+63 912 345 6789',
        children: ['Maria Brooks'],
        status: 'Active'
      },
      {
        id: 2,
        name: 'Alan Cain',
        email: 'alancain@gmail.com',
        phone: '+63 923 456 7891',
        children: ['Rosie Pearson', 'Darrell Caldwell', 'Gilbert Johnston', 'Alfred Murray'],
        status: 'Active'
      },
      {
        id: 3,
        name: 'Miguel Reyes Sr.',
        email: 'miguelreyes@gmail.com',
        phone: '+63 934 567 8912',
        children: ['Miguel Reyes'],
        status: 'Active'
      },
      {
        id: 4,
        name: 'Maria Garcia',
        email: 'mariagarcia@gmail.com',
        phone: '+63 945 678 9123',
        children: ['Sofia Garcia'],
        status: 'Active'
      },
      {
        id: 5,
        name: 'Jose Mendoza',
        email: 'josemendoza@gmail.com',
        phone: '+63 956 789 1234',
        children: ['Carlos Mendoza'],
        status: 'Inactive'
      },
      {
        id: 6,
        name: 'Sophia Tan',
        email: 'sophiatan@gmail.com',
        phone: '+63 967 891 2345',
        children: ['Isabella Tan'],
        status: 'Active'
      },
      {
        id: 7,
        name: 'Juan Villanueva',
        email: 'juanvillanueva@gmail.com',
        phone: '+63 978 912 3456',
        children: ['Antonio Villanueva'],
        status: 'Pending'
      }
    ];

    setParents(mockParents);
    setFilteredParents(mockParents);
    setLoading(false);
  }, []);

  // Handle search input change
  const handleSearchChange = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);
    
    if (searchValue.trim() === '') {
      setFilteredParents(parents);
    } else {
      const filtered = parents.filter(parent => {
        if (searchBy === 'name') {
          return parent.name.toLowerCase().includes(searchValue.toLowerCase());
        } else if (searchBy === 'email') {
          return parent.email.toLowerCase().includes(searchValue.toLowerCase());
        } else if (searchBy === 'phone') {
          return parent.phone.toLowerCase().includes(searchValue.toLowerCase());
        } else if (searchBy === 'child') {
          return parent.children.some(child => 
            child.toLowerCase().includes(searchValue.toLowerCase())
          );
        }
        return true;
      });
      setFilteredParents(filtered);
    }
  };

  // Toggle search dropdown
  const toggleSearchDropdown = (e) => {
    e.stopPropagation();
    setIsSearchDropdownOpen(!isSearchDropdownOpen);
  };

  // Set search by option
  const setSearchByOption = (option) => {
    setSearchBy(option);
    setIsSearchDropdownOpen(false);
  };

  // Get search by display text
  const getSearchByText = () => {
    switch (searchBy) {
      case 'name':
        return 'Search by Name';
      case 'email':
        return 'Search by Email';
      case 'phone':
        return 'Search by Phone';
      case 'child':
        return 'Search by Child';
      default:
        return 'Search by Name';
    }
  };

  // Handle add parent
  const handleAddParent = () => {
    // Redirect to add account page
    window.location.href = '/admin/user-lists/add-account';
  };

  // Handle edit parent
  const handleEditParent = (parentId) => {
    console.log('Edit parent', parentId);
  };

  // Handle delete parent
  const handleDeleteParent = (parentId) => {
    console.log('Delete parent', parentId);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsSearchDropdownOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <div className="user-list-page">
      <h1 className="page-title">Parent List</h1>
      
      {/* Enhanced Actions Bar */}
      <div className="enhanced-actions-bar">
        <div className="search-section">
          <div className="search-wrapper">
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search parents..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="enhanced-search-input"
            />
          </div>
          
          <div className="search-dropdown">
            <button 
              className="enhanced-dropdown-toggle"
              onClick={toggleSearchDropdown}
            >
              {getSearchByText()}
              <span className="dropdown-arrow">▼</span>
            </button>
            
            {isSearchDropdownOpen && (
              <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                <div 
                  className={`dropdown-item ${searchBy === 'name' ? 'active' : ''}`}
                  onClick={() => setSearchByOption('name')}
                >
                  Search by Name
                </div>
                <div 
                  className={`dropdown-item ${searchBy === 'email' ? 'active' : ''}`}
                  onClick={() => setSearchByOption('email')}
                >
                  Search by Email
                </div>
                <div 
                  className={`dropdown-item ${searchBy === 'phone' ? 'active' : ''}`}
                  onClick={() => setSearchByOption('phone')}
                >
                  Search by Phone
                </div>
                <div 
                  className={`dropdown-item ${searchBy === 'child' ? 'active' : ''}`}
                  onClick={() => setSearchByOption('child')}
                >
                  Search by Child
                </div>
              </div>
            )}
          </div>
          
          <button className="filter-button">
            <Filter size={16} />
            <span>Filter</span>
          </button>
        </div>
        
        <div className="action-buttons-group">
          <button className="add-button" onClick={handleAddParent}>
            <Plus size={16} />
            <span>Add Parent</span>
          </button>
          
          <button className="action-button primary-action">
            <span>Export</span>
          </button>
        </div>
      </div>
      
      <div className="user-table">
        <div className="table-header">
          <div className="th name-col">PARENT NAME</div>
          <div className="th email-col">EMAIL</div>
          <div className="th phone-col">PHONE NUMBER</div>
          <div className="th children-col">CHILDREN</div>
          <div className="th status-col">STATUS</div>
          <div className="th actions-col">ACTION/S</div>
        </div>
        
        <div className="table-body">
          {loading ? (
            <div className="loading">Loading parents...</div>
          ) : filteredParents.length === 0 ? (
            <div className="no-results">No parents found matching your search.</div>
          ) : (
            filteredParents.map(parent => (
              <div className="table-row" key={parent.id}>
                <div className="td name-col">{parent.name}</div>
                <div className="td email-col">{parent.email}</div>
                <div className="td phone-col">{parent.phone}</div>
                <div className="td children-col">
                  {parent.children.map((child, index) => (
                    <span key={index} className="child-tag">
                      {child}{index < parent.children.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </div>
                <div className="td status-col">
                  <span className={`status-badge ${parent.status.toLowerCase()}`}>
                    {parent.status}
                  </span>
                </div>
                <div className="td actions-col">
                  <div className="action-buttons-container">
                    <button 
                      className="edit-button"
                      onClick={() => handleEditParent(parent.id)}
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteParent(parent.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentListPage;