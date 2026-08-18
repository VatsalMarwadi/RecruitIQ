// admin/pages/coding/components/CodingTestCaseForm.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../../configuration/api";
import { FaArrowLeft, FaSave } from "react-icons/fa";

export default function CodingTestCaseForm() {
  const navigate = useNavigate();
  const { driveId, roundId, questionId, testCaseId } = useParams();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [questionInfo, setQuestionInfo] = useState(null);
  const [formData, setFormData] = useState({
    input_data: "",
    expected_output: "",
    is_sample: false
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchQuestionInfo();
    if (testCaseId) {
      fetchTestCase();
    }
  }, [testCaseId]);

  const fetchQuestionInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/canadmin/get-coding-questions/${roundId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const question = response.data.data?.find(q => q.id === parseInt(questionId));
      if (question) {
        setQuestionInfo(question);
      }
    } catch (error) {
      console.error("Error fetching question info:", error);
      toast.error("Failed to load question info");
    }
  };

  const fetchTestCase = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/canadmin/get-coding-test-cases/${questionId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const testCases = response.data.data || [];
        const testCase = testCases.find(tc => tc.id === parseInt(testCaseId));
        
        if (testCase) {
          setFormData({
            input_data: testCase.input_data || "",
            expected_output: testCase.expected_output || "",
            is_sample: testCase.is_sample || false
          });
        } else {
          toast.error('Test case not found');
          handleCancel();
        }
      } else {
        toast.error(response.data.message || 'Failed to fetch test case');
      }
    } catch (error) {
      console.error("Error fetching test case:", error);
      toast.error(error.response?.data?.message || 'Error fetching test case');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.input_data.trim()) {
      newErrors.input_data = "Input data is required";
    }
    if (!formData.expected_output.trim()) {
      newErrors.expected_output = "Expected output is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        question: parseInt(questionId),
        input_data: formData.input_data,
        expected_output: formData.expected_output,
        is_sample: formData.is_sample
      };

      if (testCaseId) {
        payload.id = parseInt(testCaseId);
      }

      const response = await api.post('/canadmin/add-update-coding-test-case/', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Test case saved successfully');
        handleCancel();
      } else {
        toast.error(response.data.message || 'Failed to save test case');
      }
    } catch (error) {
      console.error("Error saving test case:", error);
      toast.error(error.response?.data?.message || 'Error saving test case');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (driveId && driveId !== "undefined") {
      navigate(`/admin/drive/${driveId}/round/${roundId}/coding-questions`);
    } else {
      navigate(`/admin/coding-round/${roundId}`);
    }
  };

  if (loading) {
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
          onClick={handleCancel}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaArrowLeft className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {testCaseId ? "Edit Test Case" : "Add Test Case"}
          </h1>
          {questionInfo && (
            <p className="text-sm text-gray-500 mt-0.5">
              For: {questionInfo.problem_statement}
            </p>
          )}
          {questionInfo && (
            <p className="text-xs text-gray-400 mt-0.5">
              Question ID: #{questionInfo.id} • Difficulty: {questionInfo.difficulty || 'Medium'}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Input Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Input Data <span className="text-red-500">*</span>
            </label>
            <textarea
              name="input_data"
              rows="4"
              value={formData.input_data}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                errors.input_data ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter test case input data..."
            />
            {errors.input_data && (
              <p className="mt-1 text-xs text-red-500">{errors.input_data}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Provide the input that will be passed to the solution
            </p>
          </div>

          {/* Expected Output */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Output <span className="text-red-500">*</span>
            </label>
            <textarea
              name="expected_output"
              rows="4"
              value={formData.expected_output}
              onChange={handleChange}
              className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono ${
                errors.expected_output ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter expected output for this test case..."
            />
            {errors.expected_output && (
              <p className="mt-1 text-xs text-red-500">{errors.expected_output}</p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              The expected output that the solution should produce
            </p>
          </div>

          {/* Sample Test Case Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_sample"
              name="is_sample"
              checked={formData.is_sample}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
            />
            <label htmlFor="is_sample" className="text-sm font-medium text-gray-700">
              Sample Test Case
            </label>
            <span className="text-xs text-gray-400 ml-auto">
              {formData.is_sample ? 'Visible to candidates' : 'Hidden from candidates'}
            </span>
          </div>

          {/* Preview Section */}
          {formData.input_data && formData.expected_output && (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Input:</p>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-sm text-gray-700 whitespace-pre-wrap break-all">
                    {formData.input_data}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Expected Output:</p>
                  <div className="bg-white p-3 rounded-lg border border-gray-200 font-mono text-sm text-gray-700 whitespace-pre-wrap break-all">
                    {formData.expected_output}
                  </div>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg border border-blue-200 text-xs text-blue-600">
                  {formData.is_sample ? 'This is a sample test case (visible to candidates)' : 'This is a hidden test case (not visible to candidates)'}
                </div>
              </div>
            </div>
          )}

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
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave size={14} />
                  {testCaseId ? "Update Test Case" : "Add Test Case"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}