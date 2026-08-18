// admin/pages/drives/DriveForm.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../configuration/api";
import { FaArrowLeft, FaSave, FaInfoCircle } from "react-icons/fa";

export default function DriveForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [institutes, setInstitutes] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    job_role: "",
    description: "",
    ctc: "",
    job_location: "",
    institute: "",
    drive_date_time: "",
  });
  const [currentStatus, setCurrentStatus] = useState("");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }
    fetchInstitutes();
    if (isEditMode) fetchDriveData();
  }, [id]);

  const fetchInstitutes = async () => {
    try {
      const response = await api.get("/canadmin/get-admin-institute/");
      if (response.data.success) setInstitutes(response.data.data);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error("Failed to load institutes");
      }
    }
  };

  const fetchDriveData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/canadmin/get-drive/");

      if (response.data.success) {
        const drive = response.data.data.find(d => d.id === parseInt(id));
        if (drive) {
          setCurrentStatus(drive.status || "draft");
          setFormData({
            title: drive.title || "",
            job_role: drive.job_role || "",
            description: drive.description || "",
            ctc: drive.ctc || "",
            job_location: drive.job_location || "",
            institute: drive.institute || "",
            drive_date_time: drive.drive_date_time ? drive.drive_date_time.slice(0, 16) : "",
          });
        } else {
          toast.error("Drive not found");
          navigate("/admin/drive");
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error("Failed to load drive");
        navigate("/admin/drive");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
      published: { label: "Published", color: "bg-blue-100 text-blue-800" },
      in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
      completed: { label: "Completed", color: "bg-green-100 text-green-800" },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
    };
    return config[status] || config.draft;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if drive is completed or cancelled
    if (["completed", "cancelled"].includes(currentStatus)) {
      toast.error(`Cannot modify a ${currentStatus} drive.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = { ...formData };
      if (isEditMode) submitData.id = parseInt(id);

      // The interceptor will automatically add the token
      const response = await api.post("/canadmin/add-update-drive/", submitData);

      if (response.data.success) {
        toast.success(isEditMode ? "Drive updated successfully!" : "Drive added successfully!");
        navigate("/admin/drive");
      } else {
        toast.error(response.data.message || "Failed to save");
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      } else {
        toast.error(error.response?.data?.message || "Failed to save");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/drive");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  const statusConfig = getStatusBadge(currentStatus);
  const isFinalStatus = ["completed", "cancelled"].includes(currentStatus);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaArrowLeft className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? "Edit Drive" : "Add Drive"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditMode ? "Update drive details" : "Register a new placement drive"}
          </p>
        </div>
        {isEditMode && currentStatus && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        )}
      </div>

      {/* Status Info Banner */}
      {isEditMode && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-700">
              <strong>Status Automation:</strong> Drive status is automatically managed.
            </p>
            <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
              <li>• New drives start as <strong>Draft</strong></li>
              <li>• Auto-publishes when drive date/time arrives</li>
              <li>• Auto-updates to <strong>In Progress</strong> when first round becomes active</li>
              <li>• Auto-updates to <strong>Completed</strong> when all rounds are completed</li>
              {isFinalStatus && (
                <li className="text-red-600">This drive is {currentStatus}. No further changes allowed.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drive Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={isFinalStatus}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Enter drive title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Role <span className="text-red-500">*</span>
              </label>
              <input
                name="job_role"
                value={formData.job_role}
                onChange={handleChange}
                required
                disabled={isFinalStatus}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Software Engineer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CTC <span className="text-red-500">*</span>
              </label>
              <input
                name="ctc"
                value={formData.ctc}
                onChange={handleChange}
                required
                disabled={isFinalStatus}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="10 LPA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Location <span className="text-red-500">*</span>
              </label>
              <input
                name="job_location"
                value={formData.job_location}
                onChange={handleChange}
                required
                disabled={isFinalStatus}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Mumbai"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institute <span className="text-red-500">*</span>
              </label>
              <select
                name="institute"
                value={formData.institute}
                onChange={handleChange}
                required
                disabled={isFinalStatus}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
              >
                <option value="">Select Institute</option>
                {institutes.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.name} ({inst.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date & Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                name="drive_date_time"
                value={formData.drive_date_time}
                onChange={handleChange}
                required
                disabled={isFinalStatus}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
              />
              <p className="mt-1 text-xs text-gray-500">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                disabled={isFinalStatus}
                rows="4"
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="Enter drive description (e.g., job responsibilities, requirements, etc.)"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isFinalStatus}
              className={`flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isFinalStatus ? "cursor-not-allowed" : ""}`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave size={14} />
                  {isEditMode ? "Update Drive" : "Add Drive"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}