// Export all teacher services from this directory
import MainAssessmentService from './MainAssessmentService';
import TeacherService from './teacherService';
import ViewStudentService from './ViewStudentService';
import StudentDetailsService from './StudentDetailsService';
import CategoryResultsService from './CategoryResultsService';
import StudentApiService from './StudentApiService';
import DashboardApiService from './DashboardApiService';
import ChatbotService from './chatbotService';
import PreAssessmentService from './PreAssessmentService';

export {
  MainAssessmentService,
  TeacherService,
  ViewStudentService,
  StudentDetailsService,
  CategoryResultsService,
  StudentApiService,
  DashboardApiService,
  ChatbotService,
  PreAssessmentService
};

// Default export for backward compatibility
export default {
  MainAssessmentService,
  TeacherService,
  ViewStudentService,
  StudentDetailsService,
  CategoryResultsService,
  StudentApiService,
  DashboardApiService,
  ChatbotService,
  PreAssessmentService
}; 