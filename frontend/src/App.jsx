import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Login from "./authentication/Login";
import Signup from "./authentication/Signup";
import ForgotPassword from "./authentication/ForgotPassword";
import Dashboard from "./candidate/Dashboard";
import AdminDashboard from "./admin/AdminDashboard";
import UserDetails from "./admin/pages/UserDetails";

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
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/candidate/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/admin/users/:id" element={<UserDetails />} />
      </Routes>
    </>
  );
}

export default App;