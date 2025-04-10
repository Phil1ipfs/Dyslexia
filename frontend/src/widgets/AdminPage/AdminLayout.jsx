import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar"; // Adjust path if needed

const AdminLayout = ({ onLogout }) => {
  // State for sidebar navigation
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [expandedSections, setExpandedSections] = useState(["Dashboard"]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isOpen, setIsOpen] = useState(false);

  // Navigation items configuration
  const navItems = {
    main: ["Dashboard", "Prescriptive Analytics"],
    dashboardSubItems: ["Overview", "Reports", "Statistics"],
    userLists: ["Teachers", "Students", "Parents"]
  };

  // Handle section click
  const handleSectionClick = (section) => {
    setActiveSection(section);
    if (isMobile) {
      setIsOpen(false);
    }
  };

  // Toggle expand/collapse of sections
  const handleToggleExpand = (section) => {
    if (expandedSections.includes(section)) {
      setExpandedSections(expandedSections.filter(item => item !== section));
    } else {
      setExpandedSections([...expandedSections, section]);
    }
  };

  // Handle sidebar logout by calling the parent onLogout function
  const handleSidebarLogout = () => {
    // You can do additional cleanup here if needed
    onLogout(); // This calls the logout function from App.jsx
  };

  return (
    <div className="admin-layout">
      <Sidebar
        activeSection={activeSection}
        expandedSections={expandedSections}
        onSectionClick={handleSectionClick}
        onToggleExpand={handleToggleExpand}
        navItems={navItems}
        isMobile={isMobile}
        isOpen={isOpen}
        handleLogout={handleSidebarLogout}
      />
      <div className="admin-content">
        <Outlet /> {/* ✅ VERY IMPORTANT */}
      </div>
    </div>
  );
};

export default AdminLayout;