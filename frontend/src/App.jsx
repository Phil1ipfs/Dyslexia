// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// LOGIN
import Homepage from "./pages/Teachers/Homepage";
import ChooseAccountType from "./pages/ChooseAccountType";
import Login from "./pages/Login";

// Teacher
import TeacherDashboard from "./pages/Teachers/TeacherDashboard";
import ViewStudent from "./pages/Teachers/ViewStudent";
import StudentDetails from "./pages/Teachers/StudentDetails";
import TeacherProfile from "./pages/Teachers/TeacherProfile";
import ManageActivities from "./pages/Teachers/ManageActivities";


// Parent
const ParentDashboard = () => <div>Parent Dashboard Placeholder</div>;

// Admin
const AdminDashboard = () => <div>Admin Dashboard Placeholder</div>;

// Teacher Sidebar
import Sidebar from "./widgets/TeacherPage/Sidebar";


import "./App.css";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken")
  );

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    localStorage.removeItem("selectedUserType");
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Show teacher's sidebar if authenticated (optional) */}
        {isAuthenticated && <Sidebar onLogout={handleLogout} />}

        <div className={isAuthenticated ? "main-content-area" : ""}>
          <Routes>
            {/* If authenticated, show teacher dash at "/", else show Homepage */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/teacher-dashboard" />
                ) : (
                  <Homepage />
                )
              }
            />

            {/* Login Page: If already authenticated, go to teacher dash */}
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/teacher-dashboard" />
                ) : (
                  <Login onLogin={() => setIsAuthenticated(true)} />
                )
              }
            />

            {/* Choose Account Page (no authentication needed in this example) */}
            <Route
              path="/choose-account"
              element={<ChooseAccountType />}
            />

            {/* Teacher Dashboard (Protected) */}
            <Route
              path="/teacher-dashboard"
              element={
                isAuthenticated ? (
                  <TeacherDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* Parent Dashboard (Protected) */}
            <Route
              path="/parent-dashboard"
              element={
                isAuthenticated ? (
                  <ParentDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* Admin Dashboard (Protected) */}
            <Route
              path="/admin-dashboard"
              element={
                isAuthenticated ? (
                  <AdminDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* Teacher pages */}
            <Route
              path="/view-student"
              element={
                isAuthenticated ? (
                  <ViewStudent />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/student-details/:id"
              element={
                isAuthenticated ? (
                  <StudentDetails />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            <Route
              path="/manage-activities"
              element={
                isAuthenticated ? <ManageActivities /> : <Navigate to="/login" />
              }
            />
            <Route
              path="/teacher"
              element={
                isAuthenticated ? (
                  <TeacherProfile />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />

            {/* Catch-all → go Home */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
