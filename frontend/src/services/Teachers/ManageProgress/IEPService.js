import api from '../api';
import axios from 'axios';

class IEPService {
  
  // Get IEP report for a student
  static async getIEPReport(studentId, academicYear = null) {
    try {
      console.log(`[IEPService] Fetching IEP report for student: ${studentId}`);
      
      const params = {};
      if (academicYear) {
        params.academicYear = academicYear;
      }
      
      const response = await api.get(`/api/iep/student/${studentId}`, { params });
      
      console.log('[IEPService] IEP report fetched successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error fetching IEP report:', error);
      
      // Handle specific error cases
      if (error.response?.status === 404) {
        throw new Error('IEP report not found for this student');
      } else if (error.response?.status === 403) {
        throw new Error('You do not have permission to view this IEP report');
      } else if (error.response?.status === 401) {
        throw new Error('You must be logged in to access IEP reports');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to fetch IEP report');
    }
  }
  
  // Update support level for an IEP objective
  static async updateSupportLevel(studentId, objectiveId, supportLevel) {
    try {
      console.log(`Updating support level for objective ${objectiveId} to ${supportLevel}`);
      
      // Try the new endpoint first (direct objective update)
      try {
        const response = await api.patch(`/api/iep/objective/${objectiveId}/support-level`, {
          supportLevel,
          studentId
        });
        
        console.log('Support level update response:', response.data);
        return response.data;
      } catch (firstError) {
        console.warn('New API endpoint failed, trying legacy endpoint:', firstError.message);
        
        // Fall back to the legacy endpoint
        const response = await api.put(
          `/api/iep/student/${studentId}/objective/${objectiveId}/support-level`,
          { supportLevel }
        );
        
        console.log('Support level update response (legacy):', response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Error updating support level:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message 
      };
    }
  }
  
  // Update remarks for an objective
  static async updateRemarks(studentId, objectiveId, remarks) {
    try {
      console.log(`[IEPService] Updating remarks:`, {
        studentId,
        objectiveId,
        remarksLength: remarks?.length || 0
      });
      
      const response = await api.put(
        `/api/iep/student/${studentId}/objective/${objectiveId}/remarks`,
        { remarks: remarks || '' }
      );
      
      console.log('[IEPService] Remarks updated successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error updating remarks:', error);
      
      if (error.response?.status === 404) {
        throw new Error('Student or objective not found');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to update remarks');
    }
  }
  
  // Bulk update multiple objectives
  static async bulkUpdateObjectives(studentId, updates) {
    try {
      console.log(`[IEPService] Bulk updating objectives:`, {
        studentId,
        updateCount: updates?.length || 0
      });
      
      // Validate updates array
      if (!Array.isArray(updates)) {
        throw new Error('Updates must be an array');
      }
      
      // Validate each update object
      const validUpdates = updates.filter(update => {
        return update.objectiveId && (
          update.supportLevel || 
          update.hasOwnProperty('remarks')
        );
      });
      
      if (validUpdates.length === 0) {
        throw new Error('No valid updates provided');
      }
      
      const response = await api.put(
        `/api/iep/student/${studentId}/bulk-update`,
        { updates: validUpdates }
      );
      
      console.log('[IEPService] Bulk update completed successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error bulk updating objectives:', error);
      
      if (error.response?.status === 400) {
        throw new Error(error.response.data.error || 'Invalid update data');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to update objectives');
    }
  }
  
  // Get class IEP reports (for teacher dashboard)
  static async getClassIEPReports(studentIds = null, academicYear = null) {
    try {
      console.log(`[IEPService] Fetching class IEP reports:`, {
        studentIds: studentIds?.length || 'all',
        academicYear
      });
      
      const params = {};
      
      if (studentIds && Array.isArray(studentIds)) {
        params.studentIds = studentIds.join(',');
      }
      
      if (academicYear) {
        params.academicYear = academicYear;
      }
      
      const response = await api.get('/api/iep/class', { params });
      
      console.log('[IEPService] Class IEP reports fetched successfully:', {
        count: response.data?.count || 0
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error fetching class IEP reports:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch class IEP reports');
    }
  }
  
  // Create a new IEP report manually (if needed)
  static async createIEPReport(studentId, data = {}) {
    try {
      console.log(`[IEPService] Creating IEP report for student: ${studentId}`);
      
      const response = await api.post(`/api/iep/student/${studentId}`, data);
      
      console.log('[IEPService] IEP report created successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error creating IEP report:', error);
      
      if (error.response?.status === 409) {
        throw new Error('IEP report already exists for this student');
      }
      
      throw new Error(error.response?.data?.message || 'Failed to create IEP report');
    }
  }
  
  // Delete/Archive an IEP report
  static async archiveIEPReport(studentId, iepReportId) {
    try {
      console.log(`[IEPService] Archiving IEP report:`, {
        studentId,
        iepReportId
      });
      
      const response = await api.delete(`/api/iep/student/${studentId}/report/${iepReportId}`);
      
      console.log('[IEPService] IEP report archived successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error archiving IEP report:', error);
      throw new Error(error.response?.data?.message || 'Failed to archive IEP report');
    }
  }
  
  // Get IEP report history for a student
  static async getIEPHistory(studentId, limit = 10) {
    try {
      console.log(`[IEPService] Fetching IEP history for student: ${studentId}`);
      
      const params = { limit };
      const response = await api.get(`/api/iep/student/${studentId}/history`, { params });
      
      console.log('[IEPService] IEP history fetched successfully:', {
        count: response.data?.data?.length || 0
      });
      
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error fetching IEP history:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch IEP history');
    }
  }
  
  // Export IEP report as PDF (if implemented on backend)
  static async exportIEPAsPDF(studentId, iepReportId) {
    try {
      console.log(`[IEPService] Exporting IEP as PDF:`, {
        studentId,
        iepReportId
      });
      
      const response = await api.get(
        `/api/iep/student/${studentId}/report/${iepReportId}/export`,
        { responseType: 'blob' }
      );
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `IEP_Report_${studentId}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('[IEPService] IEP exported successfully');
      return { success: true, message: 'IEP report exported successfully' };
      
    } catch (error) {
      console.error('[IEPService] Error exporting IEP:', error);
      throw new Error(error.response?.data?.message || 'Failed to export IEP report');
    }
  }
  
  // Get IEP statistics for dashboard
  static async getIEPStatistics(classId = null, academicYear = null) {
    try {
      console.log(`[IEPService] Fetching IEP statistics`);
      
      const params = {};
      if (classId) params.classId = classId;
      if (academicYear) params.academicYear = academicYear;
      
      const response = await api.get('/api/iep/statistics', { params });
      
      console.log('[IEPService] IEP statistics fetched successfully:', response.data);
      return response.data;
      
    } catch (error) {
      console.error('[IEPService] Error fetching IEP statistics:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch IEP statistics');
    }
  }
  
  // Validate objective data before sending to server
  static validateObjectiveUpdate(update) {
    if (!update.objectiveId) {
      throw new Error('Objective ID is required');
    }
    
    if (update.supportLevel && !['minimal', 'moderate', 'extensive'].includes(update.supportLevel)) {
      throw new Error('Invalid support level');
    }
    
    if (update.remarks && typeof update.remarks !== 'string') {
      throw new Error('Remarks must be a string');
    }
    
    return true;
  }
  
  // Helper method to format IEP data for display
  static formatIEPDataForDisplay(iepData) {
    if (!iepData || !iepData.objectives) return null;
    
    return {
      ...iepData,
      objectives: iepData.objectives.map(objective => ({
        ...objective,
        categoryDisplayName: objective.categoryName
          ?.replace(/_/g, ' ')
          ?.replace(/\b\w/g, l => l.toUpperCase()),
        lastUpdatedFormatted: objective.lastUpdated 
          ? new Date(objective.lastUpdated).toLocaleDateString()
          : null,
        scorePercentage: `${objective.score || 0}%`,
        isPassingScore: (objective.score || 0) >= (objective.passingThreshold || 75)
      })),
      lastUpdatedFormatted: iepData.updatedAt 
        ? new Date(iepData.updatedAt).toLocaleDateString()
        : null
    };
  }
  
  // Add the refreshInterventionData method to the IEPService class
  static async refreshInterventionData(studentId) {
    try {
      const response = await api.put(`/api/iep/student/${studentId}/refresh-interventions`);
      return response.data;
    } catch (error) {
      console.error('Error refreshing intervention data:', error);
      throw error;
    }
  }
}

export default IEPService; 