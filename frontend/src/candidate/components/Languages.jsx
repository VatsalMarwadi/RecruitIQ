import React, { useState, useEffect } from "react";
import {
  FaLanguage,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api, { authHeader } from "../../configuration/api";
import { confirmDelete } from "../../components/ToastConfirmation";

const Languages = () => {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    proficiency: "Intermediate",
  });

  const proficiencyLevels = [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Fluent",
    "Native",
  ];

  // Load languages data
  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      setLoading(true);
      const response = await api.get("/candidate/get-language/", authHeader());

      if (response.data.success) {
        setLanguages(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load languages");
      }
    } catch (error) {
      console.error("Error fetching languages:", error);
      toast.error(error.response?.data?.message || "Failed to load languages");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error("Please enter a language");
      return;
    }

    setSaving(true);

    try {
      const method = "post";
      const url = "/candidate/add-update-language/";

      const payload = {
        id: formData.id,
        name: formData.name.trim(),
        proficiency: formData.proficiency,
      };

      const response = await api[method](url, payload, authHeader());

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchLanguages(); // Refresh the list
        resetForm();
      } else {
        toast.error(response.data.message || "Failed to save language");
      }
    } catch (error) {
      console.error("Error saving language:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save language";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (languageItem) => {
    setFormData({
      id: languageItem.id,
      name: languageItem.name || "",
      proficiency: languageItem.proficiency || "Intermediate",
    });
    setEditingId(languageItem.id);
  };

  const handleDelete = async (id) => {
    confirmDelete("Language", async () => {
      try {
        const response = await api.delete(
          `/candidate/delete-language/${id}/`,
          authHeader(),
        );

        if (response.data.success) {
          toast.success("Language deleted successfully");
          await fetchLanguages();
          if (editingId === id) {
            resetForm();
          }
        } else {
          toast.error(response.data.message || "Failed to delete language");
        }
      } catch (error) {
        console.error("Error deleting language:", error);
        toast.error(
          error.response?.data?.message || "Failed to delete language",
        );
      }
    });
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      proficiency: "Intermediate",
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  // Get proficiency color
  const getProficiencyColor = (level) => {
    const colors = {
      Beginner: "bg-blue-100 text-blue-700",
      Intermediate: "bg-yellow-100 text-yellow-700",
      Advanced: "bg-orange-100 text-orange-700",
      Fluent: "bg-green-100 text-green-700",
      Native: "bg-purple-100 text-purple-700",
    };
    return colors[level] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-3 text-slate-600 text-sm">Loading languages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <FaLanguage className="text-orange-500" />
          Languages
        </h2>
        <span className="text-sm text-slate-500">
          {languages.length} {languages.length === 1 ? "language" : "languages"}
        </span>
      </div>

      {/* Languages List - Table Format */}
      {languages.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
          <FaLanguage className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No languages added yet</p>
          <p className="text-sm text-slate-400">Add your languages above</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  #
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Language Name
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Proficiency
                </th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {languages.map((language, index) => (
                <tr
                  key={language.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    editingId === language.id ? "bg-orange-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-900">
                      {language.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getProficiencyColor(
                        language.proficiency,
                      )}`}
                    >
                      {language.proficiency}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(language)}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit language"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(language.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete language"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Language Form */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Language Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter a language..."
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Proficiency
            </label>
            <select
              name="proficiency"
              value={formData.proficiency}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              {proficiencyLevels.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            {editingId && (
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                <FaTimes />
                Cancel
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                  Saving...
                </>
              ) : (
                <>
                  {editingId ? <FaSave /> : <FaPlus />}
                  {editingId ? "Update Language" : "Add Language"}
                </>
              )}
            </button>
          </div>
        </div>

        {editingId && (
          <p className="text-xs text-orange-500 mt-2">
            Editing: {formData.name}
          </p>
        )}
      </div>
    </div>
  );
};

export default Languages;
