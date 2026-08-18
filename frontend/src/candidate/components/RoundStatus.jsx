import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaHourglassHalf,
  FaSpinner,
  FaCode,
} from "react-icons/fa";

import api from "../../configuration/api";

export default function RoundStatus({ driveId, rounds }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [roundStatuses, setRoundStatuses] = useState([]);

  useEffect(() => {
    fetchRoundStatus();
  }, [driveId]);

  const fetchRoundStatus = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await api.get(
        `/candidate/get-candidate-round-status/${driveId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setRoundStatuses(response.data.data.rounds || []);
      }
    } catch (error) {
      console.error("Error fetching round status:", error);
      toast.error("Failed to load round status");
    } finally {
      setLoading(false);
    }
  };

  const handleStartRound = (roundId, roundType) => {
    if (roundType === "coding") {
      navigate(`/candidate/coding/${roundId}/instructions`);
    } else if (roundType === "aptitude") {
      navigate(`/candidate/aptitude/${roundId}/instructions`);
    }
  };

  // ================================================================
  // ROUND STATUS BADGE
  // ================================================================

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
            <FaCheckCircle className="w-3 h-3" />
            Active
          </span>
        );

      case "pending":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1">
            <FaClock className="w-3 h-3" />
            Pending
          </span>
        );

      case "completed":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 border border-gray-200 flex items-center gap-1">
            <FaCheckCircle className="w-3 h-3" />
            Completed
          </span>
        );

      case "cancelled":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
            <FaTimesCircle className="w-3 h-3" />
            Cancelled
          </span>
        );

      default:
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500 border border-gray-200">
            {status || "Unknown"}
          </span>
        );
    }
  };

  // ================================================================
  // FINAL RESULT BADGE
  // ================================================================

  const getFinalStatusBadge = (finalStatus, roundType) => {
    switch (finalStatus) {
      // Passed
      case "Passed":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200 flex items-center gap-1">
            <FaCheckCircle className="w-3 h-3" />
            Passed
          </span>
        );

      // Failed
      case "Failed":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
            <FaTimesCircle className="w-3 h-3" />
            Failed
          </span>
        );

      // Coding Evaluated
      case "Evaluated":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
            <FaCheckCircle className="w-3 h-3" />
            Evaluated
          </span>
        );

      // In Progress
      case "In Progress":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1">
            <FaSpinner className="w-3 h-3 animate-spin" />
            In Progress
          </span>
        );

      // Awaiting Evaluation
      case "Awaiting Evaluation":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200 flex items-center gap-1">
            <FaHourglassHalf className="w-3 h-3" />
            Awaiting Evaluation
          </span>
        );

      // Submitted - Awaiting Evaluation
      case "Submitted - Awaiting Evaluation":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 border border-orange-200 flex items-center gap-1">
            {roundType === "coding" ? (
              <FaCode className="w-3 h-3" />
            ) : (
              <FaClock className="w-3 h-3" />
            )}
            Submitted - Awaiting Evaluation
          </span>
        );

      // Not Started
      case "Not Started":
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500 border border-gray-200">
            Not Started
          </span>
        );

      default:
        return (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500 border border-gray-200">
            {finalStatus || "Pending"}
          </span>
        );
    }
  };

  // ================================================================
  // LOADING STATE
  // ================================================================

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // ================================================================
  // UI RENDER
  // ================================================================

  return (
    <div className="space-y-4">
      {roundStatuses && roundStatuses.length > 0 ? (
        roundStatuses.map((round) => (
          <div
            key={round.round_id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

              {/* Left Side */}
              <div className="flex-1">

                {/* Round Header */}
                <div className="flex flex-wrap items-center gap-2">

                  <span className="font-semibold text-gray-900">
                    Round {round.round_order}:{" "}
                    {round.round_type_display}
                  </span>

                  <span className="text-gray-300">|</span>

                  {getStatusBadge(round.round_status)}

                  <span className="text-gray-300">|</span>

                  {getFinalStatusBadge(
                    round.final_status,
                    round.round_type
                  )}
                </div>

                {/* Lock Message */}
                {round.is_locked && (
                  <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                    <FaTimesCircle className="w-4 h-4" />
                    {round.lock_reason}
                  </p>
                )}

                {/* Attempt Information */}
                {round.attempt_status && (
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">

                    <span className="flex items-center gap-1">
                      <span className="font-medium">
                        Attempt:
                      </span>

                      <span className="capitalize">
                        {round.attempt_status.replace("_", " ")}
                      </span>
                    </span>

                    {/* Score */}
                    {round.score !== undefined &&
                      round.score !== null && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">
                            Score:
                          </span>

                          <span className="text-blue-600 font-medium">
                            {round.score}
                            {round.total_marks !== null &&
                              round.total_marks !== undefined &&
                              `/${round.total_marks}`}
                          </span>
                        </span>
                      )}

                    {/* Percentage */}
                    {round.percentage !== undefined &&
                      round.percentage !== null && (
                        <span className="flex items-center gap-1">
                          <span className="font-medium">
                            Percentage:
                          </span>

                          <span
                            className={`font-medium ${
                              Number(round.percentage) >= 40
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {round.percentage}%
                          </span>
                        </span>
                      )}
                  </div>
                )}

                {/* ====================================================
                    CODING SUBMISSION DETAILS
                ==================================================== */}

                {round.round_type === "coding" &&
                  round.coding_submission && (
                    <div className="text-sm mt-2">

                      <span className="font-medium text-gray-500">
                        Submission:
                      </span>{" "}

                      {round.coding_submission.status ===
                      "evaluated" ? (
                        <span className="text-blue-600 font-medium">
                          Evaluated
                        </span>
                      ) : round.coding_submission.status ===
                        "submitted" ? (
                        <span className="text-orange-600 font-medium">
                          Submitted - Awaiting Evaluation
                        </span>
                      ) : (
                        <span className="text-gray-600 font-medium">
                          {round.coding_submission.status}
                        </span>
                      )}

                      {/* Evaluated Date */}
                      {round.coding_submission.evaluated_at && (
                        <span className="ml-2 text-xs text-gray-400">
                          Evaluated:{" "}
                          {new Date(
                            round.coding_submission.evaluated_at
                          ).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-2 flex-shrink-0">

                {/* Start Button */}
                {round.can_access &&
                  round.round_status === "active" &&
                  !round.attempt_status && (
                    <button
                      onClick={() =>
                        handleStartRound(
                          round.round_id,
                          round.round_type
                        )
                      }
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap font-medium"
                    >
                      Start {round.round_type_display}
                    </button>
                  )}

                {/* In Progress / Resume */}
                {round.can_access &&
                  round.attempt_status === "in_progress" &&
                  round.round_status === "active" && (
                    <button
                      onClick={() =>
                        handleStartRound(
                          round.round_id,
                          round.round_type
                        )
                      }
                      className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors whitespace-nowrap font-medium"
                    >
                      Resume
                    </button>
                  )}

                {/* Completed */}
                {round.attempt_status === "completed" &&
                  round.final_status !== "Evaluated" &&
                  !round.is_locked && (
                    <span className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg whitespace-nowrap">
                      Completed
                    </span>
                  )}

                {/* Evaluated */}
                {round.final_status === "Evaluated" && (
                  <span className="px-4 py-2 bg-blue-50 text-blue-600 text-sm rounded-lg whitespace-nowrap font-medium">
                    Evaluated
                  </span>
                )}

                {/* Passed */}
                {round.final_status === "Passed" && (
                  <span className="px-4 py-2 bg-green-50 text-green-600 text-sm rounded-lg whitespace-nowrap font-medium">
                    Passed
                  </span>
                )}

                {/* Failed */}
                {round.final_status === "Failed" && (
                  <span className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg whitespace-nowrap font-medium">
                    Failed
                  </span>
                )}

                {/* Locked */}
                {round.is_locked && (
                  <span className="px-4 py-2 bg-gray-100 text-gray-400 text-sm rounded-lg cursor-not-allowed whitespace-nowrap flex items-center gap-1">
                    <FaTimesCircle className="w-4 h-4" />
                    Locked
                  </span>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500 bg-white rounded-xl border border-gray-200">
          <p className="text-sm">
            No rounds available
          </p>
        </div>
      )}
    </div>
  );
}