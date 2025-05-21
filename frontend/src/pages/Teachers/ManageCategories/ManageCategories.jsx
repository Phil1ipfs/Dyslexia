// src/pages/Teachers/ManageCategories/ManageCategories.jsx
import React, { useState, useEffect } from "react";
import { Tab, Tabs } from "../../components/common/Tabs";
import TemplateLibrary from "./TemplateLibrary";
import AdminApproval from "./AdminApproval";
import PostAssessment from "./PostAssessment";
import PreAssessment from "./PreAssessment";
import "../../../css/Teachers/ManageCategories/ManageCategories.css";

// Mock data - in a real app, this would come from an API
import mockTemplates from "./mockData";

const ManageCategories = () => {
  const [activeTab, setActiveTab] = useState("templates");
  const [templates, setTemplates] = useState(mockTemplates);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulating API call to fetch templates
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Template CRUD operations
  const handleCreateTemplate = (type, newTemplate) => {
    setTemplates(prev => {
      const updated = { ...prev };
      if (type === "question") {
        updated.questionTemplates = [...prev.questionTemplates, newTemplate];
      } else if (type === "choice") {
        updated.choiceTemplates = [...prev.choiceTemplates, newTemplate];
      } else if (type === "sentence") {
        updated.sentenceTemplates = [...prev.sentenceTemplates, newTemplate];
      }
      return updated;
    });
  };

  const handleUpdateTemplate = (type, id, updatedTemplate) => {
    setTemplates(prev => {
      const updated = { ...prev };
      if (type === "question") {
        updated.questionTemplates = prev.questionTemplates.map(t => 
          t._id === id ? { ...t, ...updatedTemplate } : t
        );
      } else if (type === "choice") {
        updated.choiceTemplates = prev.choiceTemplates.map(t => 
          t._id === id ? { ...t, ...updatedTemplate } : t
        );
      } else if (type === "sentence") {
        updated.sentenceTemplates = prev.sentenceTemplates.map(t => 
          t._id === id ? { ...t, ...updatedTemplate } : t
        );
      }
      return updated;
    });
  };

  const handleDeleteTemplate = (type, id) => {
    setTemplates(prev => {
      const updated = { ...prev };
      if (type === "question") {
        updated.questionTemplates = prev.questionTemplates.filter(t => t._id !== id);
      } else if (type === "choice") {
        updated.choiceTemplates = prev.choiceTemplates.filter(t => t._id !== id);
      } else if (type === "sentence") {
        updated.sentenceTemplates = prev.sentenceTemplates.filter(t => t._id !== id);
      }
      return updated;
    });
  };

  // Admin approval handlers
  const handleApproveTemplate = (type, id) => {
    setTemplates(prev => {
      const updated = { ...prev };
      if (type === "question") {
        updated.questionTemplates = prev.questionTemplates.map(t => 
          t._id === id ? { ...t, isApproved: true } : t
        );
      } else if (type === "choice") {
        updated.choiceTemplates = prev.choiceTemplates.map(t => 
          t._id === id ? { ...t, isActive: true } : t
        );
      } else if (type === "sentence") {
        updated.sentenceTemplates = prev.sentenceTemplates.map(t => 
          t._id === id ? { ...t, isApproved: true } : t
        );
      }
      return updated;
    });
  };

  const handleRejectTemplate = (type, id, feedback) => {
    setTemplates(prev => {
      const updated = { ...prev };
      if (type === "question") {
        updated.questionTemplates = prev.questionTemplates.map(t => 
          t._id === id ? { ...t, rejectionFeedback: feedback } : t
        );
      } else if (type === "choice") {
        updated.choiceTemplates = prev.choiceTemplates.map(t => 
          t._id === id ? { ...t, rejectionFeedback: feedback } : t
        );
      } else if (type === "sentence") {
        updated.sentenceTemplates = prev.sentenceTemplates.map(t => 
          t._id === id ? { ...t, rejectionFeedback: feedback } : t
        );
      }
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="manage-categories-container">
        <div className="mc-loading">
          <div className="spinner"></div>
          <p>Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-categories-container">
      <div className="mc-header">
        <h1>Manage Activities</h1>
        <p>
          Create and manage templates for post-assessment activities. 
          Organize question templates, choice options, and reading passages for 
          students based on their reading level.
        </p>
      </div>

      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tab id="templates" label="Template Library">
          <TemplateLibrary 
            templates={templates} 
            onCreateTemplate={handleCreateTemplate}
            onUpdateTemplate={handleUpdateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
          />
        </Tab>
        <Tab id="post-assessment" label="Main Assessment">
          <PostAssessment templates={templates} />
        </Tab>
        <Tab id="pre-assessment" label="Pre-Assessment">
          <PreAssessment />
        </Tab>
        <Tab id="admin-approval" label="Admin Approval">
          <AdminApproval 
            templates={templates} 
            onApprove={handleApproveTemplate}
            onReject={handleRejectTemplate}
          />
        </Tab>
      </Tabs>
    </div>
  );
};

export default ManageCategories;