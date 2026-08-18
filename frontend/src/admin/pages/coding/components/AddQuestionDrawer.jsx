// admin/pages/coding/components/AddQuestionDrawer.jsx

import React, { useState, useEffect } from "react";
import { X, Save, Code } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../../configuration/api";

export default function AddQuestionDrawer({
  isOpen,
  onClose,
  onSave,
  editingQuestion,
  roundId,
}) {
  const [formData, setFormData] = useState({
    problem_statement: "",
    description: "",
    difficulty: "medium",
    input_format: "",
    output_format: "",
    constraints: "",
    explanation: "",
    marks: 100,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        problem_statement: editingQuestion.problem_statement || "",
        description: editingQuestion.description || "",
        difficulty: editingQuestion.difficulty || "medium",
        input_format: editingQuestion.input_format || "",
        output_format: editingQuestion.output_format || "",
        constraints: editingQuestion.constraints || "",
        explanation: editingQuestion.explanation || "",
        marks: editingQuestion.marks || 100,
      });
    } else {
      setFormData({
        problem_statement: "",
        description: "",
        difficulty: "medium",
        input_format: "",
        output_format: "",
        constraints: "",
        explanation: "",
        marks: 100,
      });
    }
    setErrors({});
  }, [editingQuestion, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.problem_statement.trim()) newErrors.problem_statement = "Required";
    if (!formData.description.trim()) newErrors.description = "Required";
    if (!formData.input_format.trim()) newErrors.input_format = "Required";
    if (!formData.output_format.trim()) newErrors.output_format = "Required";
    if (!formData.constraints.trim()) newErrors.constraints = "Required";
    if (formData.marks < 1) newErrors.marks = "Must be at least 1";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...formData,
        round: parseInt(roundId),
        id: editingQuestion?.id || undefined,
      };

      const response = await api.post(
        `/canadmin/add-update-coding-question/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        onSave(formData);
        onClose();
      } else {
        toast.error(response.data.message || "Failed to save question");
      }
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error(error.response?.data?.message || "Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/20" 
        onClick={onClose}
      />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Code className="w-5 h-5 text-blue-600" />
              {editingQuestion ? "Edit Question" : "New Question"}
            </h2>
            <button 
              onClick={onClose} 
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            <form id="questionForm" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem Statement <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="problem_statement"
                  value={formData.problem_statement}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.problem_statement ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Two Sum"
                />
                {errors.problem_statement && (
                  <p className="mt-1 text-xs text-red-500">{errors.problem_statement}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.description ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Detailed description..."
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-500">{errors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Difficulty <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="marks"
                    value={formData.marks}
                    onChange={handleChange}
                    min="1"
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.marks ? "border-red-500" : "border-gray-300"
                    }`}
                  />
                  {errors.marks && (
                    <p className="mt-1 text-xs text-red-500">{errors.marks}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Input Format <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="input_format"
                  rows="2"
                  value={formData.input_format}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                    errors.input_format ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Describe input format..."
                />
                {errors.input_format && (
                  <p className="mt-1 text-xs text-red-500">{errors.input_format}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output Format <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="output_format"
                  rows="2"
                  value={formData.output_format}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                    errors.output_format ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Describe output format..."
                />
                {errors.output_format && (
                  <p className="mt-1 text-xs text-red-500">{errors.output_format}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Constraints <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="constraints"
                  rows="2"
                  value={formData.constraints}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                    errors.constraints ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="List constraints..."
                />
                {errors.constraints && (
                  <p className="mt-1 text-xs text-red-500">{errors.constraints}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explanation <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  name="explanation"
                  rows="2"
                  value={formData.explanation}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Any additional explanation..."
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-white flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="questionForm"
              disabled={saving}
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {editingQuestion ? "Update" : "Save"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}