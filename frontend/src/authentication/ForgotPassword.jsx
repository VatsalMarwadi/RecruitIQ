import React, { useState } from "react";
import logo from "../assets/logo.png";
import { useNavigate, Link } from "react-router-dom";
import api from "../configuration/api";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirm_password: "",
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    const loadingToast = toast.loading("Updating your password...");

    const data = {
      email: form.email,
      password: form.password,
    };

    try {
      const response = await api.post(
        "/authentication/forgot-password/",
        data
      );

      toast.dismiss(loadingToast);

      toast.success(
        response.data.message || "Password updated successfully."
      );

      navigate("/login");
    } catch (error) {
      toast.dismiss(loadingToast);

      if (error.response?.status === 404) {
        toast.error("Email does not exist.");
      } else if (error.response?.status === 400) {
        toast.error(
          error.response?.data?.message || "Please check your details."
        );
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
          <img
            src={logo}
            alt="RecruitIQ logo"
            className="w-44 object-contain"
          />
        </div>
        <h1 className="text-white text-2xl font-semibold mt-8 leading-snug">
          Reset Your Password
        </h1>
        <p className="text-slate-400 text-sm mt-3 max-w-xs leading-relaxed">
          Enter your registered email address and choose a new password to
          regain access to your account.
        </p>
      </div>

      {/* RIGHT: FORM PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
          {/* mobile logo */}
          <div className="md:hidden flex justify-center mb-8">
            <img
              src={logo}
              alt="RecruitIQ logo"
              className="w-28 object-contain"
            />
          </div>

          <h2 className="text-3xl font-semibold text-slate-900 mb-1">
            Forgot Password
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Enter your email and create a new password.
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Re-enter password"
                  value={form.confirm_password}
                  onChange={handleChange("confirm_password")}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-orange-500 text-white text-sm font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Updating Password..." : "Reset Password"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-7">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-medium text-orange-600 hover:underline"
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
