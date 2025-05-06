// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Public Pages
import Homepage from "./pages/Homepage";
import ChooseAccountType from "./pages/ChooseAccountType";
import Login from "./pages/Login";

// Teacher Pages
import TeacherDashboard from "./pages/Teachers/TeacherDashboard";
import ViewStudent from "./pages/Teachers/StudentDetails/ViewStudent";
import ManageActivities from "./pages/Teachers/ManageActivity/ManageActivities";
import TeacherProfile from "./pages/Teachers/TeacherProfile";
import StudentDetails from "./pages/Teachers/StudentDetails/StudentDetails";
import ManageProgress from "./pages/Teachers/ManageProgress/ManageProgress";
import StudentProgressView from "./pages/Teachers/ManageProgress/StudentProgressView";
import TeacherChatbot from "./pages/Teachers/Chatbot/TeacherChatbot"; 
import StudentProgressPDF from './pages/Teachers/StudentProgressPDF';

// Import activity-related pages
import CreateActivity from "./pages/Teachers/ManageActivity/CreateActivity";
import EditActivity from "./pages/Teachers/ManageActivity/EditActivity";
import PreviewActivity from "./pages/Teachers/ManageActivity/PreviewActivity";
import CreatePreAssessment from "./pages/Teachers/PreAssessment/CreatePreAssessment"; 

// Parent Pages
import ParentDashboard from "./pages/Parents/ParentDashboard";
import Feedback from "./pages/Parents/Feedback";  
import Progress from "./pages/Parents/Progress"; 

// Admin Pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import VisualChartsPage from "./pages/Admin/VisualChartsPage";
import SubmissionsOverview from './pages/Admin/SubmissionsOverview';
import StudentListPage from './pages/Admin/StudentListPage';

// Layouts
import TeacherLayout from "./components/TeacherPage/TeacherLayout";
import ParentLayout from "./components/ParentPage/ParentLayout";
import AdminLayout from "./components/Admin/AdminLayout";

import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ userRole, children }) => {
  const isAuth = !!localStorage.getItem("authToken");
  const userType = localStorage.getItem("userType");
  
  if (!isAuth) {
    return <Navigate to="/login" />;
  }
  
  if (userRole && userType !== userRole) {
    return <Navigate to={`/${userType}/dashboard`} />;
  }
  
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken")
  );
  const [userType, setUserType] = useState(
    localStorage.getItem("userType") || "teacher"
  );

  // Verify authentication and user role on app load
  useEffect(() => {
    // Check if auth token exists
    const token = localStorage.getItem("authToken");
    
    // If no token, not authenticated
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    
    // Get user data
    const userData = JSON.parse(localStorage.getItem("userData") || '{}');
    const roles = userData.roles || [];
    
    // Make sure userType matches actual role
    if (Array.isArray(roles)) {
      let newUserType = "user";
      
      if (roles.includes('parent') || roles.includes('magulang')) {
        newUserType = "parent";
      } else if (roles.includes('teacher') || roles.includes('guro')) {
        newUserType = "teacher";
      } else if (roles.includes('admin')) {
        newUserType = "admin";
      }
      
      localStorage.setItem('userType', newUserType);
      setUserType(newUserType);
    }
    
    setIsAuthenticated(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("userType");
    setIsAuthenticated(false);
    setUserType("teacher"); // Reset to default
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={`/${userType}/dashboard`} />
            ) : (
              <Homepage />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={`/${userType}/dashboard`} />
            ) : (
              <Login onLogin={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route path="/choose-account" element={<ChooseAccountType />} />

        {/* Protected Teacher Routes */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute userRole="teacher">
              <TeacherLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="view-student" element={<ViewStudent />} />
          <Route path="manage-activities" element={<ManageActivities />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="manage-progress" element={<ManageProgress />} />
          <Route path="student-progress/:id" element={<StudentProgressView />} />
          <Route path="student-details/:id" element={<StudentDetails />} />
          <Route path="chatbot" element={<TeacherChatbot />} />
          <Route path="student-report" element={<StudentProgressPDF />} />
          
          {/* Activity Management Routes */}
          <Route path="create-activity" element={<CreateActivity />} />
          <Route path="edit-activity/:id" element={<EditActivity />} />
          <Route path="preview-activity/:id" element={<PreviewActivity />} />
          
          {/* Pre-Assessment Routes */}
          <Route path="create-pre-assessment" element={<CreatePreAssessment />} />
          <Route index element={<Navigate to="dashboard" />} />
        </Route>

        {/* Protected Parent Routes */}
        <Route
          path="/parent/*"
          element={
            <ProtectedRoute userRole="parent">
              <ParentLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ParentDashboard />} />
          <Route path="feedback" element={<Feedback />} />
          <Route path="progress" element={<Progress />} />
          <Route index element={<Navigate to="dashboard" />} />
        </Route>

        {/* Protected Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute userRole="admin">
              <AdminLayout onLogout={handleLogout} />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="visual-charts" element={<VisualChartsPage />} />
          <Route path="submissions-overview" element={<SubmissionsOverview />} />
          <Route path="user-lists/student-list" element={<StudentListPage />} />

          
          <Route index element={<Navigate to="dashboard" />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;