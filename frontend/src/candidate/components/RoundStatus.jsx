// pages/coding/RoundStatus.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../configuration/api";

// ================================================================
// BADGE STYLES — minimal
// ================================================================

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-100",
  pending: "bg-amber-50 text-amber-700 border-amber-100",
  completed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-red-50 text-red-700 border-red-100",
};

const FINAL_STYLES = {
  Passed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Failed: "bg-red-50 text-red-700 border-red-100",
  Evaluated: "bg-blue-50 text-blue-700 border-blue-100",
  "In Progress": "bg-blue-50 text-blue-700 border-blue-100",
  "Awaiting Evaluation": "bg-amber-50 text-amber-700 border-amber-100",
  "Submitted - Awaiting Evaluation":
    "bg-orange-50 text-orange-700 border-orange-100",
  "Not Started": "bg-gray-100 text-gray-500 border-gray-200",
};

const Badge = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${className}`}
  >
    {children}
  </span>
);

// ================================================================
// MAIN COMPONENT
// ================================================================

export default function RoundStatus({ driveId }) {
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
        { headers: { Authorization: `Bearer ${token}` } },
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
    navigate(`/candidate/${roundType}/${roundId}/instructions`);
  };

  // ================================================================
  // LOADING
  // ================================================================

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <span className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
      </div>
    );
  }

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div className="space-y-3">
      {roundStatuses?.length > 0 ? (
        roundStatuses.map((round) => {
          const canStart =
            round.can_access &&
            round.round_status === "active" &&
            !round.attempt_status;
          const canResume =
            round.can_access &&
            round.attempt_status === "in_progress" &&
            round.round_status === "active" &&
            !round.is_locked;

          return (
            <div
              key={round.round_id}
              className="bg-white rounded-xl border border-gray-100 p-4 hover:border-gray-200 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      Round {round.round_order} · {round.round_type_display}
                    </h3>
                    <Badge
                      className={
                        STATUS_STYLES[round.round_status] ||
                        STATUS_STYLES.completed
                      }
                    >
                      {round.round_status}
                    </Badge>
                    {round.final_status &&
                      round.final_status !== "Not Started" && (
                        <Badge
                          className={
                            FINAL_STYLES[round.final_status] ||
                            FINAL_STYLES["Not Started"]
                          }
                        >
                          {round.final_status}
                        </Badge>
                      )}
                  </div>

                  {/* Lock reason */}
                  {round.is_locked && round.lock_reason && (
                    <p className="text-xs text-red-600 mt-1.5">
                      {round.lock_reason}
                    </p>
                  )}

                  {/* Attempt info */}
                  {round.attempt_status && (
                    <p className="text-xs text-gray-500 mt-1.5 capitalize">
                      Attempt · {round.attempt_status.replace("_", " ")}
                    </p>
                  )}

                  {/* Coding submission */}
                  {round.round_type === "coding" &&
                    round.coding_submission && (
                      <p className="text-xs text-gray-500 mt-1">
                        Submission ·{" "}
                        <span
                          className={
                            round.coding_submission.status === "evaluated"
                              ? "text-blue-600"
                              : round.coding_submission.status === "submitted"
                                ? "text-orange-600"
                                : "text-gray-600"
                          }
                        >
                          {round.coding_submission.status === "evaluated"
                            ? "Evaluated"
                            : round.coding_submission.status === "submitted"
                              ? "Awaiting Evaluation"
                              : round.coding_submission.status}
                        </span>
                      </p>
                    )}
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {canResume && (
                    <button
                      onClick={() =>
                        handleStartRound(round.round_id, round.round_type)
                      }
                      className="px-3.5 py-1.5 text-xs font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                    >
                      Resume
                    </button>
                  )}

                  {canStart && (
                    <button
                      onClick={() =>
                        handleStartRound(round.round_id, round.round_type)
                      }
                      className="px-3.5 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Start
                    </button>
                  )}

                  {round.is_locked && !canStart && !canResume && (
                    <span className="px-3.5 py-1.5 text-xs font-medium text-gray-400 bg-gray-50 rounded-lg border border-gray-100">
                      Locked
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-10 text-sm text-gray-400 bg-white rounded-xl border border-gray-100">
          No rounds available
        </div>
      )}
    </div>
  );
}