// src/pages/Teachers/CreatePracticeModule.jsx

import React from "react";
import { useLocation } from "react-router-dom";
import StandardForm from "../../components/TeacherPage/StandardPracticeForm";
import { AudioPracticeForm } from "../../components/TeacherPage/AudioPracticeForm.jsx";
import { ReadingComprehensionForm } from "../../components/TeacherPage/ReadingPracticeForm";

import "../../css/Teachers/PracticeModule.css"; // Import the CSS file for styling

const CreatePracticeModule = () => {
  const location = useLocation();
  const concept = location.state?.concept || "";

  const getFormType = (concept) => {
    const lower = concept.toLowerCase();
    if (lower.includes("comprehension") || lower.includes("pag-unawa")) {
      return "reading";
    } else if (
      lower.includes("syllable") ||
      lower.includes("blending") ||
      lower.includes("pagpapantig")
    ) {
      return "audio";
    } else {
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
      {formType === "standard" && <StandardForm concept={concept} />}
      {formType === "audio" && <AudioPracticeForm concept={concept} />}
      {formType === "reading" && <ReadingComprehensionForm concept={concept} />}
    </div>
  );
};

export default CreatePracticeModule;
