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
// HELPER: HAS THE ROUND BEEN FINAL-SUBMITTED?
// ================================================================

const isRoundSubmitted = (round) => {
  // Coding round — check the coding_submission object
  if (round.round_type === "coding" && round.coding_submission) {
    const s = round.coding_submission.status;
    // "submitted" or "evaluated" both mean the round is done
    if (s === "submitted" || s === "evaluated") {
      return true;
    }
  }

  // Generic fallbacks (works for aptitude too)
  if (round.final_status === "Submitted - Awaiting Evaluation") return true;
  if (round.final_status === "Awaiting Evaluation") return true;
  if (round.final_status === "Evaluated") return true;
  if (round.final_status === "Passed") return true;
  if (round.final_status === "Failed") return true;

  // attempt_status of completed/passed/failed also means done
  if (round.attempt_status === "completed") return true;
  if (round.attempt_status === "passed") return true;
  if (round.attempt_status === "failed") return true;

  return false;
};

// ================================================================
// GET SINGLE RESULT MESSAGE
// Priority-based: returns ONE message (or null)
// ================================================================

const getRoundMessage = (round, status) => {
  // 1. Locked — highest priority
  if (round.is_locked) {
    return { text: round.lock_reason || "Round is locked", color: "red" };
  }

  // 2. Admin decision (Passed / Failed / Pending)
  if (round.decision_exists) {
    if (round.final_status === "Passed") {
      return { text: "Passed", color: "green" };
    }
    if (round.final_status === "Failed") {
      return { text: "Failed", color: "red" };
    }
    return { text: "Result: Pending", color: "yellow" };
  }

  // 3. Coding submission status
  if (round.round_type === "coding" && round.coding_submission) {
    const submissionStatus = round.coding_submission.status;
    if (submissionStatus === "evaluated") {
      return { text: "Evaluated", color: "blue" };
    }
    if (submissionStatus === "submitted") {
      return { text: "Submitted — Awaiting Evaluation", color: "orange" };
    }
  }

  // 4. Final status fallbacks
  if (round.final_status === "In Progress") {
    return { text: "In Progress", color: "yellow" };
  }
  if (round.final_status === "Awaiting Evaluation") {
    return { text: "Awaiting Evaluation", color: "yellow" };
  }
  if (round.final_status === "Submitted - Awaiting Evaluation") {
    return { text: "Submitted — Awaiting Evaluation", color: "orange" };
  }
  if (round.final_status === "Not Started") {
    return { text: "Not Started", color: "gray" };
  }

  // 5. Pending round with scheduled start
  if (
    !round.attempt_status &&
    status === "pending" &&
    round.round_start_datetime
  ) {
    return {
      text: `Starts at ${new Date(round.round_start_datetime).toLocaleString()}`,
      color: "gray",
    };
  }

  // 6. Nothing important to show
  return null;
};

// ================================================================
// MESSAGE COLOR MAP
// ================================================================

const MESSAGE_COLORS = {
  green: "bg-green-50 text-green-700 border-green-200",
  red: "bg-red-50 text-red-700 border-red-200",
  yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
  blue: "bg-blue-50 text-blue-700 border-blue-200",
  orange: "bg-orange-50 text-orange-700 border-orange-200",
  gray: "bg-gray-50 text-gray-600 border-gray-200",
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

                // Get duration values
                const roundDuration =
                  round.round_duration_minutes ||
                  round.duration_minutes ||
                  "N/A";
                const testDuration = round.test_duration_minutes || "N/A";

                // Has the round been final-submitted?
                const submitted = isRoundSubmitted(round);

                // -------- Determine SINGLE button --------
                let button = null;

                // ❌ Locked — no button
                if (round.is_locked) {
                  button = null;
                }
                // ❌ Round already submitted — disable (no Resume, no Start)
                else if (submitted) {
                  button = null;
                }
                // ✅ Resume — only if:
                //    - candidate has access
                //    - attempt is in progress
                //    - round is active
                //    - round NOT yet submitted
                //    - it's a coding round (per your requirement) OR aptitude
                else if (
                  round.can_access &&
                  round.attempt_status === "in_progress" &&
                  status === "active" &&
                  !submitted &&
                  (round.round_type === "coding" ||
                    round.round_type === "aptitude")
                ) {
                  button = {
                    label: "Resume Test",
                    className: "bg-yellow-600 hover:bg-yellow-700 text-white",
                    action: "resume",
                  };
                }
                // ✅ Start — accessible, active, never attempted
                else if (
                  round.can_access &&
                  status === "active" &&
                  !round.attempt_status
                ) {
                  button = {
                    label: `Start ${round.round_type_display || "Round"}`,
                    className: "bg-blue-600 hover:bg-blue-700 text-white",
                    action: "start",
                  };
                }

                // -------- Determine SINGLE message --------
                const message = getRoundMessage(round, status);

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

                      {/* Round Status Badge */}
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

                    {/* Footer: single message + single button */}
                    {(message || button) && (
                      <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                        {/* Single message */}
                        {message ? (
                          <span
                            className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                              MESSAGE_COLORS[message.color] ||
                              MESSAGE_COLORS.gray
                            }`}
                          >
                            {message.text}
                          </span>
                        ) : (
                          <span />
                        )}

                        {/* Single button */}
                        {button && (
                          <button
                            onClick={() =>
                              handleAction(
                                round.id,
                                round.round_type,
                                button.action,
                              )
                            }
                            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${button.className}`}
                          >
                            {button.label}
                          </button>
                        )}
                      </div>
                    )}
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