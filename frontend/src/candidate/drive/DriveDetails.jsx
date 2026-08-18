// pages/DriveDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Loader from "../components/Loader";
import api from "../../configuration/api";

// ================================================================
// CALCULATE ROUND DISPLAY STATUS
// ================================================================

const getRoundStatus = (round, now) => {
  if (!round.round_start_datetime) {
    return round.status;
  }

  const start = new Date(round.round_start_datetime);

  // Use round_duration_minutes if available, otherwise fallback to duration_minutes
  const duration = round.round_duration_minutes || round.duration_minutes || 60;
  const end = new Date(start.getTime() + duration * 60000);

  if (round.status === "completed" || round.status === "cancelled") {
    return round.status;
  }

  if (round.status === "pending" && now >= start) {
    return "active";
  }

  if (round.status === "active" && now >= end) {
    return "completed";
  }

  return round.status;
};

// ================================================================
// GET RESULT INFORMATION
// ================================================================

const getResultInfo = (round) => {
  // Admin decision exists
  if (round.decision_exists) {
    if (round.final_status === "Passed") {
      return { label: "Passed", color: "green" };
    }
    if (round.final_status === "Failed") {
      return { label: "Failed", color: "red" };
    }
    return { label: "Pending", color: "yellow" };
  }

  // Coding round
  if (round.round_type === "coding" && round.coding_submission) {
    const submissionStatus = round.coding_submission.status;
    if (submissionStatus === "evaluated") {
      return { label: "Evaluated", color: "blue" };
    }
    if (submissionStatus === "submitted") {
      return { label: "Submitted - Awaiting Evaluation", color: "orange" };
    }
  }

  // In Progress
  if (round.final_status === "In Progress") {
    return { label: "In Progress", color: "yellow" };
  }

  // Awaiting Evaluation
  if (round.final_status === "Awaiting Evaluation") {
    return { label: "Awaiting Evaluation", color: "yellow" };
  }

  // Not Started
  if (round.final_status === "Not Started") {
    return { label: "Not Started", color: "gray" };
  }

  // Default
  return { label: round.final_status || "Pending", color: "gray" };
};

// ================================================================
// MAIN COMPONENT
// ================================================================

export const DriveDetails = () => {
  const { driveId } = useParams();
  const navigate = useNavigate();

  const [drive, setDrive] = useState(null);
  const [loading, setLoading] = useState(true);

  // ================================================================
  // FETCH DRIVE DETAILS
  // ================================================================

  useEffect(() => {
    fetchDrive();
  }, [driveId]);

  const fetchDrive = async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem("token");

      const response = await api.get(
        `/candidate/get-drive-details/${driveId}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.data.success) {
        toast.error("Failed to load drive");
        navigate("/candidate/drive");
        return;
      }

      const data = response.data.data;

      let updatedRounds = data.rounds_with_status || [];

      const now = new Date();

      updatedRounds = updatedRounds.map((round) => ({
        ...round,
        displayStatus: getRoundStatus(round, now),
      }));

      data.rounds = updatedRounds;

      setDrive(data);
    } catch (error) {
      console.error("Error fetching drive details:", error);
      toast.error("Failed to load drive");
      navigate("/candidate/drive");
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // HANDLE ROUND ACTION
  // ================================================================

  const handleAction = (roundId, roundType, action) => {
    if (action === "start") {
      navigate(`/candidate/${roundType}/${roundId}/instructions`);
    }
    if (action === "resume") {
      navigate(`/candidate/${roundType}/${roundId}/test`);
    }
  };

  // ================================================================
  // LOADING
  // ================================================================

  if (loading) {
    return <Loader />;
  }

  if (!drive) {
    return (
      <div className="text-center py-8 text-gray-500">Drive not found</div>
    );
  }

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-3 py-3">
        {/* Back Button */}
        <button
          onClick={() => navigate("/candidate/drive")}
          className="text-blue-600 hover:text-blue-800 text-sm mb-3 flex items-center gap-1"
        >
          <span className="text-blue-600">←</span> Back to Drives
        </button>

        {/* Drive Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <h1 className="text-xl font-semibold text-gray-900">{drive.title}</h1>

          {drive.description && (
            <p className="text-sm text-gray-500 mt-1">{drive.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3 text-sm">
            <div>
              <span className="text-gray-500">CTC:</span>
              <span className="font-medium text-gray-700 ml-1">
                {drive.ctc || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Location:</span>
              <span className="font-medium text-gray-700 ml-1">
                {drive.job_location || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span
                className={`font-medium capitalize ml-1 ${
                  drive.status === "active" ? "text-green-600" : "text-gray-600"
                }`}
              >
                {drive.status || "Draft"}
              </span>
            </div>
          </div>
        </div>

        {/* Rounds */}
        <h2 className="text-base font-semibold text-gray-900 mb-3">Rounds</h2>

        <div className="space-y-3">
          {drive.rounds && drive.rounds.length > 0 ? (
            [...drive.rounds]
              .sort((a, b) => a.round_order - b.round_order)
              .map((round) => {
                const status = round.displayStatus || round.status;
                const isTest =
                  round.round_type === "aptitude" ||
                  round.round_type === "coding";
                const resultInfo = getResultInfo(round);
                const isInProgress = round.final_status === "In Progress";
                const isPassed = round.final_status === "Passed";
                const isFailed = round.final_status === "Failed";
                const isEvaluated = round.final_status === "Evaluated";
                const isSubmitted =
                  round.final_status === "Submitted - Awaiting Evaluation";

                // Get duration values
                const roundDuration =
                  round.round_duration_minutes ||
                  round.duration_minutes ||
                  "N/A";
                const testDuration = round.test_duration_minutes || "N/A";

                return (
                  <div
                    key={round.id}
                    className="bg-white rounded-lg border border-gray-200 p-4"
                  >
                    {/* Round Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-500 w-10">
                          {round.round_type === "aptitude"
                            ? "Apt"
                            : round.round_type === "coding"
                              ? "Cod"
                              : round.round_type === "gd"
                                ? "GD"
                                : round.round_type === "technical"
                                  ? "Tech"
                                  : "HR"}
                        </span>

                        <div>
                          <h3 className="font-medium text-sm text-gray-900">
                            Round {round.round_order}:{" "}
                            {round.round_type_display || round.round_type}
                          </h3>
                          <div className="flex gap-3 text-xs text-gray-500 mt-0.5">
                            <span>Round: {roundDuration} min</span>
                            <span>Test: {testDuration} min</span>
                          </div>
                        </div>
                      </div>

                      {/* Round Status */}
                      <span
                        className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                          status === "active"
                            ? "bg-green-100 text-green-700"
                            : status === "pending"
                              ? "bg-yellow-100 text-yellow-700"
                              : status === "completed"
                                ? "bg-gray-100 text-gray-500"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    {/* Result Section */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {isTest && (
                        <div className="flex items-center gap-3 flex-wrap">
                          {/* Result Badge */}
                          {round.attempt_score !== null &&
                            round.attempt_score !== undefined && (
                              <span
                                className={`px-3 py-1 text-xs rounded-lg ${
                                  resultInfo.color === "green"
                                    ? "bg-green-50 text-green-700"
                                    : resultInfo.color === "red"
                                      ? "bg-red-50 text-red-700"
                                      : resultInfo.color === "blue"
                                        ? "bg-blue-50 text-blue-700"
                                        : resultInfo.color === "orange"
                                          ? "bg-orange-50 text-orange-700"
                                          : "bg-gray-50 text-gray-600"
                                }`}
                              >
                                {resultInfo.label}
                              </span>
                            )}

                          {/* Status Without Score */}
                          {(round.attempt_score === null ||
                            round.attempt_score === undefined) && (
                            <span
                              className={`px-3 py-1 text-xs rounded-lg ${
                                resultInfo.color === "green"
                                  ? "bg-green-50 text-green-700"
                                  : resultInfo.color === "red"
                                    ? "bg-red-50 text-red-700"
                                    : resultInfo.color === "blue"
                                      ? "bg-blue-50 text-blue-700"
                                      : resultInfo.color === "orange"
                                        ? "bg-orange-50 text-orange-700"
                                        : resultInfo.color === "yellow"
                                          ? "bg-yellow-50 text-yellow-700"
                                          : "bg-gray-50 text-gray-600"
                              }`}
                            >
                              {resultInfo.label}
                            </span>
                          )}

                          {/* Score */}
                          {round.attempt_score !== null &&
                            round.attempt_score !== undefined && (
                              <span className="text-xs text-gray-500">
                                Score: {round.attempt_score} /{" "}
                                {round.attempt_total_marks ?? 0}
                                {round.attempt_percentage !== null &&
                                  round.attempt_percentage !== undefined && (
                                    <> ({round.attempt_percentage}%)</>
                                  )}
                              </span>
                            )}
                        </div>
                      )}

                      {/* Coding Submission Information */}
                      {round.round_type === "coding" &&
                        round.coding_submission && (
                          <div className="mt-2 text-xs text-gray-500">
                            <span className="font-medium">Submission:</span>{" "}
                            {round.coding_submission.status === "evaluated" ? (
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
                            {round.coding_submission.evaluated_at && (
                              <span className="ml-2 text-gray-400">
                                Evaluated:{" "}
                                {new Date(
                                  round.coding_submission.evaluated_at,
                                ).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}

                      {/* Aptitude / Other Round Status */}
                      {round.round_type === "aptitude" &&
                        round.decision_exists && (
                          <div className="mt-2 text-xs text-gray-500">
                            Result decided by admin:
                            <span
                              className={`ml-1 font-medium ${
                                isPassed
                                  ? "text-green-600"
                                  : isFailed
                                    ? "text-red-600"
                                    : "text-yellow-600"
                              }`}
                            >
                              {round.final_status}
                            </span>
                          </div>
                        )}

                      {/* Lock Message */}
                      {round.is_locked && (
                        <div className="mt-2 text-xs text-red-600">
                          {round.lock_reason}
                        </div>
                      )}

                      {/* Start / Resume Button */}
                      {round.can_access &&
                        round.display_status === "active" &&
                        !round.attempt_status && (
                          <button
                            onClick={() =>
                              handleAction(round.id, round.round_type, "start")
                            }
                            className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Start {round.round_type_display}
                          </button>
                        )}

                      {/* Resume */}
                      {round.can_access &&
                        round.attempt_status === "in_progress" &&
                        round.round_status === "active" && (
                          <button
                            onClick={() =>
                              handleAction(round.id, round.round_type, "resume")
                            }
                            className="mt-3 px-4 py-2 bg-yellow-600 text-white text-xs font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                          >
                            Resume Test
                          </button>
                        )}

                      {/* Pending */}
                      {!round.attempt_status &&
                        status === "pending" &&
                        round.round_start_datetime && (
                          <span className="block mt-2 text-xs text-gray-500">
                            Round starts at{" "}
                            {new Date(
                              round.round_start_datetime,
                            ).toLocaleString()}
                          </span>
                        )}
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-8 text-gray-500">
              No rounds available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriveDetails;