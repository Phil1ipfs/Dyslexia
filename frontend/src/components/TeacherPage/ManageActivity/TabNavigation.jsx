import React from 'react';
import './TabNavigation.css';

const TabNavigation = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;