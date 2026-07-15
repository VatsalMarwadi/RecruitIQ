// pages/ResumeBuilder.js
import React, { useState } from "react";
import {
  FaUser,
  FaGraduationCap,
  FaBriefcase,
  FaTools,
  FaProjectDiagram,
  FaLanguage,
  FaAward,
} from "react-icons/fa";

// Import all tab components
import PersonalInfo from "../components/PersonalInfo";
import Education from "../components/Education";
import Experience from "../components/Experience";
import Skills from "../components/Skills";
import Projects from "../components/Projects";
import Languages from "../components/Languages";
import Certifications from "../components/Certifications";

const ResumeBuilder = () => {
  const [activeTab, setActiveTab] = useState("personal");

  // Tabs configuration
  const tabs = [
    { id: "personal", label: "Personal Info", icon: <FaUser /> },
    { id: "education", label: "Education", icon: <FaGraduationCap /> },
    { id: "experience", label: "Experience", icon: <FaBriefcase /> },
    { id: "skills", label: "Skills", icon: <FaTools /> },
    { id: "projects", label: "Projects", icon: <FaProjectDiagram /> },
    { id: "languages", label: "Languages", icon: <FaLanguage /> },
    { id: "certifications", label: "Certifications", icon: <FaAward /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        {/* <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Build Your Resume
          </h1>
        </div> */}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="border-b border-slate-200">
            <nav
              className="flex overflow-x-auto px-4 py-2 gap-1"
              aria-label="Tabs"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap
                    ${
                      activeTab === tab.id
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === "personal" && <PersonalInfo />}
            {activeTab === "education" && <Education />}
            {activeTab === "experience" && <Experience />}
            {activeTab === "skills" && <Skills />}
            {activeTab === "projects" && <Projects />}
            {activeTab === "languages" && <Languages />}
            {activeTab === "certifications" && <Certifications />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;