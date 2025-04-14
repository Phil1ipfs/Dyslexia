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
import students from '../../assets/icons/Teachers/students.png';
import parent from '../../assets/icons/Teachers/parent.png';
import '../../css/Teachers/TeacherDashboard.css'; // Using a specific CSS filename

const EduTeacherDashboard = () => {
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
    <div className="edu-dashboard">
      <main className="edu-dashboard__content">
        <h1 className="edu-dashboard__title">Dashboard Overview</h1>
        
        <div className="edu-dashboard__stats">
          <div className="edu-stat-card edu-stat-card--students">
            <img src={students} alt="Total Students" className="edu-stat-card__icon" />
            <h3 className="edu-stat-card__heading">Total Students</h3>
            <p className="edu-stat-card__value">25</p>
          </div>
          <div className="edu-stat-card edu-stat-card--parents">
            <img src={parent} alt="Total Parent" className="edu-stat-card__icon" />
            <h3 className="edu-stat-card__heading">Total Parent</h3>
            <p className="edu-stat-card__value">15</p>
          </div>
        </div>

        <div className="edu-dashboard__chart-section">
          <div className="edu-chart__header">
            <h2 className="edu-chart__title">{timeFrame === 'week' ? 'Weekly' : 'Daily'} Progress</h2>
            <div className="edu-chart__controls">
              <button 
                className="edu-timeframe-btn"
                onClick={toggleTimeFrame}
              >
                {timeFrame === 'week' ? 'Show Daily' : 'Show Weekly'}
              </button>
              <div className="edu-dropdown">
                <button 
                  className="edu-dropdown__trigger"
                  onClick={toggleDropdown}
                >
                  {progressType === 'phonics' ? 'Phonics' : 'Word Recognition'}
                  <span className={`edu-dropdown__arrow ${isDropdownOpen ? 'edu-dropdown__arrow--open' : ''}`}>▼</span>
                </button>
                {isDropdownOpen && (
                  <div className="edu-dropdown__menu">
                    <div 
                      className={`edu-dropdown__item ${progressType === 'phonics' ? 'edu-dropdown__item--active' : ''}`}
                      onClick={() => selectProgressType('phonics')}
                    >
                      Phonics
                    </div>
                    <div 
                      className={`edu-dropdown__item ${progressType === 'wordRecognition' ? 'edu-dropdown__item--active' : ''}`}
                      onClick={() => selectProgressType('wordRecognition')}
                    >
                      Word Recognition
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="edu-chart__container">
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
                  <linearGradient id="eduAreaFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B4F81" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B4F81" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="progress"
                  fill="url(#eduAreaFill)"
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
      </main>
    </div>
  );
};

export default EduTeacherDashboard;