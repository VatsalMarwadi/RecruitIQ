// pages/Login.js (Updated to match)
import React, { useState } from "react";
import logo from "../assets/logo.png";
import api from "../configuration/api";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const loadingToast = toast.loading("Signing you in...");

    try {
      const response = await api.post("/authentication/login/", {
        email: form.email,
        password: form.password,
      });

      toast.dismiss(loadingToast);
      toast.success(response.data.message || "Login successful!");

      localStorage.setItem("token", response.data.access);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      if (response.data.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/candidate/dashboard");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      if (error.response?.status === 401) {
        toast.error("Invalid Email or Password.");
      } else if (error.response?.status === 403) {
        toast.error("Your account has been deactivated.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* LEFT: BRAND PANEL */}
      <div className="hidden md:flex md:w-2/5 flex-col items-center justify-center bg-slate-900 px-10 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <img src={logo} alt="RecruitIQ logo" className="w-44 object-contain" />
        </div>
        <h1 className="text-white text-2xl font-semibold mt-8 leading-snug">
          Welcome back
        </h1>
        <p className="text-slate-400 text-sm mt-3 max-w-xs leading-relaxed">
          Sign in to pick up right where you left off and keep your hiring
          journey moving forward.
        </p>
      </div>

      {/* RIGHT: FORM PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
          <div className="md:hidden flex justify-center mb-8">
            <img src={logo} alt="RecruitIQ logo" className="w-28 object-contain" />
          </div>

          <h2 className="text-3xl font-semibold text-slate-900 mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Sign in to continue to your account.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange("email")}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                placeholder="At least 8 characters"
                value={form.password}
                onChange={handleChange("password")}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-orange-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Signing In..." : "Log in"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-7">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-orange-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}