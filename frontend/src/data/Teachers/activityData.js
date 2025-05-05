// src/data/Teachers/activityData.js
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFont, faFileAlt, faBookReader } from '@fortawesome/free-solid-svg-icons';
import React from 'react';

// Reading levels
export const readingLevels = [
  "All Levels",
  "Antas Una",
  "Antas Dalawa",
  "Antas Tatlo",
  "Antas Apat",
  "Antas Lima"
];

// Categories
export const categories = [
  "All Categories",
  "Pagtukoy ng Tunog",
  "Pag-uugnay ng Tunog at Letra",
  "Pagbasa ng Pantig",
  "Pagbasa ng Salita",
  "Pag-unawa sa Salita",
  "Ponetiko",
  "Pagpili ng Tamang Salita",
  "Pantig",
  "Pagsusuri ng Pantig",
  "Pangungusap",
  "Talasalitaan"
];

// Sort options
export const sortOptions = [
  "Newest First",
  "Oldest First",
  "Alphabetical"
];

// Activity structures with their icons and categories
export const activityStructures = {
  ponetiko: {
    title: "Ehersisyong Ponetiko",
    icon: <FontAwesomeIcon icon={faFont} />,
    categories: [
      "Pagtukoy ng Tunog",
      "Pag-uugnay ng Tunog at Letra",
      "Pagbasa ng Pantig",
      "Ponetiko"
    ]
  },
  salita: {
    title: "Pagkilala sa mga Salita",
    icon: <FontAwesomeIcon icon={faFileAlt} />,
    categories: [
      "Pagbasa ng Salita",
      "Pag-unawa sa Salita",
      "Pagpili ng Tamang Salita",
      "Talasalitaan"
    ]
  },
  pantig: {
    title: "Estruktura ng Pantig",
    icon: <FontAwesomeIcon icon={faBookReader} />,
    categories: [
      "Pagbuo ng Pantig",
      "Paghahati ng Pantig",
      "Pagsusuri ng Pantig",
      "Pantig",
      "Pangungusap"
    ]
  }
};