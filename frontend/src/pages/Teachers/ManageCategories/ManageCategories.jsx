// src/pages/Teachers/ManageCategories/ManageCategories.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import PostAssessment from "./PostAssessment";
import PreAssessment from "./PreAssessment";
import "../../../css/Teachers/ManageCategories/ManageCategories.css";
// Import FontAwesome 
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import AuthService from '../../../services/authService';

// Add all FontAwesome solid icons to the library
library.add(fas);

const ManageCategories = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!AuthService.isLoggedIn()) {
      console.log('User not authenticated, redirecting to login');
      navigate('/login');
      return;
    }

  }, [navigate]);

  return (
    <div className="manage-categories-container">
      <div className="mc-header">
        <h1>Assessment Management</h1>
        <p>Create, edit, and manage templates for activities and assessments.</p>
      </div>

      <Tabs 
        selectedIndex={tabIndex} 
        onSelect={index => setTabIndex(index)}
        className="mc-tabs"
      >
        <TabList className="mc-tab-list">
          <Tab 
            className={tabIndex === 0 ? "mc-tab mc-tab-active" : "mc-tab"}
            selectedClassName="mc-tab-active"
          >
            Post-Assessment
          </Tab>
          <Tab 
            className={tabIndex === 1 ? "mc-tab mc-tab-active" : "mc-tab"}
            selectedClassName="mc-tab-active"
          >
            Pre-Assessment
          </Tab>
        </TabList>

        <div className="mc-tab-content">
          <TabPanel>
            <PostAssessment />
          </TabPanel>
          <TabPanel>
            <PreAssessment />
          </TabPanel>
        </div>
      </Tabs>
    </div>
  );
};

export default ManageCategories;