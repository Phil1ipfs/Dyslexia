// src/pages/Teachers/CreatePracticeModule.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import StandardForm from "../../widgets/TeacherPage/StandardPracticeForm";
import AudioBasedForm from "../../widgets/TeacherPage/AudioPracticeForm";
import ReadingComprehensionForm from "../../widgets/TeacherPage/ReadingPracticeForm";
// import "../css/createPracticeModule.css"; 

const CreatePracticeModule = () => {
  const location = useLocation();
  // Retrieve the concept from the router state.
  // In a MongoDB-driven approach, this concept data would normally be fetched from the backend
  // with additional details such as the defined activity type.
  const concept = location.state?.concept || "";

  // Heuristic function to select the appropriate practice form type.
  // In future, you can replace this with a database query that returns an activityType field,
  // e.g., "standard", "audio", "reading", etc.
  const getFormType = (concept) => {
    const lower = concept.toLowerCase();

    // If the concept contains key terms indicating reading comprehension,
    // we assign the "reading" form.
    if (lower.includes("comprehension") || lower.includes("pag-unawa")) {
      return "reading";
    } 
    // If the concept contains key terms indicating audio-based practice,
    // e.g., syllable blending can often be tested using an audio cue,
    // then use the "audio" form.
    else if (lower.includes("syllable") || lower.includes("blending") || lower.includes("pagpapantig")) {
      return "audio";
    }
    // Default fallback for any other concept.
    else {
      return "standard";
    }
  };

  const formType = getFormType(concept);

  return (
    <div className="create-practice-module-container">
      <h1>Create Practice Module</h1>
      <p>
        <strong>Concept:</strong> {concept}
      </p>
      {/* Render the appropriate form component based on the determined form type */}
      {formType === "standard" && <StandardForm concept={concept} />}
      {formType === "audio" && <AudioBasedForm concept={concept} />}
      {formType === "reading" && <ReadingComprehensionForm concept={concept} />}
    </div>
  );
};

export default CreatePracticeModule;
