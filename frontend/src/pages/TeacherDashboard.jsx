import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Area,
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

import '../css/TeacherDashboard.css';
import Sidebar from "../widgets/Sidebar.jsx";
import students from '../assets/icons/students.png';
import parent from '../assets/icons/parent.png';

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [progressType, setProgressType] = useState('phonics');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timeFrame, setTimeFrame] = useState('week');

  const progressData = {
    phonics: {
      week: [
        { name: '1', progress: 65 },
        { name: '2', progress: 72 },
        { name: '3', progress: 80 },
        { name: '4', progress: 12 },
        { name: '5', progress: 78 },
      ],
      day: [
        { name: 'Mon', progress: 45 },
        { name: 'Tue', progress: 80 },
        { name: 'Wed', progress: 11 },
        { name: 'Thu', progress: 65 },
        { name: 'Fri', progress: 70 },
      ]
    },
    wordRecognition: {
      week: [
        { name: '1', progress: 58 },
        { name: '2', progress: 65 },
        { name: '3', progress: 72 },
        { name: '4', progress: 80 },
        { name: '5', progress: 85 },
      ],
      day: [
        { name: 'Mon', progress: 38 },
        { name: 'Tue', progress: 45 },
        { name: 'Wed', progress: 52 },
        { name: 'Thu', progress: 60 },
        { name: 'Fri', progress: 65 },
      ]
    }
  };

  const handleTabChange = (tab) => {
    const tabMap = {
      dashboard: 'dashboard',
      progress: 'studentProgress',
      view: 'viewStudent',
      teacher: 'feedback'
    };
    setActiveTab(tabMap[tab] || 'dashboard');
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectProgressType = (type) => {
    setProgressType(type);
    setIsDropdownOpen(false);
  };

  const toggleTimeFrame = () => {
    setTimeFrame(timeFrame === 'week' ? 'day' : 'week');
  };

  return (
    <div className="dashboard-container">
      <Sidebar 
        defaultActive={activeTab} 
        onTabChange={handleTabChange} 
      />

      <main className="main-content">
        {activeTab === 'dashboard' && (
          <>
            <h1 className="page-title">Dashboard Overview</h1>
            
            <div className="stats-cards">
              <div className="stat-card total-students">
                <img src={students} alt="Total Students" className="stat-icon" />
                <h3>Total Students</h3>
                <p>25</p>
              </div>
              <div className="stat-card pending-feedback">
                <img src={parent} alt="Total Parent" className="stat-icon" />
                <h3>Total Parent</h3>
                <p>15</p>
              </div>
            </div>

            <div className="chart-section">
              <div className="chart-header">
                <h2>{timeFrame === 'week' ? 'Weekly' : 'Daily'} Progress</h2>
                <div className="chart-controls">
                  <button 
                    className="timeframe-toggle"
                    onClick={toggleTimeFrame}
                  >
                    {timeFrame === 'week' ? 'Show Daily' : 'Show Weekly'}
                  </button>
                  <div className="dropdown-container">
                    <button 
                      className="dropdown-button"
                      onClick={toggleDropdown}
                    >
                      {progressType === 'phonics' ? 'Phonics' : 'Word Recognition'}
                      <span className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}>▼</span>
                    </button>
                    {isDropdownOpen && (
                      <div className="dropdown-menu">
                        <div 
                          className={`dropdown-item ${progressType === 'phonics' ? 'active' : ''}`}
                          onClick={() => selectProgressType('phonics')}
                        >
                          Phonics
                        </div>
                        <div 
                          className={`dropdown-item ${progressType === 'wordRecognition' ? 'active' : ''}`}
                          onClick={() => selectProgressType('wordRecognition')}
                        >
                          Word Recognition
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="chart-container" style={{
                  backgroundColor: 'rgba(59, 79, 129, 0.2)',
                  borderRadius: '10px',
                  padding: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart 
                    data={progressData[progressType][timeFrame]}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="rgba(255,255,255,0.3)" 
                      horizontal={true} 
                      vertical={true} 
                    />
                    
                    <XAxis 
                      dataKey="name"
                      axisLine={{ stroke: 'white', strokeWidth: 2 }}
                      tick={{ fill: 'white', fontSize: 12 }}
                      tickLine={{ stroke: 'white', strokeWidth: 2 }}
                      tickCount={5}
                      tickMargin={12}
                    />
                    
                    <YAxis 
                      domain={[0, 100]}
                      axisLine={{ stroke: 'white', strokeWidth: 2 }}
                      tick={{ fill: 'white', fontSize: 11 }}
                      tickLine={{ stroke: 'white' }}
                      tickCount={11} 
                      tickFormatter={(value) => `${value}%`}
                    />
                    
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B4F81" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B4F81" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    
                    <Area
                      type="monotone"
                      dataKey="progress"
                      fill="url(#areaFill)"
                      stroke="none"
                      activeDot={false}
                    />
                    
                    <Line 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="#ffffff"
                      strokeWidth={1}
                      dot={{
                        fill: '#3B4F81',
                        stroke: 'white',
                        strokeWidth: 2,
                        r: 6
                      }}
                      activeDot={{
                        r: 8,
                        fill: '#F3C922',
                        stroke: 'white'
                      }}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                    
                    <ReferenceLine 
                      y={80} 
                      stroke="#F3C922" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                    />
                    
                    <Tooltip 
                      contentStyle={{
                        background: '#3B4F81',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '4px',
                        color: 'white'
                      }}
                      formatter={(value) => [`${value}%`, 'Progress']}
                      labelFormatter={(label) => timeFrame === 'week' ? `Week ${label}` : label}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeTab === 'studentProgress' && (
          <div className="student-progress">
            <h2>Student Progress</h2>
          </div>
        )}

        {activeTab === 'viewStudent' && (
          <div className="view-student">
            <h2>View Student</h2>
          </div>
        )}

        {activeTab === 'feedback' && (
          <div className="feedback">
            <h2>Feedback to Parent</h2>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
