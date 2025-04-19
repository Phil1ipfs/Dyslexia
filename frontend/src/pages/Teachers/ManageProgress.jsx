import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaAngleLeft, FaAngleRight } from "react-icons/fa";
import "../../css/Teachers/manageProgress.css";
import { mockStudentProgress } from "../../data/Teachers/studentProgress";

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
  const itemsPerPage = 4;

  useEffect(() => {
    setStudents(mockStudentProgress);
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

  return (
    <div className="manage-progress__container">
      <div className="manage-progress-page">
        <div className="manage-progress-header">
          <h1>Manage Student Progress</h1>
          <p>Monitor each student's progress and view recent activities in detail.</p>
        </div>

        <div className="progress-filters">
          <div className="search-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option value="All">All Grades</option>
            <option value="Kindergarden">Kindergarden</option>
            <option value="Grade 1">Grade 1</option>
            <option value="Grade 2">Grade 2</option>
            <option value="Grade 3">Grade 3</option>
          </select>
          <select value={readingFilter} onChange={(e) => setReadingFilter(e.target.value)}>
            <option value="All">All Reading Levels</option>
            <option value="Antas 1">Antas Uno</option>
            <option value="Antas 2">Antas Dalawa</option>
            <option value="Antas 3">Antas Tatlo</option>
            <option value="Antas 4">Antas Apat</option>
            <option value="Antas 5">Antas Lima</option>
          </select>
        </div>

        <div className="progress-table-wrapper">
          <table className="progress-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Grade</th>
                <th>Reading Level</th>
                <th>Activities Completed</th>
                <th>Recent Taken Activity</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length > 0 ? (
                currentItems.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.gradeLevel}</td>
                    <td>{s.readingLevel}</td>
                    <td>{s.activitiesCompleted} / {s.totalActivities}</td>
                    <td>{s.recentActivity}</td>
                    <td>
                      <button className="btn-details" onClick={() => handleViewDetails(s)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">No matching student data found.</td>
                </tr>
              )}
            </tbody>
          </table>
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

        <div className="sync-btn-wrapper">
          <button className="btn-sync" onClick={() => alert("Sync with MongoDB (Later)!")}>
            Sync with MongoDB (Later)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageProgress;
