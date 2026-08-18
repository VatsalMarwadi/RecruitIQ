// admin/pages/aptitude/components/AddQuestionDrawer.jsx

import React, { useState, useEffect } from "react";
import { X, Save, CheckCircle } from "lucide-react";
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
    question: "",
    option_1: "",
    option_2: "",
    option_3: "",
    option_4: "",
    correct_option: "option_1",
    marks: 1,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingQuestion) {
      setFormData({
        question: editingQuestion.question || "",
        option_1: editingQuestion.option_1 || "",
        option_2: editingQuestion.option_2 || "",
        option_3: editingQuestion.option_3 || "",
        option_4: editingQuestion.option_4 || "",
        correct_option: editingQuestion.correct_option || "option_1",
        marks: editingQuestion.marks || 1,
      });
    } else {
      setFormData({
        question: "",
        option_1: "",
        option_2: "",
        option_3: "",
        option_4: "",
        correct_option: "option_1",
        marks: 1,
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
    if (!formData.question.trim()) newErrors.question = "Question is required";
    if (!formData.option_1.trim()) newErrors.option_1 = "Option 1 is required";
    if (!formData.option_2.trim()) newErrors.option_2 = "Option 2 is required";
    if (!formData.option_3.trim()) newErrors.option_3 = "Option 3 is required";
    if (!formData.option_4.trim()) newErrors.option_4 = "Option 4 is required";
    if (formData.marks < 1) newErrors.marks = "Marks must be at least 1";

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
      };

      if (editingQuestion) {
        payload.id = editingQuestion.id;
      }

      const response = await api.post(
        `/canadmin/add-update-aptitude-question/`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
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
      {/* Background overlay */}
      <div 
        className="absolute inset-0 backdrop-blur-sm bg-black/20" 
        onClick={onClose}
      />
      
      {/* Drawer panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-300 ease-in-out">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h2 className="text-lg font-semibold text-gray-900">
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
            <form id="questionForm" onSubmit={handleSubmit} className="space-y-5">
              {/* Question */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="question"
                  value={formData.question}
                  onChange={handleChange}
                  rows="3"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                    errors.question ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter the question"
                />
                {errors.question && (
                  <p className="mt-1 text-xs text-red-500">{errors.question}</p>
                )}
              </div>

              {/* Options Grid */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-2 gap-3">
                  {["option_1", "option_2", "option_3", "option_4"].map((opt, idx) => (
                    <div key={opt}>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">
                        Option {idx + 1} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name={opt}
                        value={formData[opt]}
                        onChange={handleChange}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                          errors[opt] ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder={`Option ${idx + 1}`}
                      />
                      {errors[opt] && (
                        <p className="mt-1 text-xs text-red-500">{errors[opt]}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Correct Option & Marks */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Correct Option <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="correct_option"
                      value={formData.correct_option}
                      onChange={handleChange}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    >
                      <option value="option_1">Option 1</option>
                      <option value="option_2">Option 2</option>
                      <option value="option_3">Option 3</option>
                      <option value="option_4">Option 4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Marks <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="marks"
                      value={formData.marks}
                      onChange={handleChange}
                      min="1"
                      className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        errors.marks ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.marks && (
                      <p className="mt-1 text-xs text-red-500">{errors.marks}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Section */}
              {formData.question && (formData.option_1 || formData.option_2) && (
                <div className="bg-white rounded-lg border border-gray-200 p-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Preview
                  </h4>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900 font-medium">{formData.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {["option_1", "option_2", "option_3", "option_4"].map((opt, idx) => {
                        const isCorrect = opt === formData.correct_option;
                        return (
                          <div 
                            key={opt} 
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                              isCorrect 
                                ? "bg-green-50 border border-green-200 text-green-700" 
                                : "bg-gray-50 border border-gray-200 text-gray-700"
                            }`}
                          >
                            <span className="font-medium text-gray-400">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            <span className="flex-1">
                              {formData[opt] || "(empty)"}
                            </span>
                            {isCorrect && (
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
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
              className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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