// In the parent component that contains both LessonAssignment and ProgressReport
import React, { useState, useEffect } from 'react';
import LessonAssignment from './LessonAssignment';
import ProgressReport from './ProgressReport';
import { getRecommendedLessons, assignLessonsToStudent, getProgressData } from '../services/ProgressService';

const StudentDashboard = ({ studentId }) => {
  const [lessons, setLessons] = useState([]);
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [assignedLessons, setAssignedLessons] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  // Fetch lessons and progress data when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const lessonData = await getRecommendedLessons(studentId);
        const progress = await getProgressData(studentId);
        
        setLessons(lessonData);
        setProgressData(progress);
        
        // Set already assigned lessons
        setAssignedLessons(lessonData.filter(lesson => lesson.assigned));
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    
    fetchData();
  }, [studentId]);

  // Handle lesson selection
  const handleLessonSelect = (lesson) => {
    // Check if lesson is already selected
    const isSelected = selectedLessons.some(l => l.id === lesson.id);
    
    if (isSelected) {
      // Remove from selection
      setSelectedLessons(selectedLessons.filter(l => l.id !== lesson.id));
    } else {
      // Add to selection
      setSelectedLessons([...selectedLessons, lesson]);
    }
  };

  // Handle lesson assignment
  const handleAssign = async () => {
    try {
      // Get IDs of selected lessons
      const lessonIds = selectedLessons.map(lesson => lesson.id);
      
      // Call API to assign lessons
      const result = await assignLessonsToStudent(studentId, lessonIds);
      
      if (result.success) {
        // Update assigned lessons
        const updatedLessons = [...lessons];
        updatedLessons.forEach(lesson => {
          if (lessonIds.includes(lesson.id)) {
            lesson.assigned = true;
          }
        });
        
        setLessons(updatedLessons);
        setAssignedLessons([...assignedLessons, ...selectedLessons]);
        setSelectedLessons([]);
        setAssignmentSuccess(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setAssignmentSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error assigning lessons:', error);
    }
  };

  return (
    <div className="literexia-dashboard">
      <LessonAssignment
        lessons={lessons}
        selectedLessons={selectedLessons}
        onLessonSelect={handleLessonSelect}
        onAssign={handleAssign}
        assignmentSuccess={assignmentSuccess}
      />
      
      <ProgressReport 
        progressData={progressData} 
        assignedLessons={assignedLessons}
      />
    </div>
  );
};

export default StudentDashboard;