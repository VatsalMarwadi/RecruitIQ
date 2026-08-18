// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaUser,
  FaBriefcase,
  FaGraduationCap,
  FaProjectDiagram,
  FaLanguage,
  FaTools,
  FaAward,
  FaUserTie,
  FaBuilding,
  FaChevronDown,
  FaChevronRight,
} from "react-icons/fa";

export default function Sidebar({ isOpen }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [expandedMenus, setExpandedMenus] = useState({});

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Auto-expand Profile menu if any sub-item is active
  useEffect(() => {
    const isProfileActive = location.pathname.startsWith("/candidate/profile");
    if (isProfileActive) {
      setExpandedMenus(prev => ({
        ...prev,
        ["/candidate/profile"]: true
      }));
    }
  }, [location.pathname]);

  const isAdmin = location.pathname.startsWith("/admin");

  // Toggle menu expansion
  const toggleMenu = (path, e) => {
    e.stopPropagation();
    setExpandedMenus(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Handle parent menu click
  const handleParentClick = (path, hasSubItems, isExpanded, e) => {
    // Don't navigate if clicking on the arrow
    if (e.target.closest('.toggle-arrow')) {
      return;
    }
    
    if (hasSubItems && isOpen) {
      if (isExpanded) {
        navigate(path);
      } else {
        setExpandedMenus(prev => ({
          ...prev,
          [path]: true
        }));
        navigate(path);
      }
    } else {
      navigate(path);
    }
  };

  // Check if any sub-item is active
  const hasActiveSub = (subItems) => {
    return subItems.some(subItem => location.pathname === subItem.path);
  };

  // Candidate Menu Items
  const candidateMenuItems = [
    {
      path: "/candidate/dashboard",
      icon: <FaHome />,
      label: "Dashboard",
      subItems: [],
    },
    {
      path: "/candidate/drive",
      icon: <FaBriefcase />,
      label: "Drives",
      subItems: [],
    },
    {
      path: "/candidate/profile",
      icon: <FaUser />,
      label: "Profile",
      subItems: [
        { path: "/candidate/profile", label: "Personal Info", icon: <FaUserTie /> },
        { path: "/candidate/profile/education", label: "Education", icon: <FaGraduationCap /> },
        { path: "/candidate/profile/experience", label: "Experience", icon: <FaBriefcase /> },
        { path: "/candidate/profile/skills", label: "Skills", icon: <FaTools /> },
        { path: "/candidate/profile/projects", label: "Projects", icon: <FaProjectDiagram /> },
        { path: "/candidate/profile/certifications", label: "Certifications", icon: <FaAward /> },
        { path: "/candidate/profile/languages", label: "Languages", icon: <FaLanguage /> },
      ],
    },
  ];

  // Admin Menu Items
  const adminMenuItems = [
    { path: "/admin/dashboard", icon: <FaHome />, label: "Dashboard", subItems: [] },
    { path: "/admin/users", icon: <FaUser />, label: "Users", subItems: [] },
    { path: "/admin/institute", icon: <FaBuilding />, label: "Institutes", subItems: [] },
    { path: "/admin/drive", icon: <FaBriefcase />, label: "Drives", subItems: [] },
  ];

  const menuItems = isAdmin ? adminMenuItems : candidateMenuItems;

  return (
    <aside
      className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r border-slate-200 transition-all duration-300 z-40 ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      <div className="h-full overflow-y-auto overflow-x-hidden">
        <div className="p-3 space-y-1">
          {/* Role Header */}
          {isOpen && (
            <div className="px-3 py-2 mb-2 text-xs font-medium text-slate-400 uppercase tracking-wider border-b border-slate-200">
              {isAdmin ? "Administration" : "Candidate Portal"}
            </div>
          )}

          {menuItems.map((item) => {
            const hasSubItems = item.subItems.length > 0;
            const isExpanded = expandedMenus[item.path] || false;
            
            // Check if this specific route is active
            const isThisRouteActive = location.pathname === item.path;
            
            // Check if any sub-item is active
            const isSubItemActive = hasActiveSub(item.subItems);
            
            // Parent should be highlighted if it's the exact route OR a sub-item is active
            const shouldHighlightParent = isThisRouteActive || isSubItemActive;

            return (
              <div key={item.path}>
                {/* Main Menu Item */}
                <div
                  onClick={(e) => handleParentClick(item.path, hasSubItems, isExpanded, e)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group cursor-pointer ${
                    shouldHighlightParent
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  } ${!isOpen ? "justify-center" : ""}`}
                  title={!isOpen ? item.label : ""}
                >
                  <span className={`text-lg ${!isOpen ? "scale-110" : ""}`}>
                    {item.icon}
                  </span>
                  {isOpen && (
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                  )}
                  
                  {/* Toggle Arrow - Inside the highlighted area */}
                  {isOpen && hasSubItems && (
                    <span
                      className={`toggle-arrow ml-auto text-xs transition-all duration-200 cursor-pointer hover:opacity-70 ${
                        shouldHighlightParent ? "text-white" : "text-slate-400"
                      }`}
                      onClick={(e) => toggleMenu(item.path, e)}
                    >
                      {isExpanded ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                    </span>
                  )}
                </div>

                {/* Sub-items - Only show when expanded */}
                {isOpen && hasSubItems && isExpanded && (
                  <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-slate-200 pl-3">
                    {item.subItems.map((subItem) => {
                      // Check if this specific sub-item is active
                      const isThisSubActive = location.pathname === subItem.path;
                      
                      return (
                        <NavLink
                          key={subItem.path}
                          to={subItem.path}
                          className={() =>
                            `flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                              isThisSubActive
                                ? "text-slate-900 font-medium bg-slate-100"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`
                          }
                        >
                          <span className={`text-xs ${isThisSubActive ? "text-slate-900" : "text-slate-400"}`}>
                            {subItem.icon}
                          </span>
                          {subItem.label}
                          {isThisSubActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-900"></span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Bottom Section */}
          {isOpen && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="px-3 py-2">
                <div className="text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    {isAdmin ? "Admin Panel" : "Candidate Portal"}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-300">
                    {isAdmin ? "Manage everything" : "Track your progress"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}