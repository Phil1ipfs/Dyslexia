// src/hooks/useSubmissions.js
import { useState, useEffect, useCallback } from 'react';
import { 
  fetchAllSubmissions, 
  fetchSubmissionStats, 
  filterSubmissions 
} from '../services/submissionService';

/**
 * Custom hook for managing submissions data and filters
 * 
 * @returns {Object} - Object containing submissions data, filters, and functions
 */
const useSubmissions = () => {
  // States for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('All Time');
  const [gradeFilter, setGradeFilter] = useState('All Grades');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  
  // States for data
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    needsIntervention: 0,
    pending: 0
  });
  
  // UI states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial submissions and stats
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [submissionsData, statsData] = await Promise.all([
          fetchAllSubmissions(),
          fetchSubmissionStats()
        ]);
        
        setSubmissions(submissionsData);
        setFilteredSubmissions(submissionsData);
        setStats(statsData);
        setError(null);
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load submissions data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Apply filters when they change
  const applyFilters = useCallback(async () => {
    try {
      setLoading(true);
      const filtered = await filterSubmissions(
        searchTerm, 
        timeFilter, 
        gradeFilter, 
        statusFilter
      );
      setFilteredSubmissions(filtered);
    } catch (err) {
      console.error('Error applying filters:', err);
      setError('Failed to filter submissions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, timeFilter, gradeFilter, statusFilter]);

  // Call applyFilters when filter states change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setTimeFilter('All Time');
    setGradeFilter('All Grades');
    setStatusFilter('All Statuses');
  };

  return {
    // Data
    submissions,
    filteredSubmissions,
    stats,
    loading,
    error,
    
    // Filters
    searchTerm,
    setSearchTerm,
    timeFilter,
    setTimeFilter,
    gradeFilter,
    setGradeFilter,
    statusFilter,
    setStatusFilter,
    
    // Actions
    applyFilters,
    resetFilters
  };
};

export default useSubmissions;