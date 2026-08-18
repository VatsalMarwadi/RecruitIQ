// admin/pages/coding/CodingQuestionForm.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../../configuration/api";
import { FaArrowLeft, FaSave } from "react-icons/fa";

export default function CodingQuestionForm() {
  const navigate = useNavigate();
  const { driveId, roundId, questionId } = useParams();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingQuestions, setExistingQuestions] = useState([]);
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
  const submitLock = useRef(false);
  const submitTimeoutRef = useRef(null);
  const isNavigatingRef = useRef(false);

  // Fetch existing questions to check for duplicates
  useEffect(() => {
    if (roundId) {
      fetchExistingQuestions();
    }
  }, [roundId]);

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
    }
  }, [questionId]);

  const fetchExistingQuestions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/canadmin/get-coding-questions/${roundId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setExistingQuestions(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching existing questions:", error);
    }
  };

  const fetchQuestion = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/canadmin/get-coding-questions/${roundId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const question = response.data.data?.find(q => q.id === parseInt(questionId));
      if (question) {
        setFormData({
          problem_statement: question.problem_statement || "",
          description: question.description || "",
          difficulty: question.difficulty || "medium",
          input_format: question.input_format || "",
          output_format: question.output_format || "",
          constraints: question.constraints || "",
          explanation: question.explanation || "",
          marks: question.marks || 100,
        });
      } else {
        toast.error('Question not found');
        navigate(`/admin/drive/${driveId}/round/${roundId}/coding-questions`);
      }
    } catch (error) {
      toast.error('Error fetching question');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    
    // Clear duplicate error when user changes problem statement
    if (name === 'problem_statement' && errors.duplicate) {
      setErrors(prev => ({ ...prev, duplicate: "" }));
    }
  };

  const checkForDuplicate = () => {
    // Skip duplicate check if editing existing question
    if (questionId) return true;

    const problemStatement = formData.problem_statement.trim();
    if (!problemStatement) return true;

    // Check if any existing question has the same problem statement (case-insensitive)
    const duplicate = existingQuestions.some(q => 
      q.problem_statement.toLowerCase() === problemStatement.toLowerCase()
    );

    if (duplicate) {
      const errorMsg = `A question with the problem statement "${problemStatement}" already exists in this round. Please use a different problem statement.`;
      setErrors(prev => ({ 
        ...prev, 
        duplicate: errorMsg 
      }));
      toast.error(errorMsg);
      return false;
    }

    return true;
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
    
    // Prevent duplicate submission
    if (submitLock.current || submitting || isNavigatingRef.current) {
      return;
    }

    if (!validate()) {
      toast.error("Please fix the errors");
      return;
    }

    // Check for duplicate before submitting
    if (!checkForDuplicate()) {
      return;
    }

    // Lock the submit
    submitLock.current = true;
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...formData,
        round: parseInt(roundId),
        id: questionId ? parseInt(questionId) : undefined
      };

      const response = await api.post('/canadmin/add-update-coding-question/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Check if response indicates success
      if (response.data.success) {
        toast.success(response.data.message || 'Question saved successfully');
        
        // Navigate after a small delay
        if (submitTimeoutRef.current) {
          clearTimeout(submitTimeoutRef.current);
        }
        
        isNavigatingRef.current = true;
        submitTimeoutRef.current = setTimeout(() => {
          navigate(`/admin/drive/${driveId}/round/${roundId}/coding-questions`);
        }, 500);
      } else {
        // Handle error response
        const errorMsg = response.data.message || 'Failed to save question';
        toast.error(errorMsg);
        
        // Check if error message indicates duplicate
        if (errorMsg.toLowerCase().includes('already exists') || 
            errorMsg.toLowerCase().includes('duplicate')) {
          setErrors(prev => ({ 
            ...prev, 
            duplicate: errorMsg 
          }));
        }
        submitLock.current = false;
        setSubmitting(false);
      }
    } catch (error) {
      // Handle network error or server error
      let errorMsg = 'Error saving question';
      
      if (error.response) {
        if (error.response.data && error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (error.response.data && error.response.data.errors) {
          const errors = error.response.data.errors;
          errorMsg = Object.values(errors).flat().join(', ');
        } else if (error.response.status === 400) {
          errorMsg = error.response.data?.message || 'Invalid data provided';
        } else if (error.response.status === 500) {
          errorMsg = 'Server error. Please try again later.';
        }
      } else if (error.request) {
        errorMsg = 'No response from server. Please check your connection.';
      }
      
      toast.error(errorMsg);
      
      // Check if error message indicates duplicate
      if (errorMsg.toLowerCase().includes('already exists') || 
          errorMsg.toLowerCase().includes('duplicate')) {
        setErrors(prev => ({ 
          ...prev, 
          duplicate: errorMsg 
        }));
      }
      
      submitLock.current = false;
      setSubmitting(false);
    }
  };

  // Reset lock if component unmounts
  useEffect(() => {
    return () => {
      submitLock.current = false;
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      isNavigatingRef.current = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => {
            if (!submitting && !isNavigatingRef.current) {
              navigate(`/admin/drive/${driveId}/round/${roundId}/coding-questions`);
            }
          }}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={submitting}
        >
          <FaArrowLeft className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {questionId ? "Edit Question" : "New Question"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {questionId ? "Update coding question details" : "Create a new coding question"}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Duplicate Error Message */}
          {errors.duplicate && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
              <span className="text-lg mt-0.5">!</span>
              <div>
                <p className="text-sm font-medium">{errors.duplicate}</p>
                <p className="text-xs text-red-600 mt-0.5">Please use a different problem statement.</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Problem Statement <span className="text-red-500">*</span>
            </label>
            <input
              name="problem_statement"
              value={formData.problem_statement}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.problem_statement || errors.duplicate ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g., Two Sum"
              disabled={submitting}
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
              disabled={submitting}
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
                disabled={submitting}
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
                disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
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
              disabled={submitting}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                if (!submitting && !isNavigatingRef.current) {
                  navigate(`/admin/drive/${driveId}/round/${roundId}/coding-questions`);
                }
              }}
              className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave size={14} />
                  {questionId ? "Update" : "Add"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}