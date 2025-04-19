// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Public Pages
import Homepage from "./pages/Homepage";
import ChooseAccountType from "./pages/ChooseAccountType";
import Login from "./pages/Login";

// Teacher Pages
import TeacherDashboard from "./pages/Teachers/TeacherDashboard";
import ViewStudent from "./pages/Teachers/ViewStudent";
import ManageActivities from "./pages/Teachers/ManageActivities";
import TeacherProfile from "./pages/Teachers/TeacherProfile";
import StudentDetails from "./pages/Teachers/StudentDetails";
import ManageProgress from "./pages/Teachers/ManageProgress";
import StudentProgressView from "./pages/Teachers/StudentProgressView";
import CreatePracticeModule from "./pages/Teachers/CreatePracticeModule";
// Import new activity-related pages
import CreateActivity from "./pages/Teachers/CreateActivity";
import EditActivity from "./pages/Teachers/EditActivity";
import PreviewActivity from "./pages/Teachers/PreviewActivity";

// Parent Pages
import ParentDashboard from "./pages/Parents/ParentDashboard";
import Feedback from "./pages/Parents/Feedback";  
import Progress from "./pages/Parents/Progress"; 

// Admin Pages
import AdminDashboard from "./pages/Admin/AdminDashboard";
import VisualChartsPage from "./pages/Admin/VisualChartsPage";

// Layouts
import TeacherLayout from "./components/TeacherPage/TeacherLayout";
import ParentLayout from "./components/ParentPage/ParentLayout";
import AdminLayout from "./components/Admin/AdminLayout";

import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken")
  );

  // Determine user type from localStorage; default to "teacher" if not set
  const userType = localStorage.getItem("userType") || "teacher";

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("userType");
    setIsAuthenticated(false);
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
        {isAuthenticated && userType === "teacher" && (
          <Route path="/teacher/*" element={<TeacherLayout onLogout={handleLogout} />}>
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="view-student" element={<ViewStudent />} />
            <Route path="manage-activities" element={<ManageActivities />} />
            <Route path="profile" element={<TeacherProfile />} />
            <Route path="manage-progress" element={<ManageProgress />} />
            <Route path="student-progress/:id" element={<StudentProgressView />} />
            <Route path="student-details/:id" element={<StudentDetails />} />
            <Route path="create-practice-module" element={<CreatePracticeModule />} />
            
            {/* New Activity Routes */}
            <Route path="create-activity" element={<CreateActivity />} />
            <Route path="edit-activity/:id" element={<EditActivity />} />
            <Route path="preview-activity/:id" element={<PreviewActivity />} />

            <Route index element={<Navigate to="dashboard" />} />
          </Route>
        )}

        {/* Protected Parent Routes */}
        {isAuthenticated && userType === "parent" && (
          <Route path="/parent/*" element={<ParentLayout onLogout={handleLogout} />}>
            <Route path="dashboard" element={<ParentDashboard />} />
            <Route path="feedback" element={<Feedback />} />
            <Route path="progress" element={<Progress />} />
          </Route>
        )}

        {/* Protected Admin Routes */}
        {isAuthenticated && userType === "admin" && (
          <Route path="/admin/*" element={<AdminLayout onLogout={handleLogout} />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="visual-charts" element={<VisualChartsPage />} />
            
            {/* Add additional Admin routes here */}
            <Route index element={<Navigate to="dashboard" />} />
          </Route>
        )}

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;