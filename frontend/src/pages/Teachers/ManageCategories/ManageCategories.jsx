// src/pages/Teachers/ManageCategories/ManageCategories.jsx
import React, { useState, useEffect } from "react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import PostAssessment from "./PostAssessment";
import PreAssessment from "./PreAssessment";
import TemplateLibrary from "./TemplateLibrary";
import "../../../css/Teachers/ManageCategories/ManageCategories.css";
// Import FontAwesome 
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';

// Add all FontAwesome solid icons to the library
library.add(fas);

const ManageCategories = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [templates, setTemplates] = useState({
    questionTemplates: [],
    choiceTemplates: [],
    sentenceTemplates: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Mock data loading from API
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        // In a real app, you'd fetch from your API
        // Mock data based on your JSON files
        const questionTemplates = [
          {
            _id: "6829799079a34741f9cd19ef",
            category: "Alphabet Knowledge",
            questionType: "patinig",
            templateText: "Anong katumbas na maliit na letra?",
            applicableChoiceTypes: ["patinigBigLetter", "patinigSmallLetter"],
            correctChoiceType: "patinigSmallLetter",
            isApproved: true,
            createdAt: "2025-05-01T09:00:00.000Z",
            updatedAt: "2025-05-01T09:00:00.000Z",
            isActive: true
          },
          {
            _id: "6829799079a34741f9cd19f0",
            category: "Alphabet Knowledge",
            questionType: "patinig",
            templateText: "Anong katumbas na malaking letra?",
            applicableChoiceTypes: ["patinigBigLetter", "patinigSmallLetter"],
            correctChoiceType: "patinigBigLetter",
            isApproved: false,
            createdAt: "2025-05-01T09:05:00.000Z",
            updatedAt: "2025-05-01T09:05:00.000Z",
            isActive: true
          },
          {
            _id: "6829799079a34741f9cd19f5",
            category: "Phonological Awareness",
            questionType: "malapantig",
            templateText: "Kapag pinagsama ang mga pantig, ano ang mabubuo?",
            applicableChoiceTypes: ["malapatinigText", "wordText"],
            correctChoiceType: "wordText",
            isApproved: false,
            createdAt: "2025-05-01T09:30:00.000Z",
            updatedAt: "2025-05-01T09:30:00.000Z",
            isActive: true
          }
        ];
        
        const choiceTemplates = [
          {
            _id: "68297e4979a34741f9cd1a0f",
            choiceType: "patinigBigLetter",
            choiceValue: "A",
            choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/A_big.png",
            soundText: null,
            isActive: false,
            createdAt: "2025-05-01T09:00:00.000Z",
            updatedAt: "2025-05-01T09:00:00.000Z"
          },
          {
            _id: "68297e4979a34741f9cd1a14",
            choiceType: "patinigSmallLetter",
            choiceValue: "a",
            choiceImage: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/letters/a_small.png",
            soundText: null,
            isActive: true,
            createdAt: "2025-05-01T09:05:00.000Z",
            updatedAt: "2025-05-01T09:05:00.000Z"
          },
          {
            _id: "68297e4979a34741f9cd1a19",
            choiceType: "patinigSound",
            choiceValue: null,
            choiceImage: null,
            soundText: "/ah/",
            isActive: false,
            createdAt: "2025-05-01T09:10:00.000Z",
            updatedAt: "2025-05-01T09:10:00.000Z"
          }
        ];
        
        const sentenceTemplates = [
          {
            _id: "68297c4379a34741f9cd1a00",
            title: "Si Maria at ang mga Bulaklak",
            category: "Reading Comprehension",
            readingLevel: "Low Emerging",
            sentenceText: [
              {
                pageNumber: 1,
                text: "Si Maria ay pumunta sa parke. Nakita niya ang maraming bulaklak na magaganda. Siya ay natuwa at nag-uwi ng ilang bulaklak para sa kanyang ina.",
                image: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/park_flowers.png"
              },
              {
                pageNumber: 2,
                text: "Nang makita ng ina ni Maria ang mga bulaklak, siya ay ngumiti at nagyakap sa kanyang anak. Gumawa sila ng maliit na hardin sa harap ng kanilang bahay.",
                image: "https://literexia-bucket.s3.ap-southeast-2.amazonaws.com/passages/mother_garden.png"
              }
            ],
            sentenceQuestions: [
              {
                questionNumber: 1,
                questionText: "Sino ang pangunahing tauhan sa kwento?",
                sentenceCorrectAnswer: "Si Maria",
                sentenceOptionAnswers: [
                  "Si Maria",
                  "Si Juan",
                  "Ang ina",
                  "Ang hardinero"
                ]
              },
              {
                questionNumber: 2,
                questionText: "Saan pumunta si Maria?",
                sentenceCorrectAnswer: "Sa parke",
                sentenceOptionAnswers: [
                  "Sa parke",
                  "Sa paaralan",
                  "Sa tindahan",
                  "Sa bahay"
                ]
              }
            ],
            isApproved: false,
            createdAt: "2025-05-01T10:30:00.000Z"
          }
        ];

        setTemplates({
          questionTemplates,
          choiceTemplates,
          sentenceTemplates
        });
        
        setLoading(false);
      } catch (err) {
        setError("Failed to load templates. Please try again.");
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  return (
    <div className="manage-categories-container">
      <div className="mc-header">
        <h1>Manage Activities</h1>
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
            Template Library
          </Tab>
          <Tab 
            className={tabIndex === 1 ? "mc-tab mc-tab-active" : "mc-tab"}
            selectedClassName="mc-tab-active"
          >
            Post-Assessment
          </Tab>
          <Tab 
            className={tabIndex === 2 ? "mc-tab mc-tab-active" : "mc-tab"}
            selectedClassName="mc-tab-active"
          >
            Pre-Assessment
          </Tab>
        </TabList>

        <div className="mc-tab-content">
          <TabPanel>
            {loading ? (
              <div className="mc-loading">
                <div className="mc-spinner"></div>
                <p>Loading templates...</p>
              </div>
            ) : error ? (
              <div className="mc-error">
                <i className="fas fa-exclamation-circle"></i>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>Try Again</button>
              </div>
            ) : (
              <TemplateLibrary 
                templates={templates} 
                setTemplates={setTemplates} 
              />
            )}
          </TabPanel>
          <TabPanel>
            <PostAssessment 
              templates={templates} 
            />
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