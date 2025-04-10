// SubmissionOverview.jsx
import React, { useState } from 'react';
import { Search } from 'lucide-react';

const SubmissionOverview = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data based on the provided image
  const submissions = [
    // Your existing submissions array remains unchanged
    {
      id: 'SUB-2023-001',
      student: { name: 'Maria Santos', grade: 2 },
      studentId: 'ST-2023-142',
      activity: {
        title: 'Filipino Folk Tales',
        category: 'Reading Comprehension',
        timeSpent: '15 minutes',
        attempts: 1
      },
      submittedDate: 'Apr 6, 2023, 10:30 AM',
      status: 'Completed',
      score: '85%'
    },
    // ... rest of your submissions
  ];

  const stats = {
    total: 8,
    completed: 4,
    needsReview: 2,
    needsIntervention: 1,
    inProgress: 1,
    averageScore: '77.1%'
  };

  // Filter submissions based on search term
  const filteredSubmissions = submissions.filter(sub => 
    sub.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get status color class
  const getStatusClass = (status) => {
    switch(status) {
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Needs Review': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score === 'N/A') return 'text-gray-500';
    const numScore = parseInt(score);
    if (numScore >= 90) return 'text-green-600';
    if (numScore >= 75) return 'text-green-500';
    if (numScore >= 60) return 'text-yellow-600';
    return 'text-red-500';
  };

  return (
    // Note: Changed from "bg-gray-50 min-h-screen p-6" to just "p-6"
    // The outer container styling should be handled by the parent component
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-blue-900">Submission Overview</h1>
      
      {/* The rest of your component remains unchanged */}
      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        {/* ... your existing search input and filters ... */}
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* ... your existing stat cards ... */}
      </div>
      
      {/* ... rest of your component ... */}
    </div>
  );
};

export default SubmissionOverview;