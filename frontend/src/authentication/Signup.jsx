// pages/Signup.js (Updated to match)
import React, { useEffect, useState } from "react";
import logo from "../assets/logo.png";
import { useNavigate, Link } from "react-router-dom";
import api from "../configuration/api";
import toast from "react-hot-toast";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    date_of_birth: "",
    institute: "",
    password: "",
    confirm_password: "",
  });
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [institutes, setInstitutes] = useState([])

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    try {
      const response = await api.get("/authentication/get-institute/");
      setInstitutes(response.data.data);
    } catch (error) {
      toast.error("Failed to load institutes.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirm_password) {
      toast.error("Password Do Not Match!!!");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("Creating your account...");

    try {
      const response = await api.post("/authentication/signup/", {
        name: form.name,
        email: form.email,
        date_of_birth: form.date_of_birth,
        password: form.password,
      });

      toast.dismiss(loadingToast);
      toast.success(response.data.message || "Account created successfully!");

      setForm({
        name: "",
        email: "",
        date_of_birth: "",
        password: "",
        confirm_password: "",
      });

      navigate("/login");
    } catch (error) {
      toast.dismiss(loadingToast);

      if (error.response?.status === 409) {
        toast.error("Email already exists.");
      } else if (error.response?.status === 400) {
        toast.error("Please check the entered details.");
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
          Smarter hiring starts here
        </h1>
        <p className="text-slate-400 text-sm mt-3 max-w-xs leading-relaxed">
          Create your account to discover better matches and manage every step
          of your hiring journey in one place.
        </p>
      </div>

      {/* RIGHT: FORM PANEL */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-slate-50">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-slate-100 p-10">
          <div className="md:hidden flex justify-center mb-8">
            <img src={logo} alt="RecruitIQ logo" className="w-28 object-contain" />
          </div>

          <h2 className="text-3xl font-semibold text-slate-900 mb-1">
            Create your account
          </h2>
          <p className="text-sm text-slate-500 mb-8">
            Fill in your details to get started.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                placeholder="Alex Rivera"
                value={form.name}
                onChange={handleChange("name")}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

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
                Date of birth
              </label>
              <input
                type="date"
                required
                value={form.date_of_birth}
                onChange={handleChange("date_of_birth")}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Institute
              </label>

              <select
                required
                value={form.institute}
                onChange={handleChange("institute")}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">Select your institute</option>

                {institutes.map((institute) => (
                  <option key={institute.id} value={institute.id}>
                    {institute.name}
                  </option>
                ))}
              </select>
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
              className="w-full bg-slate-900 hover:bg-orange-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg transition-colors"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-7">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-orange-600 hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}