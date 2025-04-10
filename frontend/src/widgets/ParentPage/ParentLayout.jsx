import { Outlet } from "react-router-dom";

const ParentLayout = () => (
  <div>
    {/* Add Parent Sidebar/Nav/Header here */}
    <Outlet />
  </div>
);

export default ParentLayout;
