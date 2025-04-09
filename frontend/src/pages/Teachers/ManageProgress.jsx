import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaAngleLeft, FaAngleRight } from "react-icons/fa";
import "../../css/Teachers/manageProgress.css";

// ======= OOP-Style Class & Extended Mock Data ===========
class StudentProgress {
    constructor({
        id,
        name,
        gradeLevel,
        readingLevel,
        activitiesCompleted,
        totalActivities,
        recentActivity,
    }) {
        this.id = id;
        this.name = name;
        this.gradeLevel = gradeLevel;
        this.readingLevel = readingLevel;
        this.activitiesCompleted = activitiesCompleted;
        this.totalActivities = totalActivities;
        this.recentActivity = recentActivity; // Most recent taken activity
    }
}

// ======= Comprehensive Mock Data ===========
const mockData = [
    new StudentProgress({
        id: "101",
        name: "Juan dela Cruz",
        gradeLevel: "Grade 3",
        readingLevel: "Antas 2",
        activitiesCompleted: 15,
        totalActivities: 20,
        recentActivity: "Phonics A",
    }),
    new StudentProgress({
        id: "102",
        name: "Maria Santos",
        gradeLevel: "Grade 2",
        readingLevel: "Antas 1",
        activitiesCompleted: 10,
        totalActivities: 16,
        recentActivity: "Alphabet Test",
    }),
    new StudentProgress({
        id: "103",
        name: "Pedro Ramirez",
        gradeLevel: "Grade 3",
        readingLevel: "Antas 2",
        activitiesCompleted: 28,
        totalActivities: 30,
        recentActivity: "Comprehension Set B",
    }),
    new StudentProgress({
        id: "104",
        name: "Isabella Cruz",
        gradeLevel: "Grade 1",
        readingLevel: "Antas 1",
        activitiesCompleted: 12,
        totalActivities: 15,
        recentActivity: "Letter Matching",
    }),
    new StudentProgress({
        id: "105",
        name: "Luis Mendoza",
        gradeLevel: "Grade 2",
        readingLevel: "Antas 2",
        activitiesCompleted: 8,
        totalActivities: 16,
        recentActivity: "Word Recognition",
    }),
    new StudentProgress({
        id: "106",
        name: "Sophia Reyes",
        gradeLevel: "Grade 3",
        readingLevel: "Antas 3",
        activitiesCompleted: 22,
        totalActivities: 25,
        recentActivity: "Critical Text Analysis",
    }),

    // Add more mock items to test multi-page:
    new StudentProgress({
        id: "107",
        name: "Miguel Pascual",
        gradeLevel: "Grade 2",
        readingLevel: "Antas 1",
        activitiesCompleted: 5,
        totalActivities: 10,
        recentActivity: "Syllable Drills",
    }),
    new StudentProgress({
        id: "108",
        name: "Anne Marquez",
        gradeLevel: "Grade 1",
        readingLevel: "Antas 1",
        activitiesCompleted: 9,
        totalActivities: 12,
        recentActivity: "Rhyming Words",
    }),
    new StudentProgress({
        id: "109",
        name: "Josefina Cruz",
        gradeLevel: "Grade 3",
        readingLevel: "Antas 2",
        activitiesCompleted: 18,
        totalActivities: 20,
        recentActivity: "Reading Comprehension 2",
    }),
    new StudentProgress({
        id: "110",
        name: "Diana Santos",
        gradeLevel: "Grade 3",
        readingLevel: "Antas 3",
        activitiesCompleted: 25,
        totalActivities: 30,
        recentActivity: "Spelling Test",
    }),
];

// ======= Utility for pagination range (like "04 05 06 07 ...") ===========
function getPageNumbers(currentPage, totalPages) {
    // For simplicity, we'll show up to 7 numbers total (including first & last).
    // Adjust logic to your preference for more advanced "..." usage.
    const visiblePageCount = 7;
    let startPage = Math.max(currentPage - 3, 1);
    let endPage = startPage + visiblePageCount - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(endPage - visiblePageCount + 1, 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    return pages;
}

// ============================================
const ManageProgress = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);

    // Filters
    const [search, setSearch] = useState("");
    const [gradeFilter, setGradeFilter] = useState("All");
    const [readingFilter, setReadingFilter] = useState("All");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4; // adjust items per page

    useEffect(() => {
        // Replace with real fetch/ MongoDB call
        setStudents(mockData);
    }, []);

    // Filtering logic
    const filtered = students.filter((s) => {
        const nameMatch = s.name.toLowerCase().includes(search.toLowerCase());
        const gradeMatch = gradeFilter === "All" || s.gradeLevel === gradeFilter;
        const readingMatch = readingFilter === "All" || s.readingLevel === readingFilter;
        return nameMatch && gradeMatch && readingMatch;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    // On filter change, reset to page 1
    useEffect(() => {
        setCurrentPage(1);
    }, [search, gradeFilter, readingFilter]);

    // Sliced items for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = filtered.slice(startIndex, startIndex + itemsPerPage);

    const handleViewDetails = (student) => {
        // Include debugging
        console.log("Navigating to student:", student.id, student);
        navigate(`/teacher/student-progress/${student.id}`, { state: student });
    };

    // Pagination handlers
    const handlePrev = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };
    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };
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
                                        <td>
                                            {s.activitiesCompleted} / {s.totalActivities}
                                        </td>
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
                                    <td colSpan="6" className="no-data">
                                        No matching student data found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Fancy Pagination */}
                {totalPages > 1 && (
                    <div className="custom-pagination">
                        <button
                            className="custom-pagination__arrow"
                            onClick={handlePrev}
                            disabled={currentPage === 1}
                        >
                            <FaAngleLeft />
                            <span>Prev</span>
                        </button>

                        {pagesToShow.map((page) => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={
                                    page === currentPage
                                        ? "custom-pagination__page custom-pagination__page--active"
                                        : "custom-pagination__page"
                                }
                            >
                                {page < 10 ? `0${page}` : page}
                            </button>
                        ))}

                        <button
                            className="custom-pagination__arrow"
                            onClick={handleNext}
                            disabled={currentPage === totalPages}
                        >
                            <span>Next</span>
                            <FaAngleRight />
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
