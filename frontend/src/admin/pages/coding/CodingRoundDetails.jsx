// admin/pages/coding/CodingRoundDetails.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../configuration/api";
import { FaArrowLeft, FaEye, FaChartBar } from "react-icons/fa";
import CodingResultTable from "./components/CodingResultTable";

export default function CodingRoundDetails() {
  const navigate = useNavigate();
  const { driveId, roundId } = useParams();
  const [loading, setLoading] = useState(true);
  const [roundData, setRoundData] = useState(null);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalMarks: 0,
    totalCandidates: 0,
    completed: 0,
    pending: 0,
    passed: 0,
    failed: 0,
    averageScore: 0,
    highestScore: 0,
    lowestScore: 0,
  });

  // Helper functions to determine status based on candidate_decision
  const isPassed = (result) => {
    const hasDecision =
      result.candidate_decision !== null &&
      result.candidate_decision !== undefined &&
      result.candidate_decision.decision !== "pending";
    if (hasDecision) {
      return result.candidate_decision.decision === "shortlisted";
    }
    return (result.percentage || 0) >= 40;
  };

  const isFailed = (result) => {
    const hasDecision =
      result.candidate_decision !== null &&
      result.candidate_decision !== undefined &&
      result.candidate_decision.decision !== "pending";
    if (hasDecision) {
      return result.candidate_decision.decision === "rejected";
    }
    return (
      (result.percentage || 0) < 40 &&
      (result.status === "completed" || result.status === "evaluated")
    );
  };

  const isPending = (result) => {
    const hasDecision =
      result.candidate_decision !== null &&
      result.candidate_decision !== undefined &&
      result.candidate_decision.decision !== "pending";
    return (
      !hasDecision &&
      (result.status === "in_progress" ||
        result.status === "pending" ||
        !result.status)
    );
  };

  useEffect(() => {
    fetchRoundDetails();
  }, [roundId]);

  const fetchRoundDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Fetch round details
      const roundResponse = await api.get(
        `/canadmin/get-round-details/${roundId}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (roundResponse.data.success) {
        const data = roundResponse.data.data;
        setRoundData(data);

        // Update stats with round data
        setStats((prev) => ({
          ...prev,
          totalQuestions: data.total_questions || 0,
          totalMarks: data.total_marks || 0,
          ...(data.candidate_stats && {
            totalCandidates: data.candidate_stats.total_candidates || 0,
            completed: data.candidate_stats.completed || 0,
            pending: data.candidate_stats.pending || 0,
            passed: data.candidate_stats.passed || 0,
            failed: data.candidate_stats.failed || 0,
            averageScore: data.candidate_stats.average_score || 0,
            highestScore: data.candidate_stats.highest_score || 0,
            lowestScore: data.candidate_stats.lowest_score || 0,
          }),
        }));
      }

      // Fetch results
      const resultResponse = await api.get(
        `/canadmin/list-coding-results/${roundId}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (resultResponse.data.success) {
        const resultsList = resultResponse.data.data.results || [];
        setResults(resultsList);

        // Calculate stats from results
        const totalCandidates = resultsList.length;
        const completed = resultsList.filter(
          (r) =>
            r.status === "completed" ||
            r.status === "evaluated" ||
            r.status === "submitted"
        ).length;
        const pending = resultsList.filter((r) => isPending(r)).length;
        const passed = resultsList.filter((r) => isPassed(r)).length;
        const failed = resultsList.filter((r) => isFailed(r)).length;

        const scores = resultsList
          .filter(
            (r) =>
              r.status === "completed" ||
              r.status === "evaluated" ||
              r.status === "submitted"
          )
          .map((r) => r.score || 0);

        const avgScore =
          scores.length > 0
            ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
            : 0;
        const highest = scores.length > 0 ? Math.max(...scores) : 0;
        const lowest = scores.length > 0 ? Math.min(...scores) : 0;

        setStats((prev) => ({
          ...prev,
          totalCandidates,
          completed,
          pending,
          passed,
          failed,
          averageScore: avgScore,
          highestScore: highest,
          lowestScore: lowest,
        }));
      }
    } catch (error) {
      console.error("Error fetching round details:", error);
      toast.error(
        error.response?.data?.message || "Failed to load round details"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewQuestions = () => {
    if (driveId && driveId !== "undefined") {
      navigate(`/admin/drive/${driveId}/round/${roundId}/coding-questions`);
    } else {
      navigate(`/admin/coding-round/${roundId}/questions`);
    }
  };

  const handleManageResults = () => {
    navigate(`/admin/coding-round/${roundId}/manage-results`);
  };

  const handleViewResult = (attemptId) => {
    navigate(`/admin/coding-round/${roundId}/result/${attemptId}`);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      active: "bg-green-100 text-green-700 border-green-200",
      completed: "bg-gray-100 text-gray-700 border-gray-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    };
    return colors[status] || colors.pending;
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
          onClick={() => navigate("/admin/drive")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaArrowLeft className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coding Round</h1>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(roundData?.status)}`}
            >
              {roundData?.status
                ? roundData.status.charAt(0).toUpperCase() +
                  roundData.status.slice(1)
                : "Draft"}
            </span>
            <span className="text-sm text-gray-500">
              {roundData?.duration_minutes || 0} Minutes
            </span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500">
              Created{" "}
              {roundData?.created_at
                ? new Date(roundData.created_at).toLocaleDateString()
                : "N/A"}
            </span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleManageResults}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <FaChartBar size={14} /> Manage Results
          </button>
          <button
            onClick={handleViewQuestions}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <FaEye size={14} /> View Questions
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Questions</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            {stats.totalQuestions}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Total Marks</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            {stats.totalMarks}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Candidates</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            {stats.totalCandidates}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Passed</p>
          <p className="text-xl font-semibold text-green-600 mt-1">
            {stats.passed}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Failed</p>
          <p className="text-xl font-semibold text-red-600 mt-1">
            {stats.failed}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Average Score</p>
          <p className="text-xl font-semibold text-gray-900 mt-1">
            {stats.averageScore}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-medium text-gray-700">
            Candidate Results
          </h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1 text-green-600">
              <span className="text-green-600">●</span> {stats.passed} Passed
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <span className="text-red-600">●</span> {stats.failed} Failed
            </span>
            <span className="flex items-center gap-1 text-yellow-600">
              <span className="text-yellow-600">●</span> {stats.pending} Pending
            </span>
          </div>
        </div>

        {results.length > 0 ? (
          <CodingResultTable
            results={results}
            onViewResult={handleViewResult}
          />
        ) : (
          <div className="py-12 text-center">
            <p className="text-sm text-gray-500">No results available yet</p>
            <p className="text-xs text-gray-400 mt-1">
              Candidates will appear here once they submit the test
            </p>
          </div>
        )}
      </div>
    </div>
  );
}