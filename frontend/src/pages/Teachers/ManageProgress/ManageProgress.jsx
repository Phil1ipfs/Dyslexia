import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaAngleLeft,
  FaAngleRight,
  FaClipboardCheck,
  FaGraduationCap,
  FaBook,
  FaIdCard
} from "react-icons/fa";
import "../../../css/Teachers/manageProgress.css";
import { getStudentDetails, getPreAssessmentResults, getProgressData } from "../../../services/StudentService";

function getPageNumbers(currentPage, totalPages) {
  const visiblePageCount = 7;
  let startPage = Math.max(currentPage - 3, 1);
  let endPage = startPage + visiblePageCount - 1;
  
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(endPage - visiblePageCount + 1, 1);
  }
  
  return Array.from({ length: endPage - startPage + 1 }, (_, i) => i + startPage);
}

const ManageProgress = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");
  const [readingFilter, setReadingFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);
  const itemsPerPage = 5;
  
  // List of grade levels and reading levels from the student data
  const [gradeLevels, setGradeLevels] = useState([]);
  const [readingLevels, setReadingLevels] = useState([]);
 
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // In a real app, this would be a single API call to get a list of students
        // For this mockup, we'll simulate by combining student IDs
        const studentIds = ['101', '102', '103']; // Mock student IDs
        const studentDataPromises = studentIds.map(async (id) => {
          const studentDetails = await getStudentDetails(id);
          const assessmentResults = await getPreAssessmentResults(id);
          const progressData = await getProgressData(id);
          
          return {
            id: id,
            name: studentDetails.name || `Student ${id}`,
            gradeLevel: studentDetails.gradeLevel || `Grade ${Math.floor(Math.random() * 6) + 1}`,
            readingLevel: assessmentResults?.readingLevel || ["A", "B", "C", "D", "E", "F"][Math.floor(Math.random() * 6)],
            preAssessmentCompleted: !!assessmentResults,
            lastAssessment: assessmentResults?.assessmentDate || "Not completed",
            activitiesCompleted: progressData?.activitiesCompleted || Math.floor(Math.random() * 10),
            totalActivities: progressData?.totalActivities || 20,
            lrn: studentDetails.lrn || `LRN-${100000 + parseInt(id)}`
          };
        });
        
        const studentData = await Promise.all(studentDataPromises);
        setStudents(studentData);
        setTotalStudents(studentData.length);
        
        // Extract unique grade levels and reading levels for filters
        const uniqueGradeLevels = [...new Set(studentData.map(s => s.gradeLevel))];
        const uniqueReadingLevels = [...new Set(studentData.map(s => s.readingLevel).filter(level => level !== "Not assessed"))];
        setGradeLevels(uniqueGradeLevels);
        setReadingLevels(uniqueReadingLevels);
        
        setLoading(false);
      } catch (err) {
        setError("Failed to load student data");
        setLoading(false);
        console.error("Error fetching student data:", err);
      }
    };
    
    fetchStudents();
  }, []);

  const filtered = students.filter((s) => {
    const nameMatch = s.name.toLowerCase().includes(search.toLowerCase());
    const gradeMatch = gradeFilter === "All" || s.gradeLevel === gradeFilter;
    const readingMatch = readingFilter === "All" || s.readingLevel === readingFilter;
    return nameMatch && gradeMatch && readingMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handleViewDetails = (student) => {
    navigate(`/teacher/student-progress/${student.id}`, { state: student });
  };

  const handlePrev = () => currentPage > 1 && setCurrentPage(currentPage - 1);
  const handleNext = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const pagesToShow = getPageNumbers(currentPage, totalPages);

  const openPreAssessmentModal = (student) => {
    navigate(`/teacher/student-progress/${student.id}`, {
      state: { ...student, openAssessment: true }
    });
  };

  if (loading) {
    return (
      <div className="manage-progress__container">
        <div className="loading-state">
          <div className="loader"></div>
          <p>Loading student data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manage-progress__container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-progress__container">
      <div className="manage-progress-page">
        <div className="manage-progress-header">
          <h1>Manage Student Progress</h1>
          <p>Monitor each student's progress, conduct pre-assessments, and assign recommended activities.</p>
        </div>
        
        <div className="content-section">
          <div className="section-header">
            <h2>Student List</h2>
            <div className="progress-filters">
              <div className="search-wrapper">
                <FaSearch className="searchh-icon" />
                <input
                  type="text"
                  placeholder="Search student name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="filter-group">
                <div className="filter-item">
                  <FaGraduationCap className="filter-icon" />
                  <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
                    <option value="All">All Grades</option>
                    {gradeLevels.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="filter-item">
                  <FaBook className="filter-icon" />
                  <select value={readingFilter} onChange={(e) => setReadingFilter(e.target.value)}>
                    <option value="All">All Reading Levels</option>
                    {readingLevels.map((level) => (
                      <option key={level} value={level}>
                        Level {level}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="progress-table-wrapper">
            <table className="progress-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Grade</th>
                  <th>Reading Level</th>
                  <th>Pre-Assessment</th>
                  <th>Activities Progress</th>
                  <th><FaIdCard className="column-icon" /> LRN</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((student) => (
                    <tr key={student.id}>
                      <td className="student-name-cell">
                        <div className="student-avatar">
                          {student.name.charAt(0)}
                        </div>
                        <span>{student.name}</span>
                      </td>
                      <td>{student.gradeLevel}</td>
                      <td>
                        <div className="reading-level-badge">
                          {student.readingLevel}
                        </div>
                      </td>
                      <td>
                        {student.preAssessmentCompleted ? (
                          <span className="assessment-complete">
                            Completed
                          </span>
                        ) : (
                          <button
                            className="btn-assess"
                            onClick={() => openPreAssessmentModal(student)}
                          >
                            <FaClipboardCheck /> Assess
                          </button>
                        )}
                      </td>
                      <td>
                        <div className="progress-bar-container">
                          <span className="progress-text">
                            {student.activitiesCompleted} / {student.totalActivities}
                          </span>
                        </div>
                      </td>
                      <td className="lrn-cell">{student.lrn}</td>
                      <td className="actions-cell">
                        <button className="btn-details" onClick={() => handleViewDetails(student)}>
                          View Progress
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="no-data">No matching student data found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {filtered.length > 0 && (
            <div className="table-footer">
              <div className="pagination-info">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} students
              </div>
              {totalPages > 1 && (
                <div className="custom-pagination">
                  <button className="custom-pagination__arrow" onClick={handlePrev} disabled={currentPage === 1}>
                    <FaAngleLeft /><span>Prev</span>
                  </button>
                  {pagesToShow.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`custom-pagination__page ${page === currentPage ? "custom-pagination__page--active" : ""}`}
                    >
                      {page < 10 ? `0${page}` : page}
                    </button>
                  ))}
                  <button className="custom-pagination__arrow" onClick={handleNext} disabled={currentPage === totalPages}>
                    <span>Next</span><FaAngleRight />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageProgress;