// App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./authentication/Login";
import Signup from "./authentication/Signup";
import ForgotPassword from "./authentication/ForgotPassword";

// Candidate Components
import Dashboard from "./candidate/Dashboard";
import { ResumeBuilder } from "./candidate/ResumeBuilder";
import CandidateDrive from "./candidate/CandidateDrive";
import { DriveDetails } from "./candidate/drive/DriveDetails";

// Aptitude Components
import { AptitudeInstructions } from "./candidate/aptitude/AptitudeInstruction";
import { AptitudeTest } from "./candidate/aptitude/AptitudeTest";

// Coding Components
import { CodingInstructions } from "./candidate/coding/CodingInstruction";
import { CodingTest } from "./candidate/coding/CodingTest";

// Profile Components
import { PersonalInfo } from "./candidate/profile/PersonalInfo";
import { Education } from "./candidate/profile/Education";
import { Experience } from "./candidate/profile/Experience";
import { Skills } from "./candidate/profile/Skills";
import { Projects } from "./candidate/profile/Projects";
import { Certifications } from "./candidate/profile/Certifications";
import { Languages } from "./candidate/profile/Languages";

// Admin Components
import AdminDashboard from "./admin/AdminDashboard";
import AdminUsers from "./admin/pages/users/UserList";
import UserDetails from "./admin/pages/users/UserDetails";
import Institute from "./admin/pages/institute/InstituteList";
import InstituteForm from "./admin/pages/institute/InstituteForm";
import Drive from "./admin/pages/drives/DriveList";
import DriveForm from "./admin/pages/drives/DriveForm";
import RoundForm from "./admin/pages/rounds/RoundForm";
import ViewDrive from "./admin/pages/drives/DriveDetails";

// Aptitude Components
import AptitudeRoundDetails from "./admin/pages/aptitude/AptitudeRoundDetails";
import AptitudeQuestionManagement from "./admin/pages/aptitude/AptitudeQuestionManagement";
import CandidateAptitudeResult from "./admin/pages/aptitude/components/CandidateResultView";
import AptitudeResultManagement from "./admin/pages/aptitude/AptitudeResultManagement";

// Coding Components
import CodingRoundDetails from "./admin/pages/coding/CodingRoundDetails";
import CodingQuestionManagement from "./admin/pages/coding/CodingQuestionManagement";
import CandidateCodingResult from "./admin/pages/coding/components/CandidateCodingResult";
import CodingQuestionForm from "./admin/pages/coding/components/CodingQuestionForm";
import CodingTestCaseForm from "./admin/pages/coding/components/CodingTestCaseForm";
import CodingResultManagement from "./admin/pages/coding/CodingResultManagement";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <>
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#1e293b",
            border: "1px solid #e2e8f0",
          },
        }}
      />

      <Routes>
        {/* Authentication Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* ============================================ */}
        {/* CANDIDATE ROUTES */}
        {/* ============================================ */}
        <Route
          path="/candidate"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        >
          {/* Dashboard Overview */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          {/* Resume Builder */}
          <Route path="resume" element={<ResumeBuilder />} />
          
          {/* Drive Routes */}
          <Route path="drive" element={<CandidateDrive />} />
          <Route path="drive/:driveId" element={<DriveDetails />} />

          {/* Aptitude Routes */}
          <Route path="aptitude/:roundId/instructions" element={<AptitudeInstructions />} />
          <Route path="aptitude/:roundId/test" element={<AptitudeTest />} />

          {/* Coding Routes */}
          <Route path="coding/:roundId/instructions" element={<CodingInstructions />} />
          <Route path="coding/:roundId/test" element={<CodingTest />} />

          {/* Profile Routes */}
          <Route path="profile" element={<PersonalInfo />} />
          <Route path="profile/education" element={<Education />} />
          <Route path="profile/experience" element={<Experience />} />
          <Route path="profile/skills" element={<Skills />} />
          <Route path="profile/projects" element={<Projects />} />
          <Route path="profile/certifications" element={<Certifications />} />
          <Route path="profile/languages" element={<Languages />} />

          {/* Settings */}
          <Route path="settings" element={<h1 className="text-2xl font-bold">Settings</h1>} />
          
          {/* Fallback for any unmatched candidate routes */}
          <Route path="*" element={<Navigate to="/candidate/dashboard" replace />} />
        </Route>

        {/* ============================================ */}
        {/* ADMIN ROUTES */}
        {/* ============================================ */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        >
          {/* /admin/dashboard */}
          <Route
            path="dashboard"
            element={<h1 className="text-2xl font-bold">Admin Dashboard</h1>}
          />

          {/* /admin/users */}
          <Route path="users" element={<AdminUsers />} />
          <Route path="users/:id" element={<UserDetails />} />

          {/* /admin/institute */}
          <Route path="institute" element={<Institute />} />
          <Route path="institute/add" element={<InstituteForm />} />
          <Route path="institute/edit/:id" element={<InstituteForm />} />

          {/* /admin/drive */}
          <Route path="drive" element={<Drive />} />
          <Route path="drive/add" element={<DriveForm />} />
          <Route path="drive/edit/:id" element={<DriveForm />} />
          
          {/* /admin/drive/view/:id */}
          <Route path="drive/view/:id" element={<ViewDrive />} />

          {/* /admin/drive/:driveId/rounds */}
          <Route path="drive/:driveId/rounds/add" element={<RoundForm />} />
          <Route path="drive/:driveId/rounds/edit/:roundId" element={<RoundForm />} />

          {/* Aptitude Routes */}
          <Route path="aptitude-round/:roundId">
            <Route index element={<AptitudeRoundDetails />} />
            <Route path="questions" element={<AptitudeQuestionManagement />} />
            <Route path="result/:attemptId" element={<CandidateAptitudeResult />} />
            <Route path="manage-results" element={<AptitudeResultManagement />} />
          </Route>

          {/* Coding Routes */}
          <Route path="coding-round/:roundId">
            <Route index element={<CodingRoundDetails />} />
            <Route path="questions" element={<CodingQuestionManagement />} />
            <Route path="result/:attemptId" element={<CandidateCodingResult />} />
            <Route path="manage-results" element={<CodingResultManagement />} />
          </Route>

          {/* Coding Round Details with driveId */}
          <Route path="/admin/drive/:driveId/round/:roundId/coding-round" element={<CodingRoundDetails />} />

          {/* Coding Question & Test Case Management Routes with driveId */}
          <Route path="/admin/drive/:driveId/round/:roundId/coding-questions" element={<CodingQuestionManagement />} />
          <Route path="/admin/drive/:driveId/round/:roundId/coding-question/add" element={<CodingQuestionForm />} />
          <Route path="/admin/drive/:driveId/round/:roundId/coding-question/edit/:questionId" element={<CodingQuestionForm />} />
          <Route path="/admin/drive/:driveId/round/:roundId/coding-question/:questionId/testcase/add" element={<CodingTestCaseForm />} />
          <Route path="/admin/drive/:driveId/round/:roundId/coding-question/:questionId/testcase/edit/:testCaseId" element={<CodingTestCaseForm />} />
        </Route>

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;