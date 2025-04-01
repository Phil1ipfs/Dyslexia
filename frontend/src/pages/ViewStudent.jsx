import React, { useState } from 'react';
import '../css/ViewStudent.css';
import { FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';



const mockData = [
  {
    id: 1,
    name: 'Isabella Cruz',
    parent: 'Maricel & Ramon Cruz',
    studentID: '03223123120',
    readingLevel: 'A',
    grade: 'K',
    age: 5,
    lastActivity: 'Apr 1, 2025',
    readingPerformance: 45,
    activitiesCompleted: 10,
    totalActivities: 20,
    progressCharts: [
      { title: 'Letter Identification', type: 'bar', desc: 'Knows 18 out of 28 letters' },
      { title: 'Sound Recognition', type: 'line', desc: 'Improved from 30% to 50%' },
      { title: 'Activity Completion', type: 'donut', desc: '50% Completed' }
    ],
    activities: [
      { title: 'Letter Matching A–Z', time: 'Apr 1, 2025, 9:00AM', score: 40 },
      { title: 'Sound Recognition (M)', time: 'Mar 30, 2025, 10:30AM', score: 50 }
    ],
    feedbackHistory: [
      { date: 'Mar 29, 2025', message: 'Improving on letter sounds' }
    ],
    contact: '+63 912 222 3344',
    email: 'cruz_family@email.com',
    siblings: [
      { name: 'Miguel Cruz', grade: 2, id: '03223123126', age: 7, readingLevel: 'B' }
    ]

  },
  {
    id: 2,
    name: 'Luis Ramirez',
    parent: 'Ana Ramirez',
    studentID: '03223123121',
    readingLevel: 'B',
    grade: 1,
    age: 6,
    lastActivity: 'Mar 29, 2025',
    readingPerformance: 60,
    activitiesCompleted: 14,
    totalActivities: 20,
    progressCharts: [
      { title: 'Sight Word Fluency', type: 'bar', desc: 'Reads 30 sight words correctly' },
      { title: 'Sentence Completion', type: 'line', desc: '85% accuracy' },
      { title: 'Activity Rate', type: 'donut', desc: '70% Completed' }
    ],
    activities: [
      { title: 'Sight Word Matching', time: 'Mar 29, 2025, 10:00AM', score: 60 }
    ],
    feedbackHistory: [
      { date: 'Mar 25, 2025', message: 'Struggles with sentence endings' }
    ],
    contact: '+63 913 333 1234',
    email: 'ramirez_family@email.com',
    siblings: [
      { name: 'Lucia Ramirez', grade: 3, id: '03223123127', age: 9, readingLevel: 'D' }
    ]
  },
  {
    id: 3,
    name: 'Juan Carlos Dela Rosa',
    parent: 'Nina & Carlos Dela Rosa',
    studentID: '03223123130',
    readingLevel: 'D',
    grade: 3,
    age: 9,
    lastActivity: 'Apr 2, 2025',
    readingPerformance: 88,
    activitiesCompleted: 28,
    totalActivities: 30,
    progressCharts: [
      { title: 'Story Sequencing', type: 'line', desc: 'Sequencing skills 88%' },
      { title: 'Inference & Summary', type: 'bar', desc: 'Makes accurate summaries' },
      { title: 'Completion Rate', type: 'donut', desc: '93% Completed' }
    ],
    activities: [
      { title: 'Summarizing a Paragraph', time: 'Apr 2, 2025, 8:00AM', score: 88 }
    ],
    feedbackHistory: [],
    contact: '+63 922 334 5678',
    email: 'delarosa_family@email.com',
    siblings: [
      { name: 'Maria Dela Rosa', grade: 2, id: '03223123131', age: 8, readingLevel: 'C' }
    ]
  },
  {
    id: 4,
    name: 'Kit Nicholas T. Santiago',
    parent: 'Teresa & Roberto Santiago',
    studentID: '03223123122',
    readingLevel: 'C',
    grade: 2,
    age: 8,
    lastActivity: 'Feb 28, 2025',
    readingPerformance: 72,
    activitiesCompleted: 24,
    totalActivities: 30,
    progressCharts: [
      { title: 'Reading Comprehension Score', type: 'line', desc: 'From 65% to 78% in 3 weeks' },
      { title: 'Word Recognition Accuracy', type: 'bar', desc: 'Weekly Pattern Accuracy' },
      { title: 'Activity Completion Rate', type: 'donut', desc: '76% Completed' }
    ],
    activities: [
      { title: 'Talata: Pangunahing Ideya', time: 'Apr 2, 2025, 9:00AM', score: 78 },
      { title: 'Pagkilala sa Detalye', time: 'Apr 1, 2025, 10:15AM', score: 84 },
      { title: 'Paggamit ng Konteksto', time: 'Mar 31, 2025, 1:30PM', score: 67 },
      { title: 'Pagbuo ng Pangungusap', time: 'Mar 30, 2025, 2:00PM', score: 72 }
    ],
    feedbackHistory: [
      { date: 'March 25, 2025', message: 'Kit improved in paragraph comprehension.' },
      { date: 'March 20, 2025', message: 'Struggles with context clues—needs support.' }
    ],
    contact: '+63 912 345 6789',
    email: 'santiago_family@email.com',
    siblings: [
      { name: 'Anna Santiago', grade: 3, id: '03223123125', age: 9, readingLevel: 'D' }
    ]

  },
  {
    id: 5,
    name: 'Sophia Reyes',
    parent: 'Ana Reyes',
    studentID: '03223123129',
    readingLevel: 'E',
    grade: 3,
    age: 9,
    lastActivity: 'Mar 25, 2025',
    readingPerformance: 90,
    activitiesCompleted: 27,
    totalActivities: 30,
    progressCharts: [
      { title: 'Critical Text Analysis', type: 'line', desc: 'Analyzes writer’s intent' },
      { title: 'Fact vs Opinion', type: 'bar', desc: 'Identifies biased content' },
      { title: 'Activity Completion Rate', type: 'donut', desc: '90% Completed' }
    ],
    activities: [
      { title: 'Analyzing Bias', time: 'Apr 2, 2025, 8:00AM', score: 91 },
      { title: 'Fact vs Opinion', time: 'Apr 1, 2025, 9:30AM', score: 89 }
    ],
    feedbackHistory: [
      { date: 'Mar 28, 2025', message: 'Sophia excels in text analysis.' }
    ],
    contact: '+63 923 456 7890',
    email: 'reyes_family@email.com',
    siblings: [
      { name: 'Mateo Reyes', grade: 2, id: '03223123132', age: 8, readingLevel: 'C' }
    ]

  }
];

const readingLevelLabels = {
  A: 'Antas Uno',
  B: 'Antas Dalawa',
  C: 'Antas Tatlo',
  D: 'Antas Apat',
  E: 'Antas Lima'
};

const ViewStudent = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [readingFilter, setReadingFilter] = useState('All');
  const [groupBy, setGroupBy] = useState('family');
  const [isTableView, setIsTableView] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = (e) => setSearch(e.target.value.toLowerCase());
  const handleReadingFilter = (e) => setReadingFilter(e.target.value);
  const handleGroupChange = (e) => setGroupBy(e.target.value);
  const toggleView = () => setIsTableView(prev => !prev);

  const groupByKey = (data, keyFn) => {
    return data.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  };

  const filtered = mockData
    .filter(s =>
      s.name.toLowerCase().includes(search) || s.parent.toLowerCase().includes(search)
    )
    .filter(s => readingFilter === 'All' || s.readingLevel === readingFilter);

  const grouped = groupBy !== 'none'
    ? groupByKey(filtered, s =>
      groupBy === 'family'
        ? s.name.split(' ').slice(-1)[0]
        : groupBy === 'parent'
          ? s.parent
          : s.name.split(' ')[0]
    )
    : { All: filtered };

  const handleViewDetails = (student) => {
    navigate(`/student-details/${student.id}`, { state: { student } });
  };

  return (
    <div className="view-student-container">
      {/* Header */}
      <div className="view-student-header">
        <div className="header-left">
          <h1>Student Viewer</h1>
          <p className="subtext">Group students for easier review and comparison.</p>
        </div>
        <div className="header-right">
          <h4>Cradle of Learners Inc. Teacher</h4>
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

      {/* Filters */}
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
          <span>{isTableView ? 'Table' : 'Text'}</span>
        </div>
      </div>

      {/* Conditionally Render View */}
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
                  {groupBy !== 'name' && group !== 'All' && (
                    <tr className="group-row">
                      <td colSpan="6">Group: {group}</td>
                    </tr>
                  )}
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.name}</td>
                      <td>{s.parent}</td>
                      <td>{s.studentID}</td>
                      <td>{readingLevelLabels[s.readingLevel]}</td>
                      <td>
                        <button className="view-btn" onClick={() => handleViewDetails(s)}>View Details</button>
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
              {groupBy !== 'name' && group !== 'All' && (
                <p className="text-group-label">Group: {group}</p>
              )}
              {students.map((s) => (
                <p key={s.id} className="text-row">
                  <strong>{s.name}</strong> | Parent: {s.parent} | ID: {s.studentID} | Antas: {readingLevelLabels[s.readingLevel]}
                </p>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewStudent;