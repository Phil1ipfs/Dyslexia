import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faLayerGroup,
  faQuestionCircle,
  faList,
  faBookOpen,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import './TabNavigation.css';

const TabNavigation = ({ tabs, activeTab, setActiveTab }) => {
  // Helper function to get appropriate icon for each tab
  const getTabIcon = (tabId) => {
    switch(tabId) {
      case 'templates':
        return faLayerGroup;
      case 'questions':
        return faQuestionCircle;
      case 'choices':
        return faList;
      case 'sentences':
        return faBookOpen;
      case 'pending':
        return faClock;
      default:
        return faLayerGroup;
    }
  };

  return (
    <div className="tabs-container">
      <div className="tabs-header">
        {tabs.map(tab => (
          <div 
            key={tab.id}
            className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <FontAwesomeIcon icon={getTabIcon(tab.id)} className="tab-icon" />
            <span className="tab-label">{tab.label}</span>
            {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;