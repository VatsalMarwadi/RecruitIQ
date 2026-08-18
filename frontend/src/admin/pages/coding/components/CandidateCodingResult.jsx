// admin/pages/coding/components/CandidateCodingResult.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../../configuration/api";
import { 
  FaArrowLeft, 
  FaPrint, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaMinusCircle,
  FaFileAlt,
  FaUser,
  FaCalendarAlt,
  FaClock,
  FaPercentage,
  FaCode,
  FaTerminal,
  FaCheckDouble
} from "react-icons/fa";

export default function CandidateCodingResult() {
  const navigate = useNavigate();
  const { roundId, attemptId } = useParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchCandidateResult();
  }, [roundId, attemptId]);

  const fetchCandidateResult = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const response = await api.get(
        `/canadmin/list-coding-results/${roundId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const results = response.data.data.results || [];
        const attempt = results.find((r) => (r.attempt_id || r.submission_id) === parseInt(attemptId));

        if (attempt) {
          setResult(attempt);
        } else {
          toast.error("Candidate result not found");
          navigate(-1);
        }
      } else {
        toast.error(response.data.message || "Failed to load result");
        navigate(-1);
      }
    } catch (error) {
      console.error("Error fetching candidate result:", error);
      toast.error(error.response?.data?.message || "Failed to load result");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageLabel = (lang) => {
    const labels = {
      'python': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'javascript': 'JavaScript'
    };
    return labels[lang] || lang;
  };

  const getLanguageColor = (lang) => {
    const colors = {
      'python': 'bg-blue-100 text-blue-700 border-blue-200',
      'java': 'bg-red-100 text-red-700 border-red-200',
      'cpp': 'bg-purple-100 text-purple-700 border-purple-200',
      'c': 'bg-gray-100 text-gray-700 border-gray-200',
      'javascript': 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };
    return colors[lang] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!result) return null;

  const isEvaluated = result.candidate_decision !== null && 
                     result.candidate_decision !== undefined &&
                     result.candidate_decision.decision !== 'pending';
  const isPassed = result.candidate_decision?.decision === 'shortlisted';

  const score = result.score || 0;
  const totalMarks = result.total_marks || 0;
  const totalQuestions = result.total_questions || 0;
  const attemptedQuestions = result.attempted_questions || 0;

  return (
    <div className="w-full px-4">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaArrowLeft className="text-gray-500" size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {result.candidate_name || 'Candidate'}
          </h1>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <FaFileAlt size={12} />
              Attempt #{result.attempt_id || result.submission_id}
            </span>
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <FaCalendarAlt size={12} />
              {result.submitted_at ? new Date(result.submitted_at).toLocaleString() : "N/A"}
            </span>
            {!isEvaluated ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                Evaluation Pending
              </span>
            ) : (
              <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${
                isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {isPassed ? 'Passed' : 'Failed'}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <FaPrint size={14} /> Print
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total Score</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{score}</p>
          <p className="text-xs text-gray-400">out of {totalMarks}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Percentage</p>
          <p className={`text-2xl font-bold mt-1 ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
            {(result.percentage || 0).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <FaPercentage size={10} />
            {isPassed ? "Passing" : "Failing"}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm border-blue-200 bg-blue-50">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Attempted</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {attemptedQuestions}/{totalQuestions}
          </p>
          <p className="text-xs text-gray-400">Questions solved</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm border-purple-200 bg-purple-50">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Accuracy</p>
          <p className="text-2xl font-bold text-purple-600 mt-1">
            {totalMarks > 0 ? `${((score / totalMarks) * 100).toFixed(1)}%` : '0%'}
          </p>
          <p className="text-xs text-gray-400">Correct answers</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm border-green-200 bg-green-50">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Passed Tests</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {result.questions?.reduce((acc, q) => acc + (q.passed_test_cases || 0), 0) || 0}
          </p>
          <p className="text-xs text-gray-400">Total test cases</p>
        </div>
      </div>

      {/* Question-wise Details */}
      {result.questions && result.questions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FaCode size={14} />
              Question-wise Analysis
            </h2>
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className="flex items-center gap-1 text-blue-600">
                <FaCheckCircle size={12} /> {attemptedQuestions} Attempted
              </span>
              <span className="flex items-center gap-1 text-gray-400">
                <FaMinusCircle size={12} /> {totalQuestions - attemptedQuestions} Unattempted
              </span>
              <span className="text-gray-400 border-l pl-3">
                Total: {totalQuestions}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {result.questions.map((question, index) => {
              const isSubmitted = question.status === 'submitted' || question.status === 'evaluated';
              const isPassedQuestion = question.status === 'passed';
              const isFailedQuestion = question.status === 'failed';
              const passedTests = question.passed_test_cases || 0;
              const totalTests = question.total_test_cases || 0;
              const testPassPercentage = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

              return (
                <div 
                  key={index} 
                  className={`border rounded-lg overflow-hidden transition-colors ${
                    isPassedQuestion ? 'border-green-300 bg-green-50' :
                    isFailedQuestion ? 'border-red-300 bg-red-50' :
                    isSubmitted ? 'border-blue-300 bg-blue-50' :
                    'border-gray-300 bg-gray-50'
                  }`}
                >
                  {/* Question Header */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-white bg-opacity-50 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                        Q{index + 1}
                      </span>
                      <span className="text-sm text-gray-800 font-medium">
                        {question.question || `Question ${index + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                        isPassedQuestion ? 'bg-green-100 text-green-700 border-green-200' :
                        isFailedQuestion ? 'bg-red-100 text-red-700 border-red-200' :
                        isSubmitted ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-gray-100 text-gray-600 border-gray-200'
                      }`}>
                        {isPassedQuestion ? 'Passed' : 
                         isFailedQuestion ? 'Failed' : 
                         isSubmitted ? 'Submitted' : 'Pending'}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {question.score || 0} marks
                      </span>
                    </div>
                  </div>

                  {/* Question Body */}
                  <div className="p-4 space-y-3">
                    {/* Language & Test Cases */}
                    <div className="flex flex-wrap items-center gap-3">
                      {question.language && (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getLanguageColor(question.language)}`}>
                          <FaCode size={10} className="inline mr-1" />
                          {getLanguageLabel(question.language)}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FaTerminal size={10} />
                        {passedTests}/{totalTests} test cases passed
                      </span>
                      {totalTests > 0 && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          testPassPercentage >= 80 ? 'bg-green-100 text-green-700' :
                          testPassPercentage >= 50 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {testPassPercentage}% passed
                        </span>
                      )}
                    </div>

                    {/* Test Case Progress Bar */}
                    {totalTests > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            testPassPercentage >= 80 ? 'bg-green-500' :
                            testPassPercentage >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${testPassPercentage}%` }}
                        />
                      </div>
                    )}

                    {/* Submission Details */}
                    {question.submitted_at && (
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2 border-t border-gray-200">
                        <span className="flex items-center gap-1">
                          <FaClock size={10} />
                          Submitted: {new Date(question.submitted_at).toLocaleString()}
                        </span>
                        {question.evaluated_at && (
                          <span className="flex items-center gap-1">
                            <FaCheckDouble size={10} />
                            Evaluated: {new Date(question.evaluated_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Test Details */}
      <div className="mt-4 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FaClock size={14} />
            Test Details
          </h2>
        </div>
        <div className="px-6 py-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Status</span>
              <span className={`font-semibold mt-1 ${
                !isEvaluated ? 'text-yellow-600' : (isPassed ? 'text-green-600' : 'text-red-600')
              }`}>
                {!isEvaluated ? 'Evaluation Pending' : (isPassed ? 'Passed' : 'Failed')}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Decision</span>
              <span className="font-semibold text-gray-900 mt-1">
                {result.candidate_decision?.decision ? 
                  result.candidate_decision.decision.charAt(0).toUpperCase() + result.candidate_decision.decision.slice(1) : 
                  'Pending'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Submitted</span>
              <span className="font-semibold text-gray-900 mt-1">
                {result.submitted_at ? new Date(result.submitted_at).toLocaleString() : 'N/A'}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Questions</span>
              <span className="font-semibold text-gray-900 mt-1">
                {attemptedQuestions}/{totalQuestions} attempted
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Note */}
      {!result.questions || result.questions.length === 0 && (
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Detailed question-wise results will be available once the coding round is evaluated.
          </p>
        </div>
      )}
    </div>
  );
}