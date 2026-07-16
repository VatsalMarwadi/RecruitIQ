import React, { useState, useEffect, useCallback } from "react";
import {
  FaGraduationCap,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaImage,
  FaExternalLinkAlt,
  FaUniversity,
  FaAward,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api, { authHeader } from "../../configuration/api";
import { confirmDelete } from "../../components/ToastConfirmation";

// Constants
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const Education = () => {
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(null);

  const initialFormState = {
    id: null,
    institute: "",
    degree: "",
    field: "",
    start_year: "",
    end_year: "",
    is_current: false,
    evaluation_format: "",
    marks: "",
    description: "",
    degree_image: null,
  };

  const [formData, setFormData] = useState(initialFormState);
  const currentYear = new Date().getFullYear();

  // Load education data
  const fetchEducation = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/candidate/get-education/", authHeader());

      if (response.data.success) {
        setEducation(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load education");
      }
    } catch (error) {
      console.error("Error fetching education:", error);
      toast.error(error.response?.data?.message || "Failed to load education");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEducation();
  }, [fetchEducation]);

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
      end_year: checked ? "" : prev.end_year,
    }));
  };

  const validateImage = (file) => {
    if (!file) return false;

    // Check file type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setImageError("Please upload a valid image file (JPEG, PNG, GIF, or WebP)");
      toast.error("Invalid image format");
      return false;
    }

    // Check file size
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError("Image size should be less than 5MB");
      toast.error("Image size should be less than 5MB");
      return false;
    }

    setImageError(null);
    return true;
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && validateImage(file)) {
      setFormData((prev) => ({
        ...prev,
        degree_image: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      // Reset the file input
      e.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, degree_image: null }));
    document.getElementById('degree-image-upload').value = '';
    setImageError(null);
  };

  const validateForm = () => {
    if (!formData.degree.trim() || !formData.institute.trim()) {
      toast.error("Please fill in degree and institute");
      return false;
    }

    if (formData.start_year && formData.end_year) {
      const startYear = parseInt(formData.start_year);
      const endYear = parseInt(formData.end_year);

      if (startYear > endYear) {
        toast.error("Start year cannot be greater than end year");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);

    try {
      const url = "/candidate/add-update-education/";
      const payload = new FormData();
      
      // Append all form data matching serializer fields
      const fields = {
        id: formData.id,
        institute: formData.institute.trim(),
        degree: formData.degree.trim(),
        field: formData.field.trim(),
        start_year: formData.start_year,
        end_year: formData.is_current ? "" : formData.end_year,
        is_current: formData.is_current,
        evaluation_format: formData.evaluation_format.trim(),
        marks: formData.marks.trim(),
        description: formData.description.trim(),
      };

      Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          payload.append(key, value.toString());
        }
      });

      if (formData.degree_image instanceof File) {
        payload.append("degree_image", formData.degree_image);
      }

      const response = await api.post(url, payload, {
        ...authHeader(),
        headers: {
          ...authHeader().headers,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchEducation();
        resetForm();
      } else {
        toast.error(response.data.message || "Failed to save education");
      }
    } catch (error) {
      console.error("Error saving education:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors || 
                          "Failed to save education";
      
      if (typeof errorMessage === 'object') {
        const firstError = Object.values(errorMessage)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (educationItem) => {
    setFormData({
      id: educationItem.id,
      institute: educationItem.institute || "",
      degree: educationItem.degree || "",
      field: educationItem.field || "",
      start_year: educationItem.start_year || "",
      end_year: educationItem.end_year || "",
      is_current: educationItem.is_current || false,
      evaluation_format: educationItem.evaluation_format || "",
      marks: educationItem.marks || "",
      description: educationItem.description || "",
      degree_image: null,
    });
    
    setImagePreview(null);
    setEditingId(educationItem.id);
    setImageError(null);
    
    // Scroll to form
    document.getElementById('education-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    confirmDelete("Education Record", async () => {
      try {
        const response = await api.delete(
          `/candidate/delete-education/${id}/`,
          authHeader()
        );

        if (response.data.success) {
          toast.success("Education deleted successfully");
          await fetchEducation();
          if (editingId === id) {
            resetForm();
          }
        } else {
          toast.error(response.data.message || "Failed to delete education");
        }
      } catch (error) {
        console.error("Error deleting education:", error);
        toast.error(
          error.response?.data?.message || "Failed to delete education"
        );
      }
    });
  };

  const resetForm = () => {
    setFormData(initialFormState);
    setImagePreview(null);
    setEditingId(null);
    setImageError(null);
    document.getElementById('degree-image-upload').value = '';
  };

  const cancelEdit = () => {
    resetForm();
  };

  const formatDateRange = (startYear, endYear, isCurrent) => {
    const start = startYear || "?";
    const end = isCurrent ? "Present" : (endYear || "?");
    return `${start} - ${end}`;
  };

  const getEvaluationFormatLabel = (format) => {
    const formats = {
      'percentage': 'Percentage',
      'cgpa': 'CGPA'
    };
    return formats[format] || format;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-3 text-slate-600 text-sm">Loading education...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <FaGraduationCap className="text-orange-500" />
          Education
        </h2>
        <span className="text-sm text-slate-500">
          {education.length} {education.length === 1 ? "record" : "records"}
        </span>
      </div>

      {/* Education List */}
      {education.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
          <FaGraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No education records added yet</p>
          <p className="text-sm text-slate-400">
            Add your education details below
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {education.map((edu) => (
            <div
              key={edu.id}
              className={`flex items-start justify-between p-4 bg-white rounded-xl border transition-all duration-200 ${
                editingId === edu.id
                  ? "border-orange-400 bg-orange-50 shadow-sm"
                  : "border-slate-200 hover:border-orange-200 hover:shadow-sm"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-semibold text-slate-900 truncate">
                    {edu.degree}
                  </h4>
                  <span className="text-xs text-slate-400">•</span>
                  <p className="text-sm text-slate-600 truncate">
                    {edu.institute}
                  </p>
                  {edu.is_current && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Current
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {edu.field && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Field:</span>{" "}
                      {edu.field}
                    </p>
                  )}
                  {(edu.start_year || edu.end_year) && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Year:</span>{" "}
                      {formatDateRange(edu.start_year, edu.end_year, edu.is_current)}
                    </p>
                  )}
                  {edu.evaluation_format && edu.marks && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Marks:</span>{" "}
                      {edu.marks} ({getEvaluationFormatLabel(edu.evaluation_format)})
                    </p>
                  )}
                  {edu.evaluation_format && !edu.marks && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Format:</span>{" "}
                      {getEvaluationFormatLabel(edu.evaluation_format)}
                    </p>
                  )}
                  {edu.marks && !edu.evaluation_format && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Marks:</span> {edu.marks}
                    </p>
                  )}
                </div>
                
                {edu.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {edu.description}
                  </p>
                )}
                
                {/* Certificate Link */}
                {edu.degree_image && (
                  <div className="mt-2">
                    <a
                      href={edu.degree_image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 text-xs font-medium rounded-lg transition-colors border border-orange-200 hover:border-orange-300"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                      View Certificate
                    </a>
                  </div>
                )}
              </div>

              <div className="flex gap-1 ml-4 flex-shrink-0">
                <button
                  onClick={() => handleEdit(edu)}
                  className="p-2 text-slate-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  aria-label="Edit education"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(edu.id)}
                  className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Delete education"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Education Form */}
      <div 
        id="education-form"
        className="bg-slate-50 rounded-xl p-4 border border-slate-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Degree *
            </label>
            <input
              type="text"
              name="degree"
              value={formData.degree}
              onChange={handleInputChange}
              placeholder="Bachelor of Science"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Institute *
            </label>
            <input
              type="text"
              name="institute"
              value={formData.institute}
              onChange={handleInputChange}
              placeholder="Stanford University"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Field of Study
            </label>
            <input
              type="text"
              name="field"
              value={formData.field}
              onChange={handleInputChange}
              placeholder="Computer Science"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Evaluation Format
            </label>
            <select
              name="evaluation_format"
              value={formData.evaluation_format}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100 bg-white"
            >
              <option value="">Select format</option>
              <option value="Percentage">Percentage</option>
              <option value="CGPA">CGPA</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Marks / Grade
            </label>
            <input
              type="text"
              name="marks"
              value={formData.marks}
              onChange={handleInputChange}
              placeholder="3.8 GPA or 85%"
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
              placeholder="2020"
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
              placeholder="2024"
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
              placeholder="Describe your academic achievements, relevant coursework, or any special recognition..."
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
            />
          </div>

          {/* Degree Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Degree Certificate
            </label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="file"
                    name="degree_image"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="degree-image-upload"
                  />
                  <label
                    htmlFor="degree-image-upload"
                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-600 hover:border-orange-400 hover:text-orange-500 transition-colors cursor-pointer"
                  >
                    <FaImage />
                    Upload Certificate
                  </label>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Upload degree certificate or diploma (max 5MB)
                </p>
                {imageError && (
                  <p className="text-xs text-red-500 mt-1">{imageError}</p>
                )}
              </div>
              
              {/* Image Preview while uploading */}
              {imagePreview && (
                <div className="relative flex-shrink-0">
                  <img
                    src={imagePreview}
                    alt="Certificate Preview"
                    className="h-20 w-20 object-cover rounded-lg border border-slate-200"
                  />
                  <button
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    aria-label="Remove image"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Currently Studying Checkbox */}
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
                I currently study here
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
                {editingId ? "Update Education" : "Add Education"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Education;