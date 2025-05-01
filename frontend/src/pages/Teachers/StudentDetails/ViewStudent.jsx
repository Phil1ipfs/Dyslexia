import React, { useState } from 'react';
import '../../../css/Teachers/ViewStudent.css';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';


const ViewStudent = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [readingFilter, setReadingFilter] = useState('All');
  const [groupBy, setGroupBy] = useState('family');
  const [isTableView, setIsTableView] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [gradeFilter, setGradeFilter] = useState('All');


  // ===================
  //  STUDENT DATA HERE
  // ===================
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
        {
          title: 'Letter Matching A–Z',
          category: 'Alpabeto at Tunog',
          score: 4,
          total: 5,
          time: 'Apr 1, 2025, 9:00AM',
          questions: [
            { text: 'Ano ang tamang letra ng "aso"?', correct: true },
            { text: 'Ano ang tunog ng "ba"?', correct: false },
            { text: 'Ano ang titik para sa "gabi"?', correct: true },
            { text: 'Alin ang larawan ng "lobo"?', correct: true },
            { text: 'Ano ang unang tunog sa "ilaw"?', correct: false }
          ]
        },
        {
          title: 'Sound Recognition (M)',
          category: 'Alpabeto at Tunog',
          score: 3,
          total: 5,
          time: 'Mar 30, 2025, 10:30AM',
          questions: [
            { text: 'Alin ang tamang tunog ng "M"?', correct: true },
            { text: 'Ano ang tunog ng "Ma"?', correct: true },
            { text: 'Ang "M" ba ay tunog ng aso?', correct: false },
            { text: 'Ano ang tunog ng titik "M"?', correct: true },
            { text: 'Ang "M" ay huling tunog sa "gamot"?', correct: false }
          ]
        }
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
        { title: 'Sentence Completion', type: 'line', desc: 'Improved from 60% to 85%' },
        { title: 'Activity Rate', type: 'donut', desc: '70% Completed' }
      ],
      activities: [
        {
          title: 'Sight Word Matching',
          category: 'Sight Words',
          score: 4,
          total: 5,
          time: 'Mar 29, 2025, 10:00AM',
          questions: [
            { text: 'Piliin ang tamang salita para sa larawan ng aso.', correct: true },
            { text: 'Alin ang salitang "nanay"?', correct: true },
            { text: 'Ang "mesa" ba ay hayop?', correct: false },
            { text: 'Tama ba ang salitang "bahay"?', correct: true },
            { text: 'Ang salitang "mangga" ay kulay asul?', correct: false }
          ]
        },
        {
          title: 'Pagsunod sa Simpleng Pangungusap',
          category: 'Simpleng Pangungusap',
          score: 3,
          total: 5,
          time: 'Mar 27, 2025, 8:45AM',
          questions: [
            { text: 'Basahin: Si Ana ay kumain ng ___.', correct: true },
            { text: 'Alin ang tamang pagkakasunod ng salita?', correct: true },
            { text: 'Tama ba ang pangungusap: "Ako takbo bahay"?', correct: false },
            { text: 'Tama ba: "Ang bata ay masaya."', correct: true },
            { text: 'Ang "pusa ay aso" ba ay tama?', correct: false }
          ]
        }
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
        { title: 'Inference & Summary', type: 'bar', desc: 'Makes accurate summaries (80%)' },
        { title: 'Completion Rate', type: 'donut', desc: '93% Completed' }
      ],
      activities: [
        {
          title: 'Paglalagom ng Talata',
          category: 'Paglalagom',
          score: 5,
          total: 5,
          time: 'Apr 2, 2025, 8:00AM',
          questions: [
            { text: 'Ano ang pangunahing ideya ng talata?', correct: true },
            { text: 'Tama ba ang pagbibigay ng buod?', correct: true },
            { text: 'Nabanggit ba ang mga tauhan?', correct: true },
            { text: 'Tama ba ang pagkakasunod ng pangyayari?', correct: true },
            { text: 'May maling detalye sa buod?', correct: false }
          ]
        },
        {
          title: 'Paghinuha Mula sa Kwento',
          category: 'Paghinuha',
          score: 4,
          total: 5,
          time: 'Mar 30, 2025, 2:30PM',
          questions: [
            { text: 'Ano ang damdamin ng tauhan?', correct: true },
            { text: 'Ano ang dahilan sa likod ng aksyon?', correct: true },
            { text: 'May patunay ba sa sagot?', correct: false },
            { text: 'Ang hinuha ba ay lohikal?', correct: true },
            { text: 'Naintindihan ba ang konteksto?', correct: true }
          ]
        }
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
        { title: 'Word Recognition Accuracy', type: 'bar', desc: 'Weekly Pattern Accuracy (70%)' },
        { title: 'Activity Completion Rate', type: 'donut', desc: '76% Completed' }
      ],
      activities: [
        {
          title: 'Talata: Pangunahing Ideya',
          category: 'Pangunahing Ideya',
          score: 4,
          total: 5,
          time: 'Apr 2, 2025, 9:00AM',
          questions: [
            { text: 'Ano ang pangunahing ideya?', correct: true },
            { text: 'Tama ba ang detalyeng ibinigay?', correct: true },
            { text: 'May hindi kaugnay na detalye?', correct: false },
            { text: 'Malinaw ba ang pagkakasulat?', correct: true },
            { text: 'Tama ang sagot sa tanong?', correct: true }
          ]
        },
        {
          title: 'Paggamit ng Konteksto',
          category: 'Paggamit ng Konteksto',
          score: 3,
          total: 5,
          time: 'Mar 31, 2025, 1:30PM',
          questions: [
            { text: 'Naintindihan ba ang salita gamit ang konteksto?', correct: true },
            { text: 'Tama ba ang kahulugan ng "masigla"?', correct: false },
            { text: 'Gamitin ang "mabango" sa pangungusap.', correct: true },
            { text: 'Tama ba ang pagkakagamit ng "mabait"?', correct: true },
            { text: 'Alin ang maling kahulugan?', correct: false }
          ]
        }
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
      // Updated so the bar/line charts have numeric references
      progressCharts: [
        { title: 'Critical Text Analysis', type: 'line', desc: 'From 75% to 85%' },
        { title: 'Fact vs Opinion', type: 'bar', desc: 'Identifies 60% biased content' },
        { title: 'Activity Completion Rate', type: 'donut', desc: '90% Completed' }
      ],
      activities: [
        {
          title: 'Kritikal na Pagsusuri ng Teksto',
          category: 'Kritikal na Pagsusuri',
          score: 5,
          total: 5,
          time: 'Apr 2, 2025, 8:00AM',
          questions: [
            { text: 'Ano ang layunin ng manunulat?', correct: true },
            { text: 'Tama ba ang pagsusuri ng nilalaman?', correct: true },
            { text: 'May bias ba sa teksto?', correct: true },
            { text: 'Ang opinyon ba ay suportado ng ebidensya?', correct: true },
            { text: 'May maling konklusyon ba?', correct: false }
          ]
        },
        {
          title: 'Pagtukoy ng Layunin ng May-akda',
          category: 'Layunin ng May-akda',
          score: 4,
          total: 5,
          time: 'Apr 1, 2025, 9:30AM',
          questions: [
            { text: 'Ano ang gustong ipahiwatig ng may-akda?', correct: true },
            { text: 'Ang teksto ba ay nagbibigay impormasyon?', correct: true },
            { text: 'May impluwensiyang layunin ba?', correct: false },
            { text: 'Tama ba ang interpretasyon ng mambabasa?', correct: true },
            { text: 'Tumpak ba ang sagot sa layunin?', correct: true }
          ]
        }
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
  // ========== END DATA ==========

  // For reading-level labels in table
  const readingLevelLabels = {
    A: 'Unang Antas',
    B: 'Ikalawang Antas',
    C: 'Ikatlong Antas',
    D: 'Ikaapat na Antas',
    E: 'Ikalimang Antas'
  };

  const handleSearch = (e) => setSearch(e.target.value.toLowerCase());
  const handleReadingFilter = (e) => setReadingFilter(e.target.value);
  const handleGroupChange = (e) => setGroupBy(e.target.value);
  const toggleView = () => setIsTableView(prev => !prev);

  // helper
  const groupByKey = (data, keyFn) => {
    return data.reduce((acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  };

  // Filter logic
  const filtered = mockData
    .filter(s =>
      s.name.toLowerCase().includes(search) ||
      s.parent.toLowerCase().includes(search)
    )
    .filter(s => readingFilter === 'All' || s.readingLevel === readingFilter)
    .filter(s => gradeFilter === 'All' || s.grade.toString() === gradeFilter);
    
  // Grouping logic
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
    navigate(`/teacher/student-details/${student.id}`, { state: { student } });
  };


  return (
    <div className="view-student-container">
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

        <div className="custom-select-wrapper">

          <select value={readingFilter} onChange={handleReadingFilter}>
            <option value="All">Antas ng Pagbasa</option>
            <option value="A">Antas Uno</option>
            <option value="B">Antas Dalawa</option>
            <option value="C">Antas Tatlo</option>
            <option value="D">Antas Apat</option>
            <option value="E">Antas Lima</option>
          </select>
          <FaChevronDown className="select-icon" />
        </div>

        <div className="custom-select-wrapper">

          <select value={groupBy} onChange={handleGroupChange}>
            <option value="family">Group by Family</option>
            <option value="parent">Group by Parent</option>
            <option value="name">Group by First Name</option>
            <option value="none">No Grouping</option>
          </select>
          <FaChevronDown className="select-icon" />

        </div>

        <div className="custom-select-wrapper">
          <select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)}>
            <option value="All">Grade Level</option>
            <option value="K">Kindergarten</option>
            <option value="1">Grade 1</option>
            <option value="2">Grade 2</option>
            <option value="3">Grade 3</option>
          </select>
          <FaChevronDown className="select-icon" />
        </div>
      </div>


      {/* Conditionally Render Table or Text List */}
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
                <th>Grade</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(grouped).map(([group, students]) => (
                <React.Fragment key={group}>
                  {groupBy !== 'name' && group !== 'All' && (
                    <tr className="group-row">
                      <td colSpan="7">Group: {group}</td>
                    </tr>
                  )}
                  {students.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.name}</td>
                      <td>{s.parent}</td>
                      <td>{s.studentID}</td>
                      <td>{readingLevelLabels[s.readingLevel]}</td>
                      <td>{`Grade ${s.grade}`}</td>
                      <td>
                        <button className="view-btn" onClick={() => handleViewDetails(s)}>
                          View Details
                        </button>
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
                  <button
                    className="view-btn-inline"
                    onClick={() => handleViewDetails(s)}
                  >
                    View
                  </button>
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
