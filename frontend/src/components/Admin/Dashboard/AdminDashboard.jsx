import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import '../../../css/Admin/Dashboard/AdminDashboard.css';

// Dashboard Card Component
const DashboardCard = ({ label, value, icon, iconClass }) => (
  <div className="dashboard-card">
    <div className="card-content">
      <div className="card-label">{label}</div>
      <div className="card-value">{value.toLocaleString()}</div>
    </div>
    <div className={`card-icon ${iconClass || ''}`}>
      {icon}
    </div>
  </div>
);

// Icons used in dashboard cards
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const CheckmarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const PendingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const StudentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

// Main Dashboard Component
const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 2456,
    approvedActivities: 103,
    pendingApprovals: 20,
    priorityStudents: 20
  });
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Sample student data
  const [students, setStudents] = useState([
    {
      id: 1,
      name: "Maria Santos",
      grade: "2",
      progress: "78%",
      learningChallenges: ["Phonological", "Word Recognition"],
      learningStrengths: ["Sound Letter Association", "Syllable"],
      recentActivity: {
        description: "Completed 30 phonics exercises with 75% accuracy"
      },
      prescriptiveAnalysis: "Maria santos is struggling with bla bla bla bla"
    },
    {
      id: 2,
      name: "Juan Torres",
      grade: "2",
      progress: "85%",
      learningChallenges: ["Phonological Awareness", "Word Recognition"],
      learningStrengths: ["Sound Letter Association", "Syllable Structure"],
      recentActivity: {
        description: "Completed 30 phonics exercises with 75% accuracy"
      },
      recommendedActivities: [
        "Filipino Sentence Structure",
        "Filipino Simple Words"
      ]
    },
    {
      id: 3,
      name: "Ana Lim",
      grade: "2",
      progress: "76%",
      learningChallenges: ["Phonological Awareness", "Word Recognition"],
      learningStrengths: ["Word Recognition", "Reading Speed"],
      recentActivity: {
        description: "Completed 30 phonics exercises with 75% accuracy"
      },
      recommendedActivities: [
        "Filipino Sentence Structure",
        "Filipino Simple Words"
      ]
    }
  ]);

  // Simulate fetching dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // In a real app, this would be an API call
        // For demo purposes, we'll just simulate a delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data - in a real app this would come from the API response
        setStats({
          totalUsers: 2456,
          approvedActivities: 103,
          pendingApprovals: 20,
          priorityStudents: 20
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate avatar background color based on name
  const getAvatarColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#FFD166', '#7A6FF0', '#F25F5C'];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="notification-icon">
          <Bell size={24} />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : (
        <>
          <div className="dashboard-cards">
            <div className="dashboard-row">
              <DashboardCard 
                label="Total Users" 
                value={stats.totalUsers}
                icon={<UsersIcon />}
              />
              
              <DashboardCard 
                label="Total Approve Activities" 
                value={stats.approvedActivities}
                icon={<CheckmarkIcon />}
                iconClass="approved"
              />
              
              <DashboardCard 
                label="Total Pending Approval" 
                value={stats.pendingApprovals}
                icon={<PendingIcon />}
                iconClass="pending"
              />
            </div>
            
            <div className="dashboard-row">
              <DashboardCard 
                label="Total Users" 
                value={stats.totalUsers}
                icon={<UsersIcon />}
              />
              
              <DashboardCard 
                label="Total Approve Activities" 
                value={stats.approvedActivities}
                icon={<CheckmarkIcon />}
                iconClass="approved"
              />
              
              <DashboardCard 
                label="High Priority Students" 
                value={stats.priorityStudents}
                icon={<StudentIcon />}
                iconClass="priority"
              />
            </div>
          </div>

          <div className="student-analytics-container">
            <h2 className="section-title">Student Prescriptive Analytics</h2>
            
            <div className="search-container">
              <input
                type="text"
                placeholder="Search Student"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="student-cards">
              {filteredStudents.map(student => (
                <div key={student.id} className="student-card">
                  <div className="student-header">
                    <div 
                      className="student-avatar" 
                      style={{ backgroundColor: getAvatarColor(student.name) }}
                    >
                      <span>{getInitials(student.name)}</span>
                    </div>
                    <div className="student-info">
                      <h3 className="student-name">{student.name}</h3>
                      <div className="student-grade-progress">
                        <span className="student-grade">Grade {student.grade}</span>
                        <span className="student-progress">Progress: {student.progress}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="student-analytics">
                    <div className="analytics-section">
                      <h4>Learning Challenges</h4>
                      <div className="tag-container">
                        {student.learningChallenges.map((challenge, index) => (
                          <span key={index} className={`tag challenge ${challenge.toLowerCase().replace(/\s+/g, '-')}`}>
                            {challenge}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="analytics-section">
                      <h4>Learning Strengths</h4>
                      <div className="tag-container">
                        {student.learningStrengths.map((strength, index) => (
                          <span key={index} className={`tag strength ${strength.toLowerCase().replace(/\s+/g, '-')}`}>
                            {strength}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="analytics-section">
                      <h4>Recent Activity</h4>
                      <p className="recent-activity">
                        {student.recentActivity.description || "No recent activity"}
                      </p>
                    </div>
                    
                    {student.prescriptiveAnalysis && (
                      <div className="analytics-section">
                        <h4>Prescriptive Analysis</h4>
                        <p className="prescriptive-analysis">{student.prescriptiveAnalysis}</p>
                      </div>
                    )}
                    
                    {student.recommendedActivities && student.recommendedActivities.length > 0 && (
                      <div className="analytics-section">
                        <h4>Recommended Activities</h4>
                        <ul className="recommended-activities">
                          {student.recommendedActivities.map((activity, index) => (
                            <li key={index}>{activity}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;