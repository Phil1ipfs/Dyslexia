// src/widgets/AdminPage/AdminLayout.jsx
import { Outlet } from "react-router-dom";

const AdminLayout = () => (
  <div>
    {/* Add Admin Sidebar/Nav/Header here */}
    <Outlet />
  </div>
);

export default AdminLayout;
