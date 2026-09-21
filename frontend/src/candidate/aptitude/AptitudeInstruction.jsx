// pages/aptitude/AptitudeInstructions.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import api from "../../configuration/api";

export const AptitudeInstructions = () => {
  const navigate = useNavigate();
  const { roundId } = useParams();
  const [loading, setLoading] = useState(true);
  const [roundInfo, setRoundInfo] = useState(null);
  const [driveId, setDriveId] = useState(null);
  const [attemptStatus, setAttemptStatus] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [roundId]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token");

      const roundRes = await api.get(
        `/candidate/get-round-details/${roundId}/`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (roundRes.data.success) {
        setRoundInfo(roundRes.data.data.round);
        setDriveId(roundRes.data.data.drive?.id);
      }

      const attemptRes = await api.get(
        `/candidate/get-attempt-status/${roundId}/`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (attemptRes.data.success) {
        setAttemptStatus(attemptRes.data.data);
        if (attemptRes.data.data.status === "in_progress") {
          navigate(`/candidate/aptitude/${roundId}/test`);
        }
      }
    } catch (error) {
      toast.error("Failed to load test information");
      navigate("/candidate/drive");
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `/candidate/start-aptitude-test/${roundId}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        navigate(`/candidate/aptitude/${roundId}/test`, {
          state: { attemptData: res.data.data },
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to start test");
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <Loader />;

  const status = roundInfo?.display_status || roundInfo?.status;
  const isCompleted =
    attemptStatus?.status === "completed" ||
    attemptStatus?.status === "passed" ||
    attemptStatus?.status === "failed";

  // ================================================================
  // COMPLETED — THANK YOU (NO MARKS)
  // ================================================================
  if (isCompleted && attemptStatus) {
    return (
      <div className="min-h-screen bg-gray-50 w-full flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 w-full max-w-md p-8 text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-emerald-50 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h2 className="text-lg font-medium text-gray-900 mb-1.5">
            Thank You!
          </h2>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            You have already completed this test. Your responses have been
            recorded successfully.
          </p>

          <button
            onClick={() => navigate(`/candidate/drive/${driveId}`)}
            className="w-full py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Return to Drive
          </button>
        </div>
      </div>
    );
  }

  // ================================================================
  // NORMAL INSTRUCTIONS VIEW
  // ================================================================
  const roundDuration =
    roundInfo?.round_duration_minutes || roundInfo?.duration_minutes || 0;
  const testDuration =
    roundInfo?.test_duration_minutes || roundInfo?.duration_minutes || 0;

  const stats = [
    { label: "Round Duration", value: `${roundDuration} min` },
    { label: "Test Duration", value: `${testDuration} min` },
    { label: "Questions", value: roundInfo?.total_questions || 0 },
  ];

  const guidelines = [
    { type: "bullet", text: "Read each question carefully before answering" },
    { type: "bullet", text: "You can navigate between questions freely" },
    {
      type: "bullet",
      text: "You can change answers before final submission",
    },
    { type: "warning", text: "Test will auto-submit when time runs out" },
    {
      type: "info",
      text: (
        <>
          You have{" "}
          <strong className="text-gray-900">{testDuration} minutes</strong> to
          complete the test
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      {/* Tight outer padding */}
      <div className="w-full px-4 lg:px-6 py-4">
        {/* Back */}
        <button
          onClick={() => navigate(`/candidate/drive/${driveId}`)}
          className="text-xs text-gray-500 hover:text-gray-700 mb-3 inline-flex items-center gap-1 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Drive
        </button>

        {/* Card — full width */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden w-full">
          {/* Compact header */}
          <div className="px-5 lg:px-6 py-4 border-b border-gray-100">
            <h1 className="text-lg font-medium text-gray-900">
              Aptitude Test Instructions
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {roundInfo?.round_type_display || "Aptitude"} · Read carefully
              before starting
            </p>
          </div>

          {/* Compact body */}
          <div className="p-5 lg:p-6">
            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100"
                >
                  <p className="text-xs text-gray-500 mb-0.5">{s.label}</p>
                  <p className="text-base font-medium text-gray-900 tabular-nums">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Guidelines */}
            <div className="mb-5">
              <h3 className="text-sm font-medium text-gray-900 mb-2.5">
                Important Instructions
              </h3>

              <ul className="space-y-2">
                {guidelines.map((g, i) => {
                  const baseRow =
                    "flex items-start gap-3 px-3.5 py-2.5 rounded-lg text-sm";

                  if (g.type === "warning") {
                    return (
                      <li
                        key={i}
                        className={`${baseRow} bg-amber-50 border border-amber-100`}
                      >
                        <span className="text-amber-600 font-medium text-xs mt-0.5">
                          !
                        </span>
                        <span className="text-amber-800">{g.text}</span>
                      </li>
                    );
                  }

                  if (g.type === "info") {
                    return (
                      <li
                        key={i}
                        className={`${baseRow} bg-blue-50 border border-blue-100`}
                      >
                        <span className="text-blue-600 font-medium text-xs mt-0.5">
                          i
                        </span>
                        <span className="text-blue-800">{g.text}</span>
                      </li>
                    );
                  }

                  return (
                    <li
                      key={i}
                      className={`${baseRow} bg-gray-50 border border-gray-100`}
                    >
                      <span className="text-gray-400 text-xs mt-0.5">•</span>
                      <span className="text-gray-700">{g.text}</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Button / status */}
            {status === "active" && !isCompleted && (
              <button
                onClick={handleStart}
                disabled={starting}
                className="w-full py-3 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {starting ? "Starting..." : "Start Test"}
              </button>
            )}

            {status !== "active" && !isCompleted && (
              <div className="w-full py-3 text-sm text-center font-medium text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                {status === "pending"
                  ? "Test not started yet"
                  : "Test not available"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AptitudeInstructions;