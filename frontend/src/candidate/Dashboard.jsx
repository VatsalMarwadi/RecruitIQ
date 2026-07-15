import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ResumeBuilder from "./pages/ResumeBuilder";
import toast from "react-hot-toast";

export default function Dashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));

    if (!userData) {
      navigate("/login");
      return;
    }

    setUser(userData);
  }, [navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    toast.success("Logged out successfully.");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar
        toggleSidebar={toggleSidebar}
        user={user}
        onLogout={handleLogout}
      />

      <Sidebar isOpen={isSidebarOpen} />

      <main
        className={`pt-20 p-6 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <ResumeBuilder />
      </main>
    </div>
  );
}