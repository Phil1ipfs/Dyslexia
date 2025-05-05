import React from 'react';
import {
  FaUser,
  FaIdCard,
  FaUserGraduate,
  FaBookReader
} from 'react-icons/fa';
import '../ManageProgress/css/StudentProfileCard.css';

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

  const getGradeInFilipino = (gradeLevel = '') => {
    switch (gradeLevel) {
      case 'Kindergarten':
        return 'Kindergarten';
      case 'Grade 1':
        return 'Ika-1 Baitang';
      case 'Grade 2':
        return 'Ika-2 Baitang';
      case 'Grade 3':
        return 'Ika-3 Baitang';
      default:
        return gradeLevel;
    }
  };

  const getGenderInFilipino = (gender = '') => {
    if (gender.toLowerCase() === 'male') return 'Lalaki';
    if (gender.toLowerCase() === 'female') return 'Babae';
    return 'Hindi Tinukoy';
  };

  /* ---------- render ---------- */
  return (
    <div className="literexia-student-card">
      {/* header: avatar + name/id */}
      <div className="literexia-student-header">
        <div className="literexia-avatar">
          <div className="literexia-avatar-circle">
            {getInitials(student.name)}
          </div>
        </div>

        <div className="literexia-student-name-section">
          <h2 className="literexia-student-name">{student.name}</h2>
          <span className="literexia-student-id">
            <FaIdCard /> ID: {student.id}
          </span>
        </div>
      </div>

      {/* core details */}
      <div className="literexia-student-details">
        <div className="literexia-detail-row">
          <div className="literexia-detail-item">
            <div className="literexia-detail-icon">
              <FaUser />
            </div>
            <div className="literexia-detail-content">
              <span className="literexia-detail-label">Edad</span>
              <span className="literexia-detail-value">
                {student.age} taong gulang
              </span>
            </div>
          </div>

          <div className="literexia-detail-item">
            <div className="literexia-detail-icon">
              <FaUserGraduate />
            </div>
            <div className="literexia-detail-content">
              <span className="literexia-detail-label">Baitang</span>
              <span className="literexia-detail-value">
                {getGradeInFilipino(student.gradeLevel)}
              </span>
            </div>
          </div>
        </div>

        <div className="literexia-detail-row">
          <div className="literexia-detail-item">
            <div className="literexia-detail-icon gender-icon">
              <FaUser />
            </div>
            <div className="literexia-detail-content">
              <span className="literexia-detail-label">Kasarian</span>
              <span className="literexia-detail-value">
                {getGenderInFilipino(student.gender)}
              </span>
            </div>
          </div>

          <div className="literexia-detail-item">
            <div className="literexia-detail-icon">
              <FaBookReader />
            </div>
            <div className="literexia-detail-content">
              <span className="literexia-detail-label">Antas ng Pagbasa</span>
              <span className="literexia-detail-value reading-level">
                {student.readingLevel || 'Hindi pa nasusuri'}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default StudentProfileCard;
