// src/pages/StudentList/StudentListPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Eye, BookOpen, Book, Clock, MoreHorizontal, User } from 'lucide-react';
import axios from 'axios';
import './StudentListPage.css';

const SuccessModal = ({ message, onClose }) => (
  <div className="literexia-teacher-modal-overlay">
    <div className="literexia-teacher-modal">
      <div className="literexia-teacher-modal-header">
        <h2>Success</h2>
        <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="literexia-teacher-modal-form">
        <p>{message}</p>
        <button className="literexia-teacher-save-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const ValidationErrorModal = ({ message, onClose }) => (
  <div className="literexia-teacher-modal-overlay">
    <div className="literexia-teacher-modal">
      <div className="literexia-teacher-modal-header">
        <h2>Missing Required Fields</h2>
        <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
      </div>
      <div className="literexia-teacher-modal-content">
        <p>{message}</p>
        <button className="literexia-teacher-close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  </div>
);

const AddEditStudentModal = ({ student, onClose, onSave }) => {
  const [formData, setFormData] = useState(
    student ? { ...student } : {
      idNumber: '2025',
      firstName: '',
      middleName: '',
      lastName: '',
      age: '',
      gender: '',
      gradeLevel: '',
      section: '',
      address: '',
      profileImage: null
    }
  );

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 3;

  const steps = [
    {
      title: 'Basic Info',
      fields: ['idNumber', 'firstName', 'middleName', 'lastName']
    },
    {
      title: 'Academic Info',
      fields: ['gradeLevel', 'section', 'age']
    },
    {
      title: 'Additional Info',
      fields: ['gender', 'address', 'profileImage']
    }
  ];

  const validateStep = (step) => {
    const currentFields = steps[step - 1].fields;
    const stepErrors = {};
    let isValid = true;

    currentFields.forEach(field => {
      if (!formData[field] && field !== 'middleName' && field !== 'profileImage') {
        stepErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
        isValid = false;
      }
    });

    setErrors(stepErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate current step
    if (!validateStep(currentStep)) {
      return; // Stop if validation fails
    }

    if (currentStep < totalSteps) {
      // Move to next step
      setCurrentStep(prev => prev + 1);
      setErrors({}); // Clear errors when moving to next step
    } else {
      // Final step - submit the form
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    // Validate all steps before final submission
    let allStepsValid = true;
    let allErrors = {};

    for (let step = 1; step <= totalSteps; step++) {
      const currentFields = steps[step - 1].fields;
      currentFields.forEach(field => {
        if (!formData[field] && field !== 'middleName' && field !== 'profileImage') {
          allErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
          allStepsValid = false;
        }
      });
    }

    if (!allStepsValid) {
      setErrors(allErrors);
      // Go back to the first step with errors
      for (let step = 1; step <= totalSteps; step++) {
        const currentFields = steps[step - 1].fields;
        const hasErrorInStep = currentFields.some(field => allErrors[field]);
        if (hasErrorInStep) {
          setCurrentStep(step);
          break;
        }
      }
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      setErrors({}); // Clear errors when moving to next step
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setErrors({}); // Clear errors when moving to previous step
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
    }
  };

  const renderFormFields = () => {
    const currentFields = steps[currentStep - 1].fields;

    return (
      <div className="literexia-teacher-form-section">
        {currentFields.map(field => {
          if (field === 'profileImage') {
            return (
              <div key={field} className="literexia-teacher-form-group full-width">
                <label className="literexia-teacher-optional">Profile Image (Optional)</label>
                <div className="literexia-teacher-file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="literexia-teacher-file-input"
                  />
                  <div className="literexia-teacher-file-input-content">
                    <div className="literexia-teacher-file-input-icon">📁</div>
                    <div className="literexia-teacher-file-input-text">
                      {formData.profileImage ? 'Change Image' : 'Upload Image'}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (field === 'gender') {
            return (
              <div key={field} className="literexia-teacher-form-group">
                <label className="literexia-teacher-required">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={`literexia-teacher-input ${errors.gender ? 'error' : ''}`}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <div className="literexia-teacher-error-message">{errors.gender}</div>}
              </div>
            );
          }

          if (field === 'gradeLevel') {
            return (
              <div key={field} className="literexia-teacher-form-group">
                <label className="literexia-teacher-required">Grade Level</label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  className={`literexia-teacher-input ${errors.gradeLevel ? 'error' : ''}`}
                >
                  <option value="">Select Grade Level</option>
                  <option value="Grade 1">Grade 1</option>

                </select>
                {errors.gradeLevel && <div className="literexia-teacher-error-message">{errors.gradeLevel}</div>}
              </div>
            );
          }

          if (field === 'section') {
            return (
              <div key={field} className="literexia-teacher-form-group">
                <label className="literexia-teacher-required">Section</label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className={`literexia-teacher-input ${errors.section ? 'error' : ''}`}
                >
                  <option value="">Select Section</option>
                  <option value="Section 1">Section 1</option>
                  <option value="Section 2">Section 2</option>
                  <option value="Section 3">Section 3</option>
                  <option value="Section 4">Section 4</option>
                </select>
                {errors.section && <div className="literexia-teacher-error-message">{errors.section}</div>}
              </div>
            );
          }

          const getFieldLabel = (field) => {
            switch(field) {
              case 'idNumber': return 'ID Number';
              case 'firstName': return 'First Name';
              case 'middleName': return 'Middle Name';
              case 'lastName': return 'Last Name';
              case 'section': return 'Section';
              case 'age': return 'Age';
              case 'address': return 'Address';
              default: return field.split(/(?=[A-Z])/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            }
          };

          const isRequired = field !== 'middleName' && field !== 'profileImage';

          return (
            <div key={field} className="literexia-teacher-form-group">
              <label className={isRequired ? "literexia-teacher-required" : "literexia-teacher-optional"}>
                {getFieldLabel(field)} {!isRequired && '(Optional)'}
              </label>
              <input
                type={field === 'age' ? 'number' : 'text'}
                name={field}
                value={formData[field]}
                onChange={handleChange}
                className={`literexia-teacher-input ${errors[field] ? 'error' : ''}`}
                placeholder={`Enter ${getFieldLabel(field).toLowerCase()}`}
                min={field === 'age' ? "0" : undefined}
              />
              {errors[field] && <div className="literexia-teacher-error-message">{errors[field]}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="literexia-teacher-modal-overlay">
      <div className="literexia-teacher-modal">
        <div className="literexia-teacher-modal-header">
          <h2>{student ? 'Edit Student' : 'Add New Student'}</h2>
          <button className="literexia-teacher-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="literexia-teacher-modal-form">
          {/* Progress bar */}
          <div className="literexia-teacher-progress">
            <div 
              className="literexia-teacher-progress-bar"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>

          {/* Steps indicator */}
          <div className="literexia-teacher-form-steps">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className={`literexia-teacher-step ${
                  currentStep > index + 1 ? 'completed' : currentStep === index + 1 ? 'active' : ''
                }`}
              >
                <div className="literexia-teacher-step-circle">
                  {currentStep > index + 1 ? '✓' : index + 1}
                </div>
                <div className="literexia-teacher-step-label">{step.title}</div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {renderFormFields()}

            <div className="literexia-teacher-modal-footer">
              <div className="literexia-teacher-modal-footer-buttons">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="literexia-teacher-btn literexia-teacher-btn-secondary"
                    disabled={isLoading}
                  >
                    Previous
                  </button>
                )}
                <button
                  type="submit"
                  className={`literexia-teacher-btn literexia-teacher-btn-primary ${isLoading ? 'literexia-teacher-loading' : ''}`}
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : currentStep < totalSteps ? 'Next' : (student ? 'Update Student' : 'Add Student')}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const StudentListPage = () => {
  // State for students data
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('name'); 
  const [sortBy, setSortBy] = useState('name-asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  
  // Fetch students from database
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5001/api/admin/manage/students');
        if (response.data.success) {
          setStudents(response.data.data);
          setFilteredStudents(response.data.data);
        } else {
          console.error("Error fetching students:", response.data.message);
        }
      } catch (error) {
        console.error("Error fetching students data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student => 
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.idNumber?.toString().includes(searchTerm.toLowerCase()) ||
        student.section?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.gradeLevel?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchTerm, students]);

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'status-active';
      case 'inactive': return 'status-inactive';
      default: return '';
    }
  };

  // View student profile
  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setShowProfileModal(true);
  };

  // Edit student
  const editStudent = (studentId) => {
    console.log(`Edit student: ${studentId}`);
    // Open edit modal or navigate to edit page
  };

  // Delete student
  const deleteStudent = async (studentId) => {
    if (!studentId) return;
    try {
      setLoading(true);
              const response = await axios.delete(`http://localhost:5001/api/admin/manage/students/${studentId}`);
      if (response.data.success) {
        const updatedList = students.filter(s => s._id !== studentId);
        setStudents(updatedList);
        setFilteredStudents(updatedList);
        setShowConfirmDeleteModal(false);
        setSelectedStudent(null);
        setSuccessMessage('Student deleted successfully!');
        setShowSuccessModal(true);
      } else {
        setValidationError(response.data.message || 'Failed to delete student');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  // Add new student
  const handleAddStudent = async (formData) => {
    try {
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value);
      });
              const response = await axios.post('http://localhost:5001/api/admin/manage/students', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        setStudents([...students, response.data.data.studentProfile]);
        setFilteredStudents([...students, response.data.data.studentProfile]);
        setShowAddStudentModal(false);
        setSuccessMessage('Student added successfully!');
        setShowSuccessModal(true);
      } else {
        setValidationError(response.data.message || 'Failed to add student');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to add student');
    } finally {
      setLoading(false);
    }
  };

  // Edit student
  const handleEditStudent = async (formData) => {
    try {
      // Validate all required fields
      if (!formData.firstName || !formData.lastName || !formData.idNumber ||
          !formData.gradeLevel || !formData.section || !formData.age ||
          !formData.gender || !formData.address) {
        setValidationError('Please complete all required fields in all steps');
        return;
      }
      
      setLoading(true);
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) data.append(key, value);
      });
      const response = await axios.put(`http://localhost:5001/api/admin/manage/students/${formData._id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (response.data.success) {
        const updatedList = students.map(s => s._id === formData._id ? response.data.data.studentProfile : s);
        setStudents(updatedList);
        setFilteredStudents(updatedList);
        setShowEditStudentModal(false);
        setSelectedStudent(null);
        setSuccessMessage('Student updated successfully!');
        setShowSuccessModal(true);
      } else {
        setValidationError(response.data.message || 'Failed to update student');
      }
    } catch (error) {
      setValidationError(error.response?.data?.message || 'Failed to update student');
    } finally {
      setLoading(false);
    }
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  if (loading) {
    return (
      <div className="student-list-page">
        {/* Header Section */}
        <div className="page-header">
          <div className="page-title-container">
            <h1>Student Lists</h1>
            <p className="page-subtitle">Add, View the List of Students and their Information</p>
          </div>
          <div className="page-image">
            <div className="page-placeholder"></div>
          </div>
        </div>

        <div className="overview-stats">
          <div className="stat-card">
            <h3>Total Students</h3>
            <p className="stat-number">-</p>
          </div>
          <div className="stat-card">
            <h3>Active Students</h3>
            <p className="stat-number">-</p>
          </div>
          <div className="stat-card">
            <h3>Average Performance</h3>
            <p className="stat-number">-</p>
          </div>
        </div>

        <div className="controls-container" style={{ 
          backgroundColor: '#ffffff', 
          padding: '1rem', 
          borderRadius: '8px', 
          marginBottom: '1.5rem',
          width: '100%'
        }}>
          <div className="search-filter-container" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem',
            width: '100%',
            justifyContent: 'space-between'
          }}>
            <div className="search-box" style={{ 
              flex: '1', 
              minWidth: '200px',
              maxWidth: '500px', 
              position: 'relative' 
            }}>
              <input
                type="text"
                placeholder="Search students..."
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.5rem',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.875rem'
                }}
              />
              <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
            </div>
            <button className="filter-button" disabled>
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="add-student-button" disabled>
              <Plus size={18} />
              Add Student
            </button>
          </div>
        </div>

        <div className="students-table-container" style={{ opacity: 0.6 }}>
          <table className="students-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Grade</th>
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
    <div className="student-list-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="page-title-container">
          <h1>Student Lists</h1>
          <p className="page-subtitle">Add, View the List of Students and their Information</p>
        </div>
        <div className="page-image">
          {/* This would be replaced with an actual image in production */}
          <div className="page-placeholder"></div>
        </div>
      </div>

      <div className="overview-stats">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p className="stat-number">{students.length}</p>
        </div>
        <div className="stat-card">
          <h3>Active Students</h3>
          <p className="stat-number">{students.filter(s => s.status === 'active').length}</p>
        </div>
        <div className="stat-card">
          <h3>Average Performance</h3>
          <p className="stat-number">
            {students.length > 0 
              ? `${Math.round(students.reduce((acc, student) => acc + parseInt(student.averageScore), 0) / students.length)}%` 
              : '0%'}
          </p>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-container" style={{ 
        backgroundColor: '#ffffff', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '1.5rem',
        width: '100%'
      }}>
        <div className="search-filter-container" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem',
          width: '100%',
          justifyContent: 'space-between'
        }}>
          <div className="search-box" style={{ 
            flex: '1', 
            minWidth: '200px',
            maxWidth: '500px', 
            position: 'relative' 
          }}>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.5rem',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '0.875rem'
              }}
            />
            <Search style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={18} />
          </div>
          <button 
            className="filter-button"
            onClick={toggleFilters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#fff',
              color: '#64748b',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            <Filter size={18} />
            <span>Filter</span>
          </button>
          <select 
            className="sort-dropdown"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#fff',
              color: '#64748b',
              fontSize: '0.875rem',
              cursor: 'pointer',
              minWidth: '140px'
            }}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="recent">Recent Activity</option>
            <option value="progress">Progress</option>
          </select>
          <button 
            className="add-student-button"
            onClick={() => {
              setShowAddStudentModal(true);
              setSelectedStudent(null);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '6px',
              backgroundColor: '#22c55e',
              color: '#fff',
              border: 'none',
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            <Plus size={18} />
            Add Student
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label>Grade Level:</label>
            <select 
              value={selectedGrade} 
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="all">All Grades</option>
              <option value="3">Grade 3</option>
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
              <option value="6">Grade 6</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <button 
            className="clear-filters-button"
            onClick={() => {
              setSelectedGrade('all');
              setSelectedStatus('all');
              setSearchTerm('');
            }}
          >
            Clear Filters
          </button>
        </div>
      )}

      <div className="students-table-container">
        <table className="students-table">
          <thead>
            <tr>
              <th>ID Number</th>
              <th>Student Name</th>
              <th>Grade Level</th>
              <th>Section</th>
              <th>View Profile</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((student) => (
              <tr key={student._id}>
                <td>{student.idNumber}</td>
                <td className="student-name">{`${student.firstName} ${student.lastName}`}</td>
                <td>{student.gradeLevel}</td>
                <td>{student.section}</td>
                <td>
                  <button 
                    className="students-page-view-btn"
                    onClick={() => handleViewProfile(student)}
                  >
                    View Profile
                  </button>
                </td>
                <td className="literexia-teacher-actions">
                  <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      className="edit-button"
                      onClick={() => handleEditStudent(student)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #e2e8f0',
                        background: '#f8fafc',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteConfirmation(student)}
                      style={{
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #fecaca',
                        background: '#fef2f2',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ef4444',
                        transition: 'all 0.2s'
                      }}
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

      {filteredStudents.length > studentsPerPage && (
        <div className="pagination">
          <button 
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`page-number ${currentPage === number ? 'active' : ''}`}
              >
                {number}
              </button>
            ))}
          </div>
          <button 
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}

      <div className="student-insights">
        <h2>Quick Insights</h2>
        <div className="insights-cards">
          <div className="insight-card">
            <div className="insight-icon">
              <BookOpen size={24} />
            </div>
            <div className="insight-content">
              <h3>Reading Progress</h3>
              <p>Average books read: {Math.round(students.reduce((acc, student) => acc + student.booksRead, 0) / students.length)}</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">
              <Book size={24} />
            </div>
            <div className="insight-content">
              <h3>Activity Completion</h3>
              <p>Average completed: {Math.round(students.reduce((acc, student) => acc + student.assignmentsCompleted, 0) / students.length)}</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">
              <Clock size={24} />
            </div>
            <div className="insight-content">
              <h3>Activity Status</h3>
              <p>{students.filter(s => s.status === 'active').length} active in the last 7 days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Student Profile Modal */}
      {showProfileModal && selectedStudent && (
        <div className="literexia-teacher-modal-overlay">
          <div className="literexia-teacher-modal">
            <div className="literexia-teacher-modal-header">
              <h2>Student Profile</h2>
              <button 
                className="literexia-teacher-modal-close"
                onClick={() => setShowProfileModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="literexia-teacher-modal-content">
              <div className="profile-header">
                <div className="profile-avatar">
                  {selectedStudent.profileImageUrl ? (
                    <img 
                      src={selectedStudent.profileImageUrl} 
                      alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                      className="profile-image"
                    />
                  ) : (
                    <User size={64} />
                  )}
                </div>
                <h3 className="profile-name">
                  {`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                </h3>
              </div>

              <div className="profile-info">
                <div className="profile-info-item">
                  <span className="info-label">ID Number:</span>
                  <span className="info-value">{selectedStudent.idNumber}</span>
                </div>

                <div className="profile-info-item">
                  <span className="info-label">Age:</span>
                  <span className="info-value">{selectedStudent.age}</span>
                </div>

                <div className="profile-info-item">
                  <span className="info-label">Gender:</span>
                  <span className="info-value">{selectedStudent.gender}</span>
                </div>

                <div className="profile-info-item">
                  <span className="info-label">Grade Level:</span>
                  <span className="info-value">{selectedStudent.gradeLevel}</span>
                </div>

                <div className="profile-info-item">
                  <span className="info-label">Section:</span>
                  <span className="info-value">{selectedStudent.section}</span>
                </div>

                <div className="profile-info-item">
                  <span className="info-label">Address:</span>
                  <span className="info-value">{selectedStudent.address}</span>
                </div>

                <div className="profile-info-item">
                  <span className="info-label">Reading Level:</span>
                  <span className="info-value">{selectedStudent.readingLevel || 'Not Assessed'}</span>
                </div>

                <div className="profile-info-item">
                  <span className="info-label">Reading %:</span>
                  <span className="info-value">{selectedStudent.readingPercentage != null ? selectedStudent.readingPercentage + '%' : 'N/A'}</span>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  className="close-btn"
                  onClick={() => setShowProfileModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <AddEditStudentModal
          student={null}
          onClose={() => setShowAddStudentModal(false)}
          onSave={handleAddStudent}
        />
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && selectedStudent && (
        <AddEditStudentModal
          student={selectedStudent}
          onClose={() => {
            setShowEditStudentModal(false);
            setSelectedStudent(null);
          }}
          onSave={handleEditStudent}
        />
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDeleteModal && selectedStudent && (
        <div className="literexia-teacher-modal-overlay">
          <div className="literexia-teacher-modal">
            <div className="literexia-teacher-modal-header">
              <h2>Confirm Delete</h2>
              <button className="literexia-teacher-modal-close" onClick={() => setShowConfirmDeleteModal(false)}>×</button>
            </div>
            <div className="literexia-teacher-modal-form">
              <p>Are you sure you want to delete this student?</p>
              <div className="literexia-teacher-modal-footer">
                <button className="literexia-teacher-cancel-btn" onClick={() => setShowConfirmDeleteModal(false)}>Cancel</button>
                <button className="literexia-teacher-confirm-delete-btn" onClick={() => { deleteStudent(selectedStudent._id); setShowConfirmDeleteModal(false); }}>Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <SuccessModal message={successMessage} onClose={() => setShowSuccessModal(false)} />
      )}
      {validationError && (
        <ValidationErrorModal message={validationError} onClose={() => setValidationError('')} />
      )}
    </div>
  );
};

export default StudentListPage;