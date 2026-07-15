import React, { useState, useEffect } from "react";
import {
  FaBriefcase,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api, { authHeader } from "../../configuration/api";
import { confirmDelete } from "../../components/ToastConfirmation";

const Experience = () => {
  const [experience, setExperience] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    company: "",
    position: "",
    location: "",
    start_year: "",
    end_year: "",
    is_current: false,
    description: "",
  });

  const currentYear = new Date().getFullYear();

  // Load experience data
  useEffect(() => {
    fetchExperience();
  }, []);

  const fetchExperience = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        "/candidate/get-experience/",
        authHeader(),
      );

      if (response.data.success) {
        setExperience(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load experience");
      }
    } catch (error) {
      console.error("Error fetching experience:", error);
      toast.error(error.response?.data?.message || "Failed to load experience");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (e) => {
    const { checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      is_current: checked,
      // If currently working, clear end year
      end_year: checked ? "" : prev.end_year,
    }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.company || !formData.position) {
      toast.error("Please fill in company and position");
      return;
    }

    // Validate year fields
    if (formData.start_year && formData.end_year) {
      const startYear = parseInt(formData.start_year);
      const endYear = parseInt(formData.end_year);

      if (startYear > endYear) {
        toast.error("Start year cannot be greater than end year");
        return;
      }
    }

    setSaving(true);

    try {
      const method = "post";
      const url = "/candidate/add-update-experience/";

      const payload = {
        id: formData.id,
        company: formData.company,
        position: formData.position,
        location: formData.location,
        start_year: formData.start_year,
        end_year: formData.is_current ? null : formData.end_year,
        is_current: formData.is_current,
        description: formData.description,
      };

      const response = await api[method](url, payload, authHeader());

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchExperience(); // Refresh the list
        resetForm();
      } else {
        toast.error(response.data.message || "Failed to save experience");
      }
    } catch (error) {
      console.error("Error saving experience:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save experience";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (experienceItem) => {
    setFormData({
      id: experienceItem.id,
      company: experienceItem.company || "",
      position: experienceItem.position || "",
      location: experienceItem.location || "",
      start_year: experienceItem.start_year || "",
      end_year: experienceItem.end_year || "",
      is_current: experienceItem.is_current || false,
      description: experienceItem.description || "",
    });
    setEditingId(experienceItem.id);
  };

  const handleDelete = async (id) => {
    confirmDelete("Experience Record", async () => {
      try {
        const response = await api.delete(
          `/candidate/delete-experience/${id}/`,
          authHeader(),
        );

        if (response.data.success) {
          toast.success("Experience deleted successfully");
          await fetchExperience();
          if (editingId === id) {
            resetForm();
          }
        } else {
          toast.error(response.data.message || "Failed to delete experience");
        }
      } catch (error) {
        console.error("Error deleting experience:", error);
        toast.error(
          error.response?.data?.message || "Failed to delete experience",
        );
      }
    });
  };

  const resetForm = () => {
    setFormData({
      id: null,
      company: "",
      position: "",
      location: "",
      start_year: "",
      end_year: "",
      is_current: false,
      description: "",
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-3 text-slate-600 text-sm">Loading experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <FaBriefcase className="text-orange-500" />
          Work Experience
        </h2>
        <span className="text-sm text-slate-500">
          {experience.length} {experience.length === 1 ? "record" : "records"}
        </span>
      </div>

      {/* Experience List */}
      {experience.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
          <FaBriefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No experience records added yet</p>
          <p className="text-sm text-slate-400">
            Add your work experience above
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {experience.map((exp) => (
            <div
              key={exp.id}
              className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-colors ${
                editingId === exp.id
                  ? "border-orange-400 bg-orange-50"
                  : "border-slate-200 hover:border-orange-200"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-semibold text-slate-900">
                    {exp.position}
                  </h4>
                  <span className="text-xs text-slate-400">•</span>
                  <p className="text-sm text-slate-600">{exp.company}</p>
                  {exp.is_current && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Current
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {exp.location && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Location:</span>{" "}
                      {exp.location}
                    </p>
                  )}
                  {(exp.start_year || exp.end_year) && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Year:</span>{" "}
                      {exp.start_year || "?"} -{" "}
                      {exp.is_current ? "Present" : exp.end_year || "?"}
                    </p>
                  )}
                </div>
                {exp.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {exp.description}
                  </p>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(exp)}
                  className="p-2 text-slate-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(exp.id)}
                  className="p-2 text-slate-600 hover:text-red-500 hover:red-orange-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Experience Form */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Company *
          </label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            placeholder="Google Inc."
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Position *
            </label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              placeholder="Software Engineer"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="Mountain View, CA"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Start Year
            </label>
            <input
              type="number"
              name="start_year"
              min="1900"
              max={currentYear + 10}
              value={formData.start_year}
              onChange={handleInputChange}
              placeholder="2023"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              End Year
            </label>
            <input
              type="number"
              name="end_year"
              min="1900"
              max={currentYear + 10}
              value={formData.end_year}
              onChange={handleInputChange}
              placeholder="2026"
              disabled={formData.is_current}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm outline-none transition-colors ${
                formData.is_current
                  ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                  : "border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              }`}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your responsibilities and achievements..."
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>

          {/* Currently Working Checkbox */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.is_current}
                  onChange={handleCheckboxChange}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 border-2 border-slate-300 rounded-md transition-all duration-200 peer-checked:border-orange-500 peer-checked:bg-orange-500 peer-focus:ring-2 peer-focus:ring-orange-200 group-hover:border-orange-400">
                  {formData.is_current && (
                    <svg
                      className="w-4 h-4 text-white absolute top-0.5 left-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                I currently work here
              </span>
            </label>
            {formData.is_current && (
              <p className="text-xs text-orange-500 mt-1 ml-8">
                End year will be set to "Present"
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {editingId && (
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              <FaTimes />
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Saving...
              </>
            ) : (
              <>
                {editingId ? <FaSave /> : <FaPlus />}
                {editingId ? "Update Experience" : "Add Experience"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Experience;
