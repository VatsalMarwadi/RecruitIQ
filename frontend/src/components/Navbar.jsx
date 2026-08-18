// src/components/Navbar.jsx
import React, { useState, useRef, useEffect } from "react";
import { FaBars, FaUserCircle, FaSignOutAlt, FaUser, FaBriefcase, FaFileAlt } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import { confirmLogout } from "./ToastConfirmation";

export default function Navbar({ toggleSidebar, user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Get user role from location or user object
  const isAdmin = location.pathname.startsWith("/admin");
  const userRole = user?.role || (isAdmin ? "admin" : "candidate");

  const performLogout = () => {
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refresh_token");
    
    toast.success("Logged out successfully!");
    
    setTimeout(() => {
      navigate("/login");
    }, 500);
  };

  const handleLogout = () => {
    confirmLogout(() => {
      performLogout();
    });
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900 flex items-center justify-between px-6 shadow-md z-50">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-white hover:text-orange-500 transition-colors p-1"
          aria-label="Toggle Sidebar"
        >
          <FaBars size={20} />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-white text-xl font-semibold tracking-tight">
            RecruitIQ
          </h1>
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            isAdmin ? 'bg-purple-600 text-white' : 'bg-blue-600 text-white'
          }`}>
            {isAdmin ? 'Admin' : 'Candidate'}
          </span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* User Greeting - Desktop */}
        <p className="hidden md:block text-slate-300 text-sm">
          Welcome,
          <span className="text-white font-semibold ml-1">
            {user?.name || "User"}
          </span>
        </p>

        {/* Role Badge */}
        <span className={`hidden sm:inline-block text-xs px-2 py-0.5 rounded-full ${
          isAdmin ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
        }`}>
          {isAdmin ? 'Administrator' : 'Candidate'}
        </span>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-2 text-slate-300 hover:text-orange-500 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-full p-1"
            aria-label="Profile Menu"
          >
            {user?.profile_picture ? (
              <img 
                src={user.profile_picture} 
                alt="Profile" 
                className="w-8 h-8 rounded-full object-cover border-2 border-slate-600"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-semibold">
                {getInitials(user?.name)}
              </div>
            )}
            <FaUserCircle size={32} className="hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-fadeIn">
              {/* User Info Header */}
              <div className="px-4 py-4 bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  {user?.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full object-cover border-2 border-slate-300"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 text-lg font-bold">
                      {getInitials(user?.name)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email || "user@example.com"}
                    </p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {isAdmin ? 'Admin' : 'Candidate'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                {/* Logout */}
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FaSignOutAlt size={14} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Animation Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </nav>
  );
}