// src/components/Navbar.js
import React, { useState, useRef, useEffect } from "react";
import { FaBars, FaUserCircle, FaSignOutAlt, FaUser } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { confirmLogout } from "./ToastConfirmation";

export default function Navbar({ toggleSidebar, user }) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const performLogout = () => {
    // Clear localStorage or session data
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("refresh_token");
    
    // Show success message
    toast.success("Logged out successfully!");
    
    // Redirect to login
    setTimeout(() => {
      navigate("/login");
    }, 500);
  };

  const handleLogout = () => {
    confirmLogout(() => {
      performLogout();
    });
  };

  // Toggle dropdown
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

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 bg-slate-900 flex items-center justify-between px-6 shadow-md z-50">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="text-white hover:text-orange-500 transition"
        >
          <FaBars size={20} />
        </button>

        <h1 className="text-white text-xl font-semibold">
          RecruitIQ
        </h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <p className="hidden md:block text-slate-300">
          Welcome,
          <span className="text-white font-semibold ml-1">
            {user?.name || "User"}
          </span>
        </p>

        {/* Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="text-slate-300 hover:text-orange-500 transition focus:outline-none"
          >
            <FaUserCircle size={32} />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-fadeIn">
              {/* User Info */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <FaUserCircle size={40} className="text-slate-400" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {user?.email || "user@example.com"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="py-1">
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