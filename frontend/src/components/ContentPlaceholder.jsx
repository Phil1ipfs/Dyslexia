import React from 'react';
import '../styles/ContentPlaceholder.css';

const ContentPlaceholder = ({ sectionName }) => {
  return (
    <div className="content-placeholder">
      <h2>{sectionName} Content</h2>
      <p>This section is under development. Content for {sectionName} will be displayed here.</p>
    </div>
  );
};

export default ContentPlaceholder;

