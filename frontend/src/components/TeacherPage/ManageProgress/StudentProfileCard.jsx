import React from 'react';
import {
  FaUser,
  FaIdCard,
  FaUserGraduate,
  FaBookReader,
  FaMale,
  FaFemale,
  FaUsers,
  FaMapMarkerAlt
} from 'react-icons/fa';
import '../ManageProgress/css/StudentProfileCard.css';
import S3Image from '../../S3Image';

const StudentProfileCard = ({ student }) => {
  if (!student) return null;
  
  /* ---------- helpers ---------- */
  const getInitials = (name = '') =>
    name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
   
  const getFullName = (student) => {
    // Check if first, middle, and last name exist
    if (student.firstName && student.lastName) {
      const middle = student.middleName ? `${student.middleName} ` : '';
      return `${student.firstName} ${middle}${student.lastName}`;
    }
    // Fallback to name if it exists
    return student.name || 'Student';
  };

  // Get CSS class for reading level
  const getReadingLevelClass = (level) => {
    if (!level || level === 'Not Assessed') return 'reading-level-not-assessed';
    
    switch(level?.toLowerCase()) {
      case 'early':
      case 'low emerging':
      case 'high emerging':
        return 'reading-level-early';
      
      case 'developing':
      case 'emergent':
        return 'reading-level-developing';
      
      case 'transitioning':
      case 'at grade level':
      case 'fluent':
        return 'reading-level-fluent';
      
      case 'advanced':
        return 'reading-level-advanced';
      
      default:
        return 'reading-level-not-assessed';
    }
  };
  
  // Get reading level class
  const readingLevelClass = getReadingLevelClass(student.readingLevel);
  
  /* ---------- render ---------- */
  return (
    <div className="student-profile-card">
      {/* header: avatar + name/id */}
      <div className="student-profile-header">
        <div className="student-profile-avatar">
          <div className="student-profile-avatar-circle">
            <S3Image 
              src={student.profileImageUrl}
              alt={getFullName(student)}
              fallbackText={getInitials(getFullName(student))}
              className="student-profile-avatar-image"
            />
          </div>
        </div>
        <div className="student-profile-name-section">
          <h2 className="student-profile-name">{getFullName(student)}</h2>
          <span className="student-profile-id">
            <FaIdCard /> ID: {student.idNumber || student.id || ''}
          </span>
        </div>
      </div>
      {/* core details */}
      <div className="student-profile-details">
        <div className="student-profile-detail-row">
          <div className="student-profile-detail-item">
            <div className="student-profile-detail-icon">
              <FaUser />
            </div>
            <div className="student-profile-detail-content">
              <span className="student-profile-detail-label">Age</span>
              <span className="student-profile-detail-value">
                {student.age} years old
              </span>
            </div>
          </div>
          <div className="student-profile-detail-item">
            <div className="student-profile-detail-icon">
              <FaUserGraduate />
            </div>
            <div className="student-profile-detail-content">
              <span className="student-profile-detail-label">Grade</span>
              <span className="student-profile-detail-value">
                {student.gradeLevel}
              </span>
            </div>
          </div>
        </div>
        <div className="student-profile-detail-row">
          <div className="student-profile-detail-item">
            <div className={`student-profile-detail-icon student-profile-gender-icon ${student.gender && student.gender.toLowerCase() === 'female' ? 'female-icon' : 'male-icon'}`}>
              {student.gender && student.gender.toLowerCase() === 'female' ? <FaFemale /> : <FaMale />}
            </div>
            <div className="student-profile-detail-content">
              <span className="student-profile-detail-label">Gender</span>
              <span className="student-profile-detail-value">
                {student.gender || 'Not specified'}
              </span>
            </div>
          </div>
          <div className="student-profile-detail-item">
            <div className="student-profile-detail-icon">
              <FaUsers />
            </div>
            <div className="student-profile-detail-content">
              <span className="student-profile-detail-label">Section</span>
              <span className="student-profile-detail-value">
                {student.section || 'Not Assigned'}
              </span>
            </div>
          </div>
        </div>
        <div className="student-profile-detail-row">
          <div className="student-profile-detail-item student-profile-address-item">
            <div className="student-profile-detail-icon">
              <FaMapMarkerAlt />
            </div>
            <div className="student-profile-detail-content">
              <span className="student-profile-detail-label">Address</span>
              <span className="student-profile-detail-value">
                {student.address || 'Not provided'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileCard;