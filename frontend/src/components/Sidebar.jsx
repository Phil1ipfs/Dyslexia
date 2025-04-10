import React from 'react';
import '../styles/Sidebar.css';

const Sidebar = ({ 
  activeSection, 
  expandedSections, 
  onSectionClick, 
  onToggleExpand,
  navItems,
  isMobile,
  isOpen
}) => {
  return (
    <div className={`sidebar ${isMobile && isOpen ? 'open' : ''}`}>
      <div className="brand">
        <h1>LITEREXIA</h1>
      </div>
      
      <div className="admin-profile">
        <div className="avatar">
          <img src="/api/placeholder/48/48" alt="Admin Avatar" />
        </div>
        <div className="admin-info">
          <h3>Madam Jaja</h3>
          <p>Administrator</p>
        </div>
      </div>
      
      <nav className="nav-menu">
        {/* Main Sections */}
        <div className="nav-section">
          {navItems.main.map(item => (
            <React.Fragment key={item}>
              <div 
                className={`nav-item ${activeSection === item ? 'active' : ''}`}
                onClick={() => onSectionClick(item)}
              >
                <div className="nav-icon">
                  {item === 'Dashboard' ? (
                    <i className="icon-dashboard">⊞</i>
                  ) : item === 'Prescriptive Analytics' ? (
                    <i className="icon-analytics">📊</i>
                  ) : (
                    <i className="icon-default">◯</i>
                  )}
                </div>
                <span>{item}</span>
                {item === 'Dashboard' && (
                  <span 
                    className={`expand-icon ${expandedSections.includes('Dashboard') ? 'expanded' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleExpand('Dashboard');
                    }}
                  >
                    {expandedSections.includes('Dashboard') ? '▼' : '►'}
                  </span>
                )}
              </div>
              
              {item === 'Dashboard' && expandedSections.includes('Dashboard') && (
                <div className="sub-menu">
                  {navItems.dashboardSubItems.map(subItem => (
                    <div 
                      key={subItem} 
                      className={`nav-item child-item ${activeSection === subItem ? 'active' : ''}`}
                      onClick={() => onSectionClick(subItem)}
                    >
                      <div className="nav-icon">
                        <i className="icon-child">▹</i>
                      </div>
                      <span>{subItem}</span>
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* User Lists Section */}
        <div className="nav-section user-lists-section">
          <div 
            className={`nav-item parent-item ${activeSection.startsWith('User Lists') || navItems.userLists.includes(activeSection) ? 'active' : ''}`}
            onClick={() => {
              onSectionClick('User Lists');
              onToggleExpand('User Lists');
            }}
          >
            <div className="nav-icon">
              <i className="icon-users">👥</i>
            </div>
            <span>User Lists</span>
            <span 
              className={`expand-icon ${expandedSections.includes('User Lists') ? 'expanded' : ''}`}
            >
              {expandedSections.includes('User Lists') ? '▼' : '►'}
            </span>
          </div>
          
          {expandedSections.includes('User Lists') && (
            <div className="sub-menu">
              {navItems.userLists.map(item => (
                <div 
                  key={item} 
                  className={`nav-item child-item ${activeSection === item ? 'active' : ''}`}
                  onClick={() => onSectionClick(item)}
                >
                  <div className="nav-icon">
                    <i className="icon-child">▹</i>
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>
      
      <div className="sidebar-footer">
        <div className="nav-item">
          <div className="nav-icon">
            <i className="icon-settings">⚙</i>
          </div>
          <span>Settings</span>
        </div>
        <div className="nav-item">
          <div className="nav-icon">
            <i className="icon-logout">⊘</i>
          </div>
          <span>Log Out</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;