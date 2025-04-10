import React from "react";
import { Outlet } from "react-router-dom";

const AdminLayout = ({ onLogout }) => {
  return (
    <div className="admin-layout">
      {/* Example sidebar, header, etc */}
      <Outlet /> {/* ✅ VERY IMPORTANT */}
    </div>
  );
};

export default AdminLayout;
