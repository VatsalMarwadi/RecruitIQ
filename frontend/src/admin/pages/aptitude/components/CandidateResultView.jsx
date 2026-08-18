// admin/pages/aptitude/components/CandidateResultView.jsx

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
  FaPercentage
} from "react-icons/fa";

export default function CandidateResultView() {
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
        `/canadmin/list-aptitude-results/${roundId}/?attempt_id=${attemptId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data.success) {
        setResult(response.data.data);
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

  const getOptionLabel = (index) => {
    return String.fromCharCode(65 + index);
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
            {result.candidate_name || "Candidate"}
          </h1>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <FaFileAlt size={12} />
              Attempt #{result.attempt_id}
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
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-medium ${
                  isPassed
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {isPassed ? "Passed" : "Failed"}
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
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {result.score || 0}
          </p>
          <p className="text-xs text-gray-400">out of {result.total_marks || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Percentage</p>
          <p
            className={`text-2xl font-bold mt-1 ${isPassed ? "text-green-600" : "text-red-600"}`}
          >
            {(result.percentage || 0).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <FaPercentage size={10} />
            {isPassed ? "Passing" : "Failing"}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm border-green-200 bg-green-50">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Correct</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {result.correct_answers || 0}
          </p>
          <p className="text-xs text-gray-400">Right answers</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm border-red-200 bg-red-50">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Wrong</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {result.wrong_answers || 0}
          </p>
          <p className="text-xs text-gray-400">Wrong answers</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm border-yellow-200 bg-yellow-50">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Unattempted</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">
            {result.unattempted || 0}
          </p>
          <p className="text-xs text-gray-400">Not attempted</p>
        </div>
      </div>

      {/* Question-wise Details */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <span className="text-lg">Q</span>
            Question-wise Analysis
          </h2>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-green-600">
              <FaCheckCircle size={12} /> {result.correct_answers || 0} Correct
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <FaTimesCircle size={12} /> {result.wrong_answers || 0} Wrong
            </span>
            <span className="flex items-center gap-1 text-yellow-600">
              <FaMinusCircle size={12} /> {result.unattempted || 0} Unattempted
            </span>
            <span className="text-gray-400 border-l pl-3">
              Total: {result.questions?.length || 0}
            </span>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {result.questions?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No questions found</p>
          ) : (
            result.questions.map((question, index) => {
              const isCorrect = question.is_correct;
              const isAttempted = question.selected_option !== null && question.selected_option !== undefined;
              const isWrong = isAttempted && !isCorrect;
              const isUnattempted = !isAttempted;

              return (
                <div 
                  key={question.question_id} 
                  className={`border rounded-lg overflow-hidden transition-colors ${
                    isCorrect ? 'border-green-300 bg-green-50' :
                    isWrong ? 'border-red-300 bg-red-50' :
                    'border-yellow-300 bg-yellow-50'
                  }`}
                >
                  {/* Question Header */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-white bg-opacity-50 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                        Q{index + 1}
                      </span>
                      <span className="text-sm text-gray-800 font-medium">
                        {question.question}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isCorrect ? 'bg-green-100 text-green-700' :
                        isWrong ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {isCorrect ? 'Correct' : isWrong ? 'Wrong' : 'Unattempted'}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {question.marks_obtained || 0}/{question.marks || 0}
                      </span>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="p-4 space-y-2">
                    {question.options.map((option, optIndex) => {
                      const optionKey = `option_${optIndex + 1}`;
                      const isSelected = question.selected_option === optionKey;
                      const isCorrectOption = question.correct_option === optionKey;
                      
                      let bgColor = 'bg-white';
                      let borderColor = 'border-gray-200';
                      let textColor = 'text-gray-700';
                      let icon = null;
                      let hoverBg = 'hover:bg-gray-50';

                      if (isSelected && isCorrect) {
                        bgColor = 'bg-green-100';
                        borderColor = 'border-green-500';
                        textColor = 'text-green-700';
                        icon = <FaCheckCircle className="text-green-500" size={16} />;
                        hoverBg = '';
                      } else if (isSelected && !isCorrect) {
                        bgColor = 'bg-red-100';
                        borderColor = 'border-red-500';
                        textColor = 'text-red-700';
                        icon = <FaTimesCircle className="text-red-500" size={16} />;
                        hoverBg = '';
                      } else if (isCorrectOption && !isSelected) {
                        bgColor = 'bg-green-50';
                        borderColor = 'border-green-300 border-dashed';
                        textColor = 'text-green-600';
                        hoverBg = 'hover:bg-green-100';
                      }

                      return (
                        <div 
                          key={optIndex}
                          className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${bgColor} ${borderColor} ${textColor} ${hoverBg} transition-all duration-150`}
                        >
                          <span className={`font-semibold w-6 text-sm ${
                            isSelected && isCorrect ? 'text-green-600' :
                            isSelected && !isCorrect ? 'text-red-600' :
                            isCorrectOption ? 'text-green-500' : 'text-gray-400'
                          }`}>
                            {getOptionLabel(optIndex)}.
                          </span>
                          <span className="flex-1 text-sm">{option}</span>
                          <div className="flex items-center gap-2">
                            {icon}
                            {isCorrectOption && !isSelected && (
                              <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

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
              <span
                className={`font-semibold mt-1 ${
                  !isEvaluated ? 'text-yellow-600' : (isPassed ? "text-green-600" : "text-red-600")
                }`}
              >
                {!isEvaluated ? 'Evaluation Pending' : (isPassed ? "Passed" : "Failed")}
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
                {result.submitted_at
                  ? new Date(result.submitted_at).toLocaleString()
                  : "N/A"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Accuracy</span>
              <span className="font-semibold text-gray-900 mt-1">
                {result.total_marks > 0
                  ? `${((result.score || 0) / (result.total_marks || 1) * 100).toFixed(1)}%`
                  : "0%"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}