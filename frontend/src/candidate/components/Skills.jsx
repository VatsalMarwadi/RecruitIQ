import React, { useState, useEffect } from "react";
import {
  FaTools,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api, { authHeader } from "../../configuration/api";
import { confirmDelete } from "../../components/ToastConfirmation";

const Skills = () => {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    level: "Intermediate",
  });

  const skillLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

  // Load skills data
  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const response = await api.get("/candidate/get-skill/", authHeader());

      if (response.data.success) {
        setSkills(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load skills");
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
      toast.error(error.response?.data?.message || "Failed to load skills");
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
      toast.error("Please enter a skill");
      return;
    }

    setSaving(true);

    try {
      const method = "post";
      const url = "/candidate/add-update-skill/";

      const payload = {
        id: formData.id,
        name: formData.name.trim(),
        level: formData.level,
      };

      const response = await api[method](url, payload, authHeader());

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchSkills(); // Refresh the list
        resetForm();
      } else {
        toast.error(response.data.message || "Failed to save skill");
      }
    } catch (error) {
      console.error("Error saving skill:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save skill";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (skillItem) => {
    setFormData({
      id: skillItem.id,
      name: skillItem.name || "",
      level: skillItem.level || "Intermediate",
    });
    setEditingId(skillItem.id);
  };

  const handleDelete = async (id) => {
    confirmDelete("Skill", async () => {
      try {
        const response = await api.delete(
          `/candidate/delete-skill/${id}/`,
          authHeader(),
        );

        if (response.data.success) {
          toast.success("Skill deleted successfully");
          await fetchSkills();
          if (editingId === id) {
            resetForm();
          }
        } else {
          toast.error(response.data.message || "Failed to delete skill");
        }
      } catch (error) {
        console.error("Error deleting skill:", error);
        toast.error(error.response?.data?.message || "Failed to delete skill");
      }
    });
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      level: "Intermediate",
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

  // Get level color
  const getLevelColor = (level) => {
    const colors = {
      Beginner: "bg-blue-100 text-blue-700",
      Intermediate: "bg-yellow-100 text-yellow-700",
      Advanced: "bg-orange-100 text-orange-700",
      Expert: "bg-green-100 text-green-700",
    };
    return colors[level] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-3 text-slate-600 text-sm">Loading skills...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <FaTools className="text-orange-500" />
          Skills
        </h2>
        <span className="text-sm text-slate-500">
          {skills.length} {skills.length === 1 ? "skill" : "skills"}
        </span>
      </div>

      {/* Skills List - Table Format */}
      {skills.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
          <FaTools className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No skills added yet</p>
          <p className="text-sm text-slate-400">Add your skills above</p>
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
                  Skill Name
                </th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Level
                </th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {skills.map((skill, index) => (
                <tr
                  key={skill.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    editingId === skill.id ? "bg-orange-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-900">
                      {skill.name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(
                        skill.level,
                      )}`}
                    >
                      {skill.level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(skill)}
                        className="p-1.5 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                        title="Edit skill"
                      >
                        <FaEdit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(skill.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete skill"
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

      {/* Add/Edit Skill Form */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Skill Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Enter a skill..."
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="min-w-[150px]">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Level
            </label>
            <select
              name="level"
              value={formData.level}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              {skillLevels.map((level) => (
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
                  {editingId ? "Update Skill" : "Add Skill"}
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

export default Skills;
