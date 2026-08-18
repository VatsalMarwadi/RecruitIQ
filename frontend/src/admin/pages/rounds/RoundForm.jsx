// admin/pages/rounds/RoundForm.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../configuration/api";
import { FaArrowLeft, FaSave, FaInfoCircle, FaClock } from "react-icons/fa";

export default function RoundForm() {
  const navigate = useNavigate();
  const { driveId, roundId } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [driveDate, setDriveDate] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("");

  const [formData, setFormData] = useState({
    drive: driveId || "",
    round_type: "",
    round_order: "",
    round_start_time: "",
    round_duration_minutes: "",
    test_duration_minutes: "",
    meeting_link: "",
  });

  const [errors, setErrors] = useState({});
  const [showMeetingLink, setShowMeetingLink] = useState(false);

  const roundTypes = [
    { value: "aptitude", label: "Aptitude" },
    { value: "coding", label: "Coding" },
    { value: "gd", label: "Group Discussion" },
    { value: "technical", label: "Technical Interview" },
    { value: "hr", label: "HR Interview" },
  ];

  const interviewRounds = ["gd", "technical", "hr"];

  useEffect(() => {
    if (driveId) {
      fetchDriveDetails();
    }
    if (roundId) {
      setIsEditing(true);
    }
  }, [driveId, roundId]);

  const fetchDriveDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/canadmin/get-drive-details/${driveId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const driveData = response.data.data;
        setDriveDate(driveData.drive_date_time);
        
        if (roundId) {
          fetchRoundDetails(driveData);
        }
      } else {
        toast.error(response.data.message || "Failed to load drive details");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load drive details");
    }
  };

  const fetchRoundDetails = async (driveData) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");

      const roundData = driveData.rounds.find(
        (round) => round.id === parseInt(roundId),
      );

      if (!roundData) {
        toast.error("Round not found");
        navigate(`/admin/drive/view/${driveId}`);
        return;
      }

      let roundTimeOnly = "";
      if (roundData.round_start_datetime) {
        const date = new Date(roundData.round_start_datetime);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        roundTimeOnly = `${hours}:${minutes}`;
      }

      setCurrentStatus(roundData.status || "pending");

      setFormData({
        drive: driveData.id,
        round_type: roundData.round_type,
        round_order: roundData.round_order,
        round_start_time: roundTimeOnly,
        round_duration_minutes: roundData.round_duration_minutes || 60,
        test_duration_minutes: roundData.test_duration_minutes || 30,
        meeting_link: roundData.meeting_link || "",
      });

      if (interviewRounds.includes(roundData.round_type)) {
        setShowMeetingLink(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load round details");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "round_type") {
      if (interviewRounds.includes(value)) {
        setShowMeetingLink(true);
      } else {
        setShowMeetingLink(false);
        setFormData((prev) => ({ ...prev, meeting_link: "" }));
      }
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
      active: { label: "Active", color: "bg-green-100 text-green-800" },
      completed: { label: "Completed", color: "bg-gray-100 text-gray-600" },
      cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
    };
    return config[status] || config.pending;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.round_type) newErrors.round_type = "Please select a round type";
    if (!formData.round_order) newErrors.round_order = "Round order is required";
    else if (formData.round_order < 1) newErrors.round_order = "Round order must be at least 1";

    if (!formData.round_start_time) newErrors.round_start_time = "Round start time is required";
    else {
      const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timePattern.test(formData.round_start_time)) {
        newErrors.round_start_time = "Please enter a valid time in HH:MM format";
      }
    }

    if (!formData.round_duration_minutes) newErrors.round_duration_minutes = "Round duration is required";
    else if (formData.round_duration_minutes < 1) newErrors.round_duration_minutes = "Round duration must be at least 1 minute";

    if (!formData.test_duration_minutes) newErrors.test_duration_minutes = "Test duration is required";
    else if (formData.test_duration_minutes < 1) newErrors.test_duration_minutes = "Test duration must be at least 1 minute";
    else if (parseInt(formData.test_duration_minutes) > parseInt(formData.round_duration_minutes)) {
      newErrors.test_duration_minutes = "Test duration cannot be longer than round duration";
    }

    if (interviewRounds.includes(formData.round_type) && !formData.meeting_link) {
      newErrors.meeting_link = "Meeting link is required for this round type";
    }

    if (formData.meeting_link) {
      const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
      if (!urlPattern.test(formData.meeting_link)) {
        newErrors.meeting_link = "Please enter a valid URL";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (["completed", "cancelled"].includes(currentStatus)) {
      toast.error(`Cannot modify a ${currentStatus} round.`);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      let roundStartDateTime = null;
      if (driveDate && formData.round_start_time) {
        const driveDateObj = new Date(driveDate);
        const [hours, minutes] = formData.round_start_time.split(':');
        driveDateObj.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        roundStartDateTime = driveDateObj.toISOString();
      }

      const payload = {
        ...formData,
        drive: parseInt(formData.drive),
        round_order: parseInt(formData.round_order),
        round_duration_minutes: parseInt(formData.round_duration_minutes),
        test_duration_minutes: parseInt(formData.test_duration_minutes),
        round_start_datetime: roundStartDateTime,
      };

      delete payload.round_start_time;

      if (isEditing && roundId) {
        payload.id = parseInt(roundId);
      }

      const response = await api.post("/canadmin/add-update-round/", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success(response.data.message);
        navigate(`/admin/drive/view/${formData.drive}`);
      } else {
        toast.error(response.data.message || "Failed to save round");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save round");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/admin/drive/view/${formData.drive}`);
  };

  const formatDriveDate = (dateString) => {
    if (!dateString) return "Loading...";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const statusConfig = getStatusBadge(currentStatus);
  const isFinalStatus = ["completed", "cancelled"].includes(currentStatus);

  if (isLoading && isEditing) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/admin/drive/view/${formData.drive}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaArrowLeft className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Edit Round" : "Add Round"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isEditing ? "Update round details" : "Configure a new round for this drive"}
          </p>
          {driveDate && (
            <p className="text-sm text-blue-600 mt-1">
              <FaClock className="inline mr-1" size={12} />
              Drive Date: {formatDriveDate(driveDate)}
            </p>
          )}
        </div>
        {isEditing && currentStatus && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-gray-500">Status:</span>
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
          </div>
        )}
      </div>

      {/* Status Info Banner */}
      {isEditing && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FaInfoCircle className="text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-700">
              <strong>Status Automation:</strong> Round status is automatically managed.
            </p>
            <ul className="text-xs text-blue-600 mt-1 space-y-0.5">
              <li>• New rounds start as <strong>Pending</strong></li>
              <li>• Auto-updates to <strong>Active</strong> when Round Start Time arrives</li>
              <li>• Candidates can take test only during <strong>Test Duration</strong> window</li>
              <li>• Auto-updates to <strong>Completed</strong> after Round Duration expires</li>
              {isFinalStatus && (
                <li className="text-red-600">This round is {currentStatus}. No further changes allowed.</li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Round Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Round Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {roundTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => {
                    if (isFinalStatus) return;
                    setFormData((prev) => ({ ...prev, round_type: type.value }));
                    if (errors.round_type) setErrors((prev) => ({ ...prev, round_type: "" }));
                    if (interviewRounds.includes(type.value)) {
                      setShowMeetingLink(true);
                    } else {
                      setShowMeetingLink(false);
                      setFormData((prev) => ({ ...prev, meeting_link: "" }));
                    }
                  }}
                  disabled={isFinalStatus}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    isFinalStatus ? "cursor-not-allowed opacity-50" : ""
                  } ${
                    formData.round_type === type.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="text-xs font-medium text-gray-700 mt-1">{type.label}</div>
                </button>
              ))}
            </div>
            {errors.round_type && (
              <p className="mt-2 text-sm text-red-500">{errors.round_type}</p>
            )}
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Round Order <span className="text-red-500">*</span>
              </label>
              <input
                name="round_order"
                type="number"
                min="1"
                value={formData.round_order}
                onChange={handleChange}
                disabled={isFinalStatus}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  errors.round_order ? "border-red-500" : "border-gray-300"
                } ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="e.g., 1, 2, 3..."
              />
              {errors.round_order && (
                <p className="mt-1 text-xs text-red-500">{errors.round_order}</p>
              )}
            </div>

            {/* Round Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  <FaClock className="text-blue-500" />
                  Round Start Time <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                name="round_start_time"
                type="time"
                value={formData.round_start_time}
                onChange={handleChange}
                disabled={isFinalStatus}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  errors.round_start_time ? "border-red-500" : "border-gray-300"
                } ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
                step="60"
              />
              {errors.round_start_time && (
                <p className="mt-1 text-xs text-red-500">{errors.round_start_time}</p>
              )}
            </div>

            {/* Round Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  <FaClock className="text-purple-500" />
                  Round Duration (minutes) <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                name="round_duration_minutes"
                type="number"
                min="1"
                value={formData.round_duration_minutes}
                onChange={handleChange}
                disabled={isFinalStatus}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  errors.round_duration_minutes ? "border-red-500" : "border-gray-300"
                } ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="e.g., 60"
              />
              {errors.round_duration_minutes && (
                <p className="mt-1 text-xs text-red-500">{errors.round_duration_minutes}</p>
              )}
            </div>

            {/* Test Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <span className="flex items-center gap-1">
                  <FaClock className="text-green-500" />
                  Test Duration (minutes) <span className="text-red-500">*</span>
                </span>
              </label>
              <input
                name="test_duration_minutes"
                type="number"
                min="1"
                value={formData.test_duration_minutes}
                onChange={handleChange}
                disabled={isFinalStatus}
                className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                  errors.test_duration_minutes ? "border-red-500" : "border-gray-300"
                } ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
                placeholder="e.g., 30"
              />
              {errors.test_duration_minutes && (
                <p className="mt-1 text-xs text-red-500">{errors.test_duration_minutes}</p>
              )}
            </div>

            {showMeetingLink && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Link <span className="text-red-500">*</span>
                </label>
                <input
                  name="meeting_link"
                  type="url"
                  value={formData.meeting_link}
                  onChange={handleChange}
                  disabled={isFinalStatus}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${
                    errors.meeting_link ? "border-red-500" : "border-gray-300"
                  } ${isFinalStatus ? "bg-gray-100 cursor-not-allowed" : ""}`}
                  placeholder="https://meet.google.com/abc-defg-hij"
                />
                {errors.meeting_link && (
                  <p className="mt-1 text-xs text-red-500">{errors.meeting_link}</p>
                )}
              </div>
            )}
          </div>

          {/* Timing Visualization */}
          {formData.round_start_time && formData.round_duration_minutes && formData.test_duration_minutes && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Timeline Visualization</h4>
              <div className="relative">
                {/* Timeline bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="flex h-2.5 rounded-full overflow-hidden">
                    <div className="bg-green-500 h-full" style={{ width: `${(parseInt(formData.test_duration_minutes) / parseInt(formData.round_duration_minutes)) * 100}%` }}></div>
                    <div className="bg-gray-300 h-full" style={{ width: `${((parseInt(formData.round_duration_minutes) - parseInt(formData.test_duration_minutes)) / parseInt(formData.round_duration_minutes)) * 100}%` }}></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Round Start<br/>{formData.round_start_time}</span>
                  <span>Test Window<br/>({formData.test_duration_minutes} min)</span>
                  <span>Round End<br/>(+{formData.round_duration_minutes} min)</span>
                </div>
              </div>
            </div>
          )}

          <input type="hidden" name="drive" value={formData.drive} />

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
              disabled={isLoading || isFinalStatus}
              className={`flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${isFinalStatus ? "cursor-not-allowed" : ""}`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave size={14} />
                  {isEditing ? "Update Round" : "Add Round"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}