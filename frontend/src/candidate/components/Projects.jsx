import React, { useState, useEffect } from "react";
import {
  FaProjectDiagram,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaGithub,
  FaExternalLinkAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api, { authHeader } from "../../configuration/api";
import { confirmDelete } from "../../components/ToastConfirmation";

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    title: "",
    description: "",
    technologies: "",
    link: "",
    start_month_year: "",
    end_month_year: "",
  });

  const currentYear = new Date().getFullYear();

  // Load projects data
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get("/candidate/get-project/", authHeader());

      if (response.data.success) {
        setProjects(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load projects");
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error(error.response?.data?.message || "Failed to load projects");
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
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error("Please fill in title and description");
      return;
    }

    // Validate year fields
    if (formData.start_month_year && formData.end_month_year) {
      const startYear = parseInt(formData.start_month_year);
      const endYear = parseInt(formData.end_month_year);

      if (startYear > endYear) {
        toast.error("Start year cannot be greater than end year");
        return;
      }
    }

    setSaving(true);

    try {
      const method = "post";
      const url = "/candidate/add-update-project/";

      const payload = {
        id: formData.id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        technologies: formData.technologies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        link: formData.link.trim(),
        start_month_year: formData.start_month_year
          ? `${formData.start_month_year}-01`
          : null,
        end_month_year: formData.end_month_year
          ? `${formData.end_month_year}-01`
          : null,
      };

      const response = await api[method](url, payload, authHeader());

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchProjects(); // Refresh the list
        resetForm();
      } else {
        toast.error(response.data.message || "Failed to save project");
      }
    } catch (error) {
      console.error("Error saving project:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save project";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (projectItem) => {
    setFormData({
      id: projectItem.id,
      title: projectItem.title || "",
      description: projectItem.description || "",
      technologies: projectItem.technologies
        ? projectItem.technologies.join(", ")
        : "" || "",
      link: projectItem.link || "",
      start_month_year: projectItem.start_month_year
        ? projectItem.start_month_year.slice(0, 7)
        : "" || "",
      end_month_year: projectItem.end_month_year
        ? projectItem.end_month_year.slice(0, 7)
        : "" || "",
    });
    setEditingId(projectItem.id);
  };

  const handleDelete = async (id) => {
    confirmDelete("Project", async () => {
      try {
        const response = await api.delete(
          `/candidate/delete-project/${id}/`,
          authHeader(),
        );

        if (response.data.success) {
          toast.success("Project deleted successfully");
          await fetchProjects();
          if (editingId === id) {
            resetForm();
          }
        } else {
          toast.error(response.data.message || "Failed to delete project");
        }
      } catch (error) {
        console.error("Error deleting project:", error);
        toast.error(
          error.response?.data?.message || "Failed to delete project",
        );
      }
    });
  };

  const resetForm = () => {
    setFormData({
      id: null,
      title: "",
      description: "",
      technologies: "",
      link: "",
      start_month_year: "",
      end_month_year: "",
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
  };

  // Handle Enter key press for quick submit
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && e.target.name === "title") {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Truncate description for display
  const truncateText = (text, maxLength = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-3 text-slate-600 text-sm">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <FaProjectDiagram className="text-orange-500" />
          Projects
        </h2>
        <span className="text-sm text-slate-500">
          {projects.length} {projects.length === 1 ? "project" : "projects"}
        </span>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
          <FaProjectDiagram className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No projects added yet</p>
          <p className="text-sm text-slate-400">Add your projects above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-colors ${
                editingId === project.id
                  ? "border-orange-400 bg-orange-50"
                  : "border-slate-200 hover:border-orange-200"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-semibold text-slate-900">
                    {project.title}
                  </h4>
                  <span className="text-xs text-slate-400">•</span>
                  <p className="text-sm text-slate-600">
                    {project.technologies && project.technologies.join(", ")}
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {(project.start_year || project.end_year) && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Year:</span>{" "}
                      {project.start_year || "?"} -{" "}
                      {project.end_year || "Present"}
                    </p>
                  )}
                  {project.link && (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <FaExternalLinkAlt size={10} />
                      View Project
                    </a>
                  )}
                </div>
                {project.description && (
                  <p className="text-xs text-slate-500 mt-1">
                    {project.description}
                  </p>
                )}
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(project)}
                  className="p-2 text-slate-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Project Form */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Project Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="E-Commerce Website"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description *
            </label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe your project, its purpose, and your role..."
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Technologies Used
            </label>
            <input
              type="text"
              name="technologies"
              value={formData.technologies}
              onChange={handleInputChange}
              placeholder="React, Node.js, MongoDB"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Project Link
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="https://github.com/yourproject"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Start Year
            </label>
            <input
              type="month"
              name="start_month_year"
              min="1900"
              max={currentYear + 10}
              value={formData.start_month_year}
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
              type="month"
              name="end_month_year"
              min="1900"
              max={currentYear + 10}
              value={formData.end_month_year}
              onChange={handleInputChange}
              placeholder="2024"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
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
                {editingId ? "Update Project" : "Add Project"}
              </>
            )}
          </button>
        </div>

        {editingId && (
          <p className="text-xs text-orange-500 mt-2">
            Editing: {formData.title}
          </p>
        )}
      </div>
    </div>
  );
};

export default Projects;