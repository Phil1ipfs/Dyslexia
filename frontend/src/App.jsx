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
import ManageCategories from "./pages/Teachers/ManageCategories/ManageCategories";
import TeacherProfile from "./pages/Teachers/TeacherProfile";
import StudentDetails from "./pages/Teachers/StudentDetails/StudentDetails";
import ManageProgress from "./pages/Teachers/ManageProgress/ManageProgress";
import StudentProgressView from "./pages/Teachers/ManageProgress/StudentProgressView";
import TeacherChatbot from "./pages/Teachers/Chatbot/TeacherChatbot"; 
import StudentProgressPDF from './pages/Teachers/StudentProgressPDF';

// Parent Pages
import ParentDashboard from "./pages/Parents/ParentDashboard";
import Feedback from "./pages/Parents/Feedback";  

// Admin Pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import VisualChartsPage from "./pages/Admin/VisualChartsPage";
import SubmissionsOverview from './pages/Admin/SubmissionsOverview';
import StudentListPage from './pages/Admin/StudentListPage';
import TeacherListPage from './pages/Admin/TeacherLists';
import ParentListPage from './pages/Admin/ParentsPage';

// Layouts
import TeacherLayout from "./components/TeacherPage/TeacherLayout";
import ParentLayout from "./components/ParentPage/ParentLayout";
import AdminLayout from "./components/Admin/AdminLayout";

import "./App.css";

// Helper function to determine user type from roles
const getUserTypeFromRoles = (roles) => {
  // Default to teacher if no role is found
  let userType = "teacher";
  
  // Handle different formats of roles data
  if (!roles) {
    return userType;
  }
  
  // Handle array of roles
  if (Array.isArray(roles)) {
    if (roles.includes('admin')) {
      userType = "admin";
    } else if (roles.includes('parent') || roles.includes('magulang')) {
      userType = "parent";
    } else if (roles.includes('teacher') || roles.includes('guro')) {
      userType = "teacher";
    } 
    return userType;
  }
  
  // Handle string role
  if (typeof roles === 'string') {
    if (roles === 'admin') {
      return "admin";
    } else if (roles === 'parent' || roles === 'magulang') {
      return "parent";
    } else if (roles === 'teacher' || roles === 'guro') {
      return "teacher";
    }
  }
  
  return userType;
};

// Protected Route Component
const ProtectedRoute = ({ userRole, children }) => {
  // Get the token from localStorage
  const authToken = localStorage.getItem("authToken");
  const isAuth = authToken !== null;
  
  // Get the user type from localStorage
  const storedUserType = localStorage.getItem("userType");
  
  // Try to get more accurate user type from userData if available
  let userType = storedUserType || "teacher";
  
  try {
    const userDataString = localStorage.getItem("userData");
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      if (userData && userData.roles) {
        // Use helper function to determine user type from roles
        const detectedUserType = getUserTypeFromRoles(userData.roles);
        
        // Update localStorage if needed
        if (detectedUserType !== storedUserType) {
          localStorage.setItem("userType", detectedUserType);
        }
        
        userType = detectedUserType;
      }
    }
  } catch (error) {
    console.error("Error processing user data in ProtectedRoute:", error);
  }
  
  // If not authenticated, redirect to login
  if (!isAuth) {
    console.log("Not authenticated, redirecting to login");
    return <Navigate to="/login" replace />;
  }
  
  // If user role doesn't match required role, redirect to appropriate dashboard
  if (userRole && userType !== userRole) {
    console.log(`User type ${userType} doesn't match required role ${userRole}, redirecting`);
    return <Navigate to={`/${userType}/dashboard`} replace />;
  }
  
  // Otherwise, render children
  return children;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => 
    localStorage.getItem("authToken") !== null
  );
  
  const [userType, setUserType] = useState(() => 
    localStorage.getItem("userType") || "teacher"
  );

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    
    try {
      const userDataString = localStorage.getItem("userData");
      if (!userDataString) return;
      
      const userData = JSON.parse(userDataString);
      if (!userData) return;
      
      // Determine user type based on roles
      const newUserType = getUserTypeFromRoles(userData.roles);
      
      // Only update if different
      if (newUserType !== userType) {
        console.log(`Updating user type from ${userType} to ${newUserType}`);
        localStorage.setItem('userType', newUserType);
        setUserType(newUserType);
      }
      
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Error processing user data:", error);
    }
  }, [localStorage.getItem("authToken")]); // Re-run when auth token changes

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("userType");
    setIsAuthenticated(false);
    setUserType("teacher"); // Reset to default
  };

  const handleLogin = () => {
    // Get the most up-to-date user type from localStorage
    const currentUserType = localStorage.getItem("userType") || "teacher";
    
    // Log what's happening
    console.log(`Login handler called, setting authenticated=true, userType=${currentUserType}`);
    
    setIsAuthenticated(true);
    setUserType(currentUserType);
  };

  console.log("App render - Auth:", isAuthenticated, "UserType:", userType);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to={`/${userType}/dashboard`} replace />
            ) : (
              <Homepage />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to={`/${userType}/dashboard`} replace />
            ) : (
              <Login onLogin={handleLogin} />
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
          <Route path="manage-categories" element={<ManageCategories />} />
          <Route path="profile" element={<TeacherProfile />} />
          <Route path="manage-progress" element={<ManageProgress />} />
          <Route path="student-progress/:id" element={<StudentProgressView />} />
          <Route path="student-details/:id" element={<StudentDetails />} />
          <Route path="chatbot" element={<TeacherChatbot />} />
          <Route path="student-report" element={<StudentProgressPDF />} />
          
          <Route index element={<Navigate to="dashboard" replace />} />
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
          <Route index element={<Navigate to="dashboard" replace />} />
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
          <Route path="student-list" element={<StudentListPage />} />
          <Route path="teacher-list" element={<TeacherListPage />} />
          <Route path="parent-list" element={<ParentListPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;