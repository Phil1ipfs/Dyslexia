import React from 'react';
import {
  FaUser,
  FaIdCard,
  FaUserGraduate,
  FaBookReader,
  FaMale,
  FaFemale
} from 'react-icons/fa';
import './professional-styles.css';
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
        return 'reading-level-early';
      case 'developing':
        return 'reading-level-developing';
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
    <div className="reader-card reader-student-card">
      {/* header: avatar + name/id */}
      <div className="reader-student-header">
        <div className="reader-avatar">
          <div className="reader-avatar-circle">
            <S3Image 
              src={student.profileImageUrl}
              alt={getFullName(student)}
              fallbackText={getInitials(getFullName(student))}
              className="reader-avatar-image"
            />
          </div>
        </div>
        <div className="reader-student-name-section">
          <h2 className="reader-student-name">{getFullName(student)}</h2>
          <span className="reader-student-id">
            <FaIdCard /> ID: {student.idNumber || student.id || ''}
          </span>
        </div>
      </div>
      {/* core details */}
      <div className="reader-student-details">
        <div className="reader-detail-row">
          <div className="reader-detail-item">
            <div className="reader-detail-icon">
              <FaUser />
            </div>
            <div className="reader-detail-content">
              <span className="reader-detail-label">Age</span>
              <span className="reader-detail-value">
                {student.age} years old
              </span>
            </div>
          </div>
          <div className="reader-detail-item">
            <div className="reader-detail-icon">
              <FaUserGraduate />
            </div>
            <div className="reader-detail-content">
              <span className="reader-detail-label">Grade</span>
              <span className="reader-detail-value">
                {student.gradeLevel}
              </span>
            </div>
          </div>
        </div>
        <div className="reader-detail-row">
          <div className="reader-detail-item">
            <div className="reader-detail-icon">
              {student.gender && student.gender.toLowerCase() === 'female' ? <FaFemale /> : <FaMale />}
            </div>
            <div className="reader-detail-content">
              <span className="reader-detail-label">Gender</span>
              <span className="reader-detail-value">
                {student.gender || 'Not specified'}
              </span>
            </div>
          </div>
          <div className={`reader-detail-item ${readingLevelClass}`}>
            <div className="reader-detail-icon">
              <FaBookReader />
            </div>
            <div className="reader-detail-content">
              <span className="reader-detail-label">Reading Level</span>
              <span className="reader-detail-value">
                {student.readingLevel || 'Not Assessed'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfileCard;