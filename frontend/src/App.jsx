import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Sidebar from "./widgets/Sidebar";

import Login from "./pages/Login";
import Homepage from "./pages/Homepage";
import TeacherDashboard from "./pages/TeacherDashboard";
import ViewStudent from "./pages/ViewStudent";
import StudentDetails from "./pages/StudentDetails";

import TeacherProfile from "./pages/TeacherProfile";

import "./App.css";

function App() {
  // Manage authentication state (based on localStorage token)
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("authToken")
  );

  // Clears auth tokens, sets isAuthenticated to false
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    setIsAuthenticated(false);
  };

  return (
    <BrowserRouter>
      <div className="app-layout">
        {/* Show Sidebar only if user is authenticated */}
        {isAuthenticated && <Sidebar onLogout={handleLogout} />}

        {/* The main content area. If logged in, add padding for the sidebar */}
        <div className={isAuthenticated ? "main-content-area" : ""}>
          <Routes>
            {/* Public Homepage – if user is authenticated, redirect to /dashboard */}
            <Route
              path="/"
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <Homepage />
              }
            />

            {/* Login – if user is already authenticated, go to dashboard */}
            <Route
              path="/login"
              element={
                !isAuthenticated
                  ? <Login onLogin={() => setIsAuthenticated(true)} />
                  : <Navigate to="/dashboard" />
              }
            />

            {/* Teacher Dashboard (Protected) */}
            <Route
              path="/dashboard"
              element={
                isAuthenticated
                  ? <TeacherDashboard />
                  : <Navigate to="/login" />
              }
            />

            {/* View Student (Protected) */}
            <Route
              path="/view-student"
              element={
                isAuthenticated
                  ? <ViewStudent />
                  : <Navigate to="/login" />
              }
            />

            {/* Student Details (Protected) */}
            <Route
              path="/student-details/:id"
              element={
                isAuthenticated
                  ? <StudentDetails />
                  : <Navigate to="/login" />
              }
            />

            {/* Progress (Protected) */}
            <Route
              path="/progress"
              element={
                isAuthenticated
                  ? <div>Progress Page</div>
                  : <Navigate to="/login" />
              }
            />

            {/* Teacher Profile (Protected) */}
            <Route
              path="/teacher"
              element={
                isAuthenticated
                  ? <TeacherProfile />
                  : <Navigate to="/login" />
              }
            />

            {/* Catch-all → Redirect to root */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
