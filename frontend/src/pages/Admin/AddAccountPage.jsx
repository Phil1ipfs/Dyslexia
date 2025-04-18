// src/pages/Admin/AddAccountPage.jsx
import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, UserPlus, Users, Search, Plus, X, Eye, EyeOff, UserCheck } from 'lucide-react';
import './AddAccountPage.css';

const AddAccountPage = () => {
  const [accountType, setAccountType] = useState('student');
  const [formData, setFormData] = useState({
    // Common fields
    firstName: '',
    lastName: '',
    status: 'active',
    
    // Student specific fields
    grade: '',
    generatedPassword: 'cradle of learners', // Default password
    showStudentPassword: false,

    // Teacher specific fields
    email: '',
    password: '',
    confirmPassword: '',
    subject: '',
    gradeLevel: '',

    // Parent specific fields
    parentName: '',
    parentEmail: '',
    parentPhone: '',
    parentPassword: '', // For parent account
    showParentPassword: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // For parent selection
  const [existingParents, setExistingParents] = useState([]);
  const [filteredParents, setFilteredParents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSelectingParent, setIsSelectingParent] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState(null);
  
  // For multiple students
  const [enrolledSiblings, setEnrolledSiblings] = useState([]);
  const [showSiblingsList, setShowSiblingsList] = useState(false);
  
  // State for credential delivery options
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
  const [credentialsData, setCredentialsData] = useState(null);
  
  // Handle go back
  const handleGoBack = () => {
    window.history.back();
  };

  // Load mock parents data
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

    setExistingParents(mockParents);
    setFilteredParents(mockParents);
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle account type change
  const handleAccountTypeChange = (type) => {
    setAccountType(type);
    // Reset any specific field errors when changing account type
    setErrors({});
    // Reset parent selection
    setSelectedParentId(null);
    setIsSelectingParent(false);
    // Reset enrolled siblings
    setEnrolledSiblings([]);
    setShowSiblingsList(false);
  };

  // Generate random password
  const generateRandomPassword = () => {
    const length = 8;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  // Toggle between default and random password
  const togglePasswordGeneration = () => {
    setFormData(prev => ({
      ...prev,
      generatedPassword: prev.generatedPassword === 'cradle of learners' 
        ? generateRandomPassword() 
        : 'cradle of learners'
    }));
  };

  // Generate parent password
  const generateParentPassword = () => {
    const parentPassword = generateRandomPassword();
    setFormData(prev => ({
      ...prev,
      parentPassword
    }));
  };

  // Search parents
  const handleParentSearch = (e) => {
    const searchValue = e.target.value;
    setSearchTerm(searchValue);
    
    if (searchValue.trim() === '') {
      setFilteredParents(existingParents);
    } else {
      const filtered = existingParents.filter(parent => 
        parent.name.toLowerCase().includes(searchValue.toLowerCase()) ||
        parent.email.toLowerCase().includes(searchValue.toLowerCase()) ||
        parent.phone.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredParents(filtered);
    }
  };

  // Select a parent
  const handleSelectParent = (parent) => {
    setSelectedParentId(parent.id);
    setFormData(prev => ({
      ...prev,
      parentName: parent.name,
      parentEmail: parent.email,
      parentPhone: parent.phone
    }));
    setIsSelectingParent(false);
    // Clear related errors
    if (errors.parentEmail) {
      setErrors(prev => ({
        ...prev,
        parentEmail: ''
      }));
    }
  };

  // Create new parent
  const handleCreateNewParent = () => {
    setIsSelectingParent(false);
    setSelectedParentId(null);
    // Generate parent password if it's not set
    if (!formData.parentPassword) {
      generateParentPassword();
    }
  };

  // Add another student
  const handleAddAnotherStudent = () => {
    // Save current student info
    const sibling = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      grade: formData.grade,
      password: formData.generatedPassword
    };
    
    // Add to siblings list
    setEnrolledSiblings([...enrolledSiblings, sibling]);
    
    // Clear student fields but keep parent info
    setFormData({
      ...formData,
      firstName: '',
      lastName: '',
      generatedPassword: 'cradle of learners'
    });
    
    // Show the siblings list
    setShowSiblingsList(true);
    
    // Clear any student-related errors
    setErrors({});
  };

  // Remove a sibling
  const handleRemoveSibling = (index) => {
    const updatedSiblings = [...enrolledSiblings];
    updatedSiblings.splice(index, 1);
    setEnrolledSiblings(updatedSiblings);
    
    // Hide the list if empty
    if (updatedSiblings.length === 0) {
      setShowSiblingsList(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    // Validate common fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    // Student specific validation
    if (accountType === 'student') {
      if (!formData.grade) newErrors.grade = 'Grade is required';
      
      // Validate parent information
      if (!formData.parentName.trim()) newErrors.parentName = 'Parent name is required';
      if (!formData.parentEmail.trim()) {
        newErrors.parentEmail = 'Parent email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.parentEmail)) {
        newErrors.parentEmail = 'Parent email is invalid';
      }
      if (!formData.parentPhone.trim()) newErrors.parentPhone = 'Parent phone is required';
      
      // Validate parent password if creating a new parent (not selecting an existing one)
      if (!selectedParentId && !formData.parentPassword) {
        newErrors.parentPassword = 'Parent password is required';
      }
    }
    
    // Validate teacher specific fields
    if (accountType === 'teacher') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.subject.trim()) newErrors.subject = 'Subject is required';
      if (!formData.gradeLevel) newErrors.gradeLevel = 'Grade level is required';
    }
    
    return newErrors;
  };

  // Create PDF account info
  const createAccountPDF = () => {
    // This would be implemented with a PDF generation library
    console.log("Creating PDF with account details");
    return "account_details.pdf";
  };

  // (Duplicate declaration removed)

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      // Prepare all accounts to be created
      let studentsToCreate = [];
      
      // Add previously enrolled siblings
      enrolledSiblings.forEach(sibling => {
        studentsToCreate.push({
          type: 'student',
          firstName: sibling.firstName,
          lastName: sibling.lastName,
          grade: sibling.grade,
          status: formData.status,
          password: sibling.password
        });
      });
      
      // Add current student
      if (accountType === 'student') {
        studentsToCreate.push({
          type: 'student',
          firstName: formData.firstName,
          lastName: formData.lastName,
          grade: formData.grade,
          status: formData.status,
          password: formData.generatedPassword
        });
        
        // Create parent account if it's a new parent
        const parentAccount = {
          id: selectedParentId, // Might be null for new parents
          name: formData.parentName,
          email: formData.parentEmail,
          phone: formData.parentPhone,
          password: selectedParentId ? null : formData.parentPassword, // Only set password for new parents
          children: [
            ...enrolledSiblings.map(s => `${s.firstName} ${s.lastName}`),
            `${formData.firstName} ${formData.lastName}`
          ]
        };
        
        console.log('Parent account created/updated:', parentAccount);
        console.log('Students created:', studentsToCreate);
      } else if (accountType === 'teacher') {
        const teacherAccount = {
          type: 'teacher',
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          subject: formData.subject,
          gradeLevel: formData.gradeLevel,
          status: formData.status
        };
        
        console.log('Teacher account created:', teacherAccount);
      }
      
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Set data for credential delivery options
      if (accountType === 'student') {
        // Store credentials for delivery options
        // This would normally happen server-side, but for demo purposes we'll store it in state
        setCredentialsData({
          parent: {
            name: formData.parentName,
            email: formData.parentEmail,
            password: selectedParentId ? "[existing account]" : formData.parentPassword
          },
          students: [
            ...enrolledSiblings.map(s => ({
              name: `${s.firstName} ${s.lastName}`,
              grade: s.grade,
              username: s.firstName,
              password: s.password
            })),
            {
              name: `${formData.firstName} ${formData.lastName}`,
              grade: formData.grade,
              username: formData.firstName,
              password: formData.generatedPassword
            }
          ]
        });
        
        // Show delivery options
        setShowDeliveryOptions(true);
      }
      
      // Reset form after successful submission (this happens after choosing delivery option)
    }, 1500);
  };

  // Send email to parent
  const sendParentEmail = () => {
    // This would be implemented with actual email service
    console.log(`Sending email to: ${formData.parentEmail}`);
    console.log(`Parent login credentials: Email: ${formData.parentEmail}, Password: ${formData.parentPassword || 'Existing account'}`);
    console.log(`Student accounts created:`, credentialsData.students);
    
    // In a real implementation, you would:
    // 1. Generate a PDF with all account details
    // 2. Send an email with the PDF attached
    
    setEmailSent(true);
    handleCloseDeliveryOptions();
  };
  
  // Generate PDF file
  const generatePDF = () => {
    // This would use a PDF generation library in a real implementation
    console.log("Generating PDF with account details...");
    
    // Simulate download process
    setTimeout(() => {
      console.log("PDF generated and downloaded!");
      alert("PDF file has been generated and downloaded!");
      handleCloseDeliveryOptions();
    }, 1000);
  };
  
  // Print credentials
  const printCredentials = () => {
    console.log("Printing credentials...");
    
    // In a real implementation, this would open a print dialog
    // For now, we'll just simulate it
    window.print();
    handleCloseDeliveryOptions();
  };
  
  // Close delivery options
  const handleCloseDeliveryOptions = () => {
    setShowDeliveryOptions(false);
    
    // Reset form after choosing delivery option
    setTimeout(() => {
      setSubmitSuccess(false);
      setEmailSent(false);
      setSelectedParentId(null);
      setEnrolledSiblings([]);
      setShowSiblingsList(false);
      setFormData({
        firstName: '',
        lastName: '',
        status: 'active',
        grade: '',
        generatedPassword: 'cradle of learners',
        showStudentPassword: false,
        email: '',
        password: '',
        confirmPassword: '',
        subject: '',
        gradeLevel: '',
        parentName: '',
        parentEmail: '',
        parentPhone: '',
        parentPassword: '',
        showParentPassword: false
      });
    }, 1000);
  };

  return (
    <div className="add-account-page">
      <div className="account-page-header">
        <button className="back-button" onClick={handleGoBack}>
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <h1 className="page-title">Add New Account</h1>
      </div>
      
      <div className="account-type-selector">
        <div 
          className={`account-type-option ${accountType === 'student' ? 'active' : ''}`}
          onClick={() => handleAccountTypeChange('student')}
        >
          <User size={20} />
          <span>Student</span>
        </div>
        <div 
          className={`account-type-option ${accountType === 'teacher' ? 'active' : ''}`}
          onClick={() => handleAccountTypeChange('teacher')}
        >
          <UserPlus size={20} />
          <span>Teacher</span>
        </div>
      </div>
      
      {/* Enrolled Siblings List */}
      {showSiblingsList && accountType === 'student' && enrolledSiblings.length > 0 && (
        <div className="enrolled-siblings-container">
          <h3 className="siblings-title">Students to be enrolled with this parent:</h3>
          <div className="siblings-list">
            {enrolledSiblings.map((sibling, index) => (
              <div className="sibling-item" key={index}>
                <div className="sibling-info">
                  <div className="sibling-name">
                    {sibling.firstName} {sibling.lastName}
                  </div>
                  <div className="sibling-details">
                    Grade {sibling.grade}
                  </div>
                </div>
                <button 
                  type="button"
                  className="remove-sibling-button"
                  onClick={() => handleRemoveSibling(index)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Delivery Options Modal */}
      {showDeliveryOptions && credentialsData && (
        <div className="credentials-delivery-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Account Created Successfully!</h3>
              <p>How would you like to send the account credentials?</p>
            </div>
            
            <div className="credentials-preview">
              <h4>Parent Account</h4>
              <div className="credential-item">
                <div><strong>Name:</strong> {credentialsData.parent.name}</div>
                <div><strong>Email (Login):</strong> {credentialsData.parent.email}</div>
                <div><strong>Password:</strong> {credentialsData.parent.password}</div>
              </div>
              
              <h4>Student Account(s)</h4>
              {credentialsData.students.map((student, index) => (
                <div className="credential-item" key={index}>
                  <div><strong>Name:</strong> {student.name}</div>
                  <div><strong>Grade:</strong> {student.grade}</div>
                  <div><strong>Username:</strong> {student.username}</div>
                  <div><strong>Password:</strong> {student.password}</div>
                </div>
              ))}
            </div>
            
            <div className="delivery-options">
              <button 
                type="button" 
                className="delivery-option-button email"
                onClick={sendParentEmail}
              >
                Send Email to Parent
              </button>
              <button 
                type="button" 
                className="delivery-option-button pdf"
                onClick={generatePDF}
              >
                Download as PDF
              </button>
              <button 
                type="button" 
                className="delivery-option-button print"
                onClick={printCredentials}
              >
                Print Credentials
              </button>
              <button 
                type="button" 
                className="delivery-option-button close"
                onClick={handleCloseDeliveryOptions}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="account-form-container">
        <form className="account-form" onSubmit={handleSubmit}>
          <h2 className="form-section-title">
            {accountType === 'student' ? 'Student Information' : 'Teacher Information'}
          </h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={errors.firstName ? 'input-error' : ''}
              />
              {errors.firstName && <div className="error-message">{errors.firstName}</div>}
              {accountType === 'student' && (
                <div className="help-text">Student will use this as username</div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={errors.lastName ? 'input-error' : ''}
              />
              {errors.lastName && <div className="error-message">{errors.lastName}</div>}
            </div>
          </div>
          
          {/* Student specific fields - simplified */}
          {accountType === 'student' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="grade">Grade</label>
                  <select
                    id="grade"
                    name="grade"
                    value={formData.grade}
                    onChange={handleInputChange}
                    className={errors.grade ? 'input-error' : ''}
                  >
                    <option value="">Select Grade</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                  </select>
                  {errors.grade && <div className="error-message">{errors.grade}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="generatedPassword">Generated Password</label>
                  <div className="password-field-container">
                    <div className="password-input-wrapper">
                      <input
                        type={formData.showStudentPassword ? "text" : "password"}
                        id="generatedPassword"
                        name="generatedPassword"
                        value={formData.generatedPassword}
                        readOnly
                        className="readonly-input"
                      />
                      <button 
                        type="button" 
                        className="toggle-password-button"
                        onClick={() => togglePasswordVisibility('showStudentPassword')}
                      >
                        {formData.showStudentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button 
                      type="button" 
                      className="generate-password-button"
                      onClick={togglePasswordGeneration}
                    >
                      Regenerate
                    </button>
                  </div>
                  <div className="help-text">Default password or click to generate random</div>
                </div>
              </div>
              
              {/* Parent section for student accounts */}
              <h2 className="form-section-title">Parent Information</h2>
              
              <div className="parent-selection-section">
                <div className="parent-actions">
                  <button
                    type="button"
                    className="select-parent-button"
                    onClick={() => setIsSelectingParent(!isSelectingParent)}
                  >
                    {selectedParentId ? 'Change Parent' : 'Select Existing Parent'}
                  </button>
                </div>

                {isSelectingParent && (
                  <div className="parent-selection-modal">
                    <div className="modal-header">
                      <h3>Select a Parent</h3>
                      <button 
                        type="button" 
                        className="close-modal-button"
                        onClick={() => setIsSelectingParent(false)}
                      >
                        <X size={20} />
                      </button>
                    </div>
                    
                    <div className="search-parent-section">
                      <div className="search-wrapper">
                        <Search className="search-icon" size={16} />
                        <input
                          type="text"
                          placeholder="Search parents by name, email, or phone..."
                          value={searchTerm}
                          onChange={handleParentSearch}
                          className="search-parent-input"
                        />
                      </div>
                    </div>
                    
                    <div className="parents-list">
                      {filteredParents.length === 0 ? (
                        <div className="no-parents-found">
                          No parents found matching your search.
                        </div>
                      ) : (
                        filteredParents.map(parent => (
                          <div 
                            className={`parent-item ${selectedParentId === parent.id ? 'selected' : ''}`}
                            key={parent.id}
                            onClick={() => handleSelectParent(parent)}
                          >
                            <div className="parent-details">
                              <div className="parent-name">{parent.name}</div>
                              <div className="parent-contact">
                                <span>{parent.email}</span>
                                <span className="separator">•</span>
                                <span>{parent.phone}</span>
                              </div>
                              {parent.children.length > 0 && (
                                <div className="parent-children">
                                  <span className="children-label">Children: </span>
                                  {parent.children.map((child, index) => (
                                    <span key={index} className="child-name">
                                      {child}{index < parent.children.length - 1 ? ', ' : ''}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="parent-selection-footer">
                      <button 
                        type="button" 
                        className="create-new-parent-button"
                        onClick={handleCreateNewParent}
                      >
                        <Plus size={16} />
                        <span>Create New Parent</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="parentName">Parent Name</label>
                  <input
                    type="text"
                    id="parentName"
                    name="parentName"
                    value={formData.parentName}
                    onChange={handleInputChange}
                    className={errors.parentName ? 'input-error' : ''}
                    disabled={selectedParentId !== null}
                  />
                  {errors.parentName && <div className="error-message">{errors.parentName}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="parentEmail">Parent Email (Login)</label>
                  <input
                    type="email"
                    id="parentEmail"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleInputChange}
                    className={errors.parentEmail ? 'input-error' : ''}
                    disabled={selectedParentId !== null}
                  />
                  {errors.parentEmail && <div className="error-message">{errors.parentEmail}</div>}
                  {!selectedParentId && <div className="help-text">This will be used as the parent login</div>}
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="parentPhone">Parent Phone</label>
                  <input
                    type="text"
                    id="parentPhone"
                    name="parentPhone"
                    value={formData.parentPhone}
                    onChange={handleInputChange}
                    className={errors.parentPhone ? 'input-error' : ''}
                    disabled={selectedParentId !== null}
                  />
                  {errors.parentPhone && <div className="error-message">{errors.parentPhone}</div>}
                </div>
                
                {!selectedParentId && (
                  <div className="form-group">
                    <label htmlFor="parentPassword">Parent Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={formData.showParentPassword ? "text" : "password"}
                        id="parentPassword"
                        name="parentPassword"
                        value={formData.parentPassword}
                        onChange={handleInputChange}
                        className={errors.parentPassword ? 'input-error' : ''}
                      />
                      <button 
                        type="button" 
                        className="toggle-password-button"
                        onClick={() => togglePasswordVisibility('showParentPassword')}
                      >
                        {formData.showParentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button 
                        type="button" 
                        className="generate-password-button small"
                        onClick={generateParentPassword}
                      >
                        Generate
                      </button>
                    </div>
                    {errors.parentPassword && <div className="error-message">{errors.parentPassword}</div>}
                    <div className="help-text">Password for parent login</div>
                  </div>
                )}
              </div>
              
              {/* Multiple students - Add another student button */}
              {!submitSuccess && (
                <div className="add-another-student-section">
                  <button 
                    type="button"
                    className="add-another-student-button"
                    onClick={handleAddAnotherStudent}
                    disabled={!formData.firstName || !formData.lastName || !formData.grade}
                  >
                    <UserCheck size={16} />
                    <span>Add This Student & Enroll Another</span>
                  </button>
                  <div className="help-text">Add current student to the list and enter another one</div>
                </div>
              )}
            </>
          )}
          
          {/* Teacher specific fields */}
          {accountType === 'teacher' && (
            <>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'input-error' : ''}
                  />
                  {errors.email && <div className="error-message">{errors.email}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={formData.showStudentPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={errors.password ? 'input-error' : ''}
                    />
                    <button 
                      type="button" 
                      className="toggle-password-button"
                      onClick={() => togglePasswordVisibility('showStudentPassword')}
                    >
                      {formData.showStudentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && <div className="error-message">{errors.password}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'input-error' : ''}
                  />
                  {errors.confirmPassword && <div className="error-message">{errors.confirmPassword}</div>}
                </div>
              </div>
              
              <h2 className="form-section-title">Teacher Details</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    className={errors.subject ? 'input-error' : ''}
                  />
                  {errors.subject && <div className="error-message">{errors.subject}</div>}
                </div>
                
                <div className="form-group">
                  <label htmlFor="gradeLevel">Grade Level</label>
                  <select
                    id="gradeLevel"
                    name="gradeLevel"
                    value={formData.gradeLevel}
                    onChange={handleInputChange}
                    className={errors.gradeLevel ? 'input-error' : ''}
                  >
                    <option value="">Select Grade Level</option>
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 1-2">Grade 1-2</option>
                    <option value="Grade 2-3">Grade 2-3</option>
                    <option value="Grade 1-3">Grade 1-3</option>
                  </select>
                  {errors.gradeLevel && <div className="error-message">{errors.gradeLevel}</div>}
                </div>
              </div>
            </>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleGoBack}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
          
          {submitSuccess && !showDeliveryOptions && (
            <div className="success-message">
              {accountType === 'student' ? (
                enrolledSiblings.length > 0 ? 
                `${enrolledSiblings.length + 1} student accounts created successfully!` :
                'Student account created successfully!'
              ) : 'Account created successfully!'}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddAccountPage;