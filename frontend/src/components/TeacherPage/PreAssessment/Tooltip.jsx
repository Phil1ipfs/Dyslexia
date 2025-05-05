import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

const Tooltip = ({ text }) => {
  return (
    <div className="pre-assess-tooltip">
      <FontAwesomeIcon icon={faQuestionCircle} className="pre-assess-tooltip-icon" />
      <div className="pre-assess-tooltip-content">{text}</div>
    </div>
  );
};

export default Tooltip;