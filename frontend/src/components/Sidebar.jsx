import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaFileAlt,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

export default function Sidebar({ isOpen }) {
  const menuItemsCandidate = [
    {
      path: "/candidate/dashboard",
      icon: <FaHome />,
      label: "Dashboard",
    },
    {
      path: "/candidate/profile",
      icon: <FaUser />,
      label: "My Profile",
    },
    {
      path: "/candidate/documents",
      icon: <FaFileAlt />,
      label: "Documents",
    },
    {
      path: "/candidate/settings",
      icon: <FaCog />,
      label: "Settings",
    },
  ];

  const menuItemsAdmin = [
    {
      path: "/admin/dashboard",
      icon: <FaHome />,
      label: "Dashboard",
    },
    {
      path: "/admin/users",
      icon: <FaUser />,
      label: "User",
    },
    {
      path: "/admin/exam",
      icon: <FaFileAlt />,
      label: "Exam",
    },
    {
      path: "/admin/settings",
      icon: <FaCog />,
      label: "Settings",
    },
  ];

  const userData = localStorage.getItem("user");
  const user = userData ? JSON.parse(userData) : null;
  const menuItems = user?.role === "admin" ? menuItemsAdmin : menuItemsCandidate;

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r border-slate-200 transition-all duration-300 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="p-3 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition ${
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>

            {isOpen && <span>{item.label}</span>}
          </NavLink>
        ))}

      </div>
    </aside>
  );
}