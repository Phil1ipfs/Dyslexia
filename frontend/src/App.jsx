// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Public Pages
import Homepage from "./pages/Teachers/Homepage";
import ChooseAccountType from "./pages/ChooseAccountType";
import Login from "./pages/Login";

// Teacher Pages
import TeacherDashboard from "./pages/Teachers/TeacherDashboard";
import ViewStudent from "./pages/Teachers/ViewStudent";
import ManageActivities from "./pages/Teachers/ManageActivities";
import TeacherProfile from "./pages/Teachers/TeacherProfile";
import StudentDetails from "./pages/Teachers/StudentDetails";

// Parent & Admin (Placeholder)
const ParentDashboard = () => <div>Parent Dashboard Placeholder</div>;
const AdminDashboard = () => <div>Admin Dashboard Placeholder</div>;

// Teacher Layout
import TeacherLayout from "./widgets/TeacherPage/TeacherLayout";

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
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? <Navigate to="/teacher/dashboard" /> : <Homepage />
          }
        />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/teacher/dashboard" />
            ) : (
              <Login onLogin={() => setIsAuthenticated(true)} />
            )
          }
        />
        <Route path="/choose-account" element={<ChooseAccountType />} />

        {/* ---------Parent & Admin -------*/}
        <Route
          path="/parent-dashboard"
          element={
            isAuthenticated ? <ParentDashboard /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/admin-dashboard"
          element={
            isAuthenticated ? <AdminDashboard /> : <Navigate to="/login" />
          }
        />

        {/* Protected Teacher Routes using TeacherLayout */}
        {isAuthenticated && (
          <Route path="/teacher/*" element={<TeacherLayout onLogout={handleLogout} />}>
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="view-student" element={<ViewStudent />} />
            <Route path="manage-activities" element={<ManageActivities />} />
            <Route path="profile" element={<TeacherProfile />} />
            <Route path="student-details/:id" element={<StudentDetails />} />
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
