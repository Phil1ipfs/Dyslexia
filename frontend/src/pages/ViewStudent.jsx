import React, { useState } from 'react';
import '../css/ViewStudent/ViewStudent.css';
import { FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const mockData = [
  { id: 1, name: 'Marco Santos', parent: 'Maria & Juan Santos', studentID: '03223123126', readingLevel: 'A' },
  { id: 2, name: 'Sophia Santos', parent: 'Maria & Juan Santos', studentID: '03223123127', readingLevel: 'B' },
  { id: 3, name: 'Luis Reyes', parent: 'Ana Reyes', studentID: '03223123128', readingLevel: 'A' },
  { id: 4, name: 'Kit Nicholas T. Santiago', parent: 'Teresa & Roberto Santiago', studentID: '03223123122', readingLevel: 'C' },
  { id: 5, name: 'Anna Santiago', parent: 'Teresa & Roberto Santiago', studentID: '03223123125', readingLevel: 'C' }
];

const readingLevelLabels = {
  A: 'Antas Uno',
  B: 'Antas Dalawa',
  C: 'Antas Tatlo',
  D: 'Antas Apat',
  E: 'Antas Lima'
};

const ViewStudent = () => {
  const [search, setSearch] = useState('');
  const [readingFilter, setReadingFilter] = useState('All');
  const [groupBy, setGroupBy] = useState('family');
  const [currentPage, setCurrentPage] = useState(1);
  const [isTableView, setIsTableView] = useState(true);

  const handleSearch = (e) => setSearch(e.target.value.toLowerCase());
  const handleReadingFilter = (e) => setReadingFilter(e.target.value);
  const handleGroupChange = (e) => setGroupBy(e.target.value);
  const toggleView = () => setIsTableView(prev => !prev);

  const filtered = mockData
    .filter(s =>
      s.name.toLowerCase().includes(search) || s.parent.toLowerCase().includes(search)
    )
    .filter(s => readingFilter === 'All' || s.readingLevel === readingFilter);

  const showGrouped = groupBy !== 'none' && groupBy !== 'name';
  const grouped = showGrouped
    ? groupBy === 'family'
      ? groupByKey(filtered, s => s.name.split(' ').slice(-1)[0])
      : groupBy === 'parent'
        ? groupByKey(filtered, s => s.parent)
        : { All: filtered }
    : { All: filtered };

  function groupByKey(data, keyFn) {
    return data.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }

  const handlePageSelect = (n) => setCurrentPage(n);
  const handlePrevPage = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage(p => p + 1);
  const [showDropdown, setShowDropdown] = useState(false);


  return (
    <div className="view-student-container">
      <div className="view-student-header">
        <div className="header-left">
          <h1>Student Viewer</h1>
          <p className="subtext">Group students for easier review and comparison.</p>
        </div>

        <div className="header-right">
          <div className="teacher-name">Cradle of Learners Inc.</div>
          <div className="teacher-profile-wrapper">
            <div className="teacher-avatar" onClick={() => setShowDropdown(prev => !prev)}>TC</div>
            {showDropdown && (
              <div className="profile-dropdown">
                <div className="dropdown-item">My Profile</div>
                <div className="dropdown-item" onClick={() => alert('Logging out...')}>Logout</div>
              </div>
            )}
          </div>
        </div>
      </div>


      <div className="view-student-filters">
        <div className="search-wrapper">
          <FaSearch className="search-inline-icon" />
          <input
            type="text"
            placeholder="Search student or parent"
            value={search}
            onChange={handleSearch}
          />
        </div>

        <select value={readingFilter} onChange={handleReadingFilter}>
          <option value="All">Antas ng Pagbasa</option>
          <option value="A">Antas Uno</option>
          <option value="B">Antas Dalawa</option>
          <option value="C">Antas Tatlo</option>
          <option value="D">Antas Apat</option>
          <option value="E">Antas Lima</option>
        </select>

        <select value={groupBy} onChange={handleGroupChange}>
          <option value="family">Group by Family</option>
          <option value="parent">Group by Parent</option>
          <option value="name">Group by First Name</option>
          <option value="none">No Grouping</option>
        </select>

        <div className={`toggle-switch ${isTableView ? 'active' : ''}`} onClick={toggleView}>
          <div className="circle" />
          <span>Table</span>
        </div>
      </div>

      {isTableView ? (
        <div className="view-student-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Parent</th>
                <th>Student ID</th>
                <th>Reading Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([group, students]) => (
                <React.Fragment key={group}>
                  {group !== 'All' && (
                    <tr className="group-row">
                      <td colSpan="6">Group: {group}</td>
                    </tr>
                  )}
                  {students.map(s => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.name}</td>
                      <td>{s.parent}</td>
                      <td>{s.studentID}</td>
                      <td>{readingLevelLabels[s.readingLevel] || s.readingLevel}</td>
                      <td>
                        <button className="view-btn" onClick={() => alert(`Viewing ${s.name}`)}>View Details</button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-list-view">
          {Object.entries(grouped).map(([group, students]) => (
            <React.Fragment key={group}>
              {group !== 'All' && <p className="text-group-label">Group: {group}</p>}
              {students.map(s => (
                <p key={s.id} className="text-row">
                  <strong>{s.name}</strong> | Parent: {s.parent} | ID: {s.studentID} | Antas: {readingLevelLabels[s.readingLevel]}
                </p>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}

      <div className="pagination">
        <button onClick={handlePrevPage} className="pagination-nav">
          <FaChevronLeft /> <span>Previous</span>
        </button>

        {[1, 2, 3].map(n => (
          <button
            key={n}
            onClick={() => handlePageSelect(n)}
            className={n === currentPage ? 'active' : ''}
          >
            {n}
          </button>
        ))}

        <span className="dots">...</span>

        <button onClick={() => handlePageSelect(8)}>8</button>

        <button onClick={handleNextPage} className="pagination-nav">
          <span>Next</span> <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default ViewStudent;
