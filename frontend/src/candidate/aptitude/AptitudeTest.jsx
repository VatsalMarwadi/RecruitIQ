// pages/aptitude/AptitudeTest.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import api from "../../configuration/api";

export const AptitudeTest = () => {
  const navigate = useNavigate();
  const { roundId } = useParams();
  const location = useLocation();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [unanswered, setUnanswered] = useState([]);
  const timerRef = useRef(null);

  // =======================================================
  // LOAD TEST
  // =======================================================

  useEffect(() => {
    if (location.state?.attemptData) {
      const data = location.state.attemptData;
      setQuestions(data.questions || []);
      setAttemptId(data.attempt_id);

      const testDuration =
        data.test_duration_minutes || data.duration_minutes || 0;
      setTimeLeft(data.remaining_seconds || testDuration * 60);

      if (data.answers) setAnswers(data.answers);

      setLoading(false);
    } else {
      fetchTest();
    }

    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !loading && questions.length) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timeLeft, loading, questions]);

  const fetchTest = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.post(
        `/candidate/start-aptitude-test/${roundId}/`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.data.success) {
        setQuestions(res.data.data.questions || []);
        setAttemptId(res.data.data.attempt_id);
        const testDuration =
          res.data.data.test_duration_minutes ||
          res.data.data.duration_minutes ||
          0;
        setTimeLeft(res.data.data.remaining_seconds || testDuration * 60);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load test");
      navigate(`/candidate/drive/${roundId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleAutoSubmit = () => {
    if (!submitting) submitTest(true);
  };

  const handleSubmit = () => {
    const unansweredList = questions.filter((q) => !answers[q.id]);
    if (unansweredList.length) {
      setUnanswered(unansweredList);
      setShowConfirm(true);
    } else {
      submitTest(false);
    }
  };

  const submitTest = async (isAuto = false) => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const answerList = Object.entries(answers).map(([qId, opt]) => ({
        question_id: parseInt(qId),
        selected_option: opt,
      }));

      const response = await api.post(
        `/candidate/submit-aptitude-test/${attemptId}/`,
        { answers: answerList },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      clearInterval(timerRef.current);

      if (response.data.success) {
        setShowThankYou(true);
      } else {
        toast.error(response.data.message || "Failed to submit test");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit test");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmSubmit = () => {
    setShowConfirm(false);
    submitTest(false);
  };

  const handleRedirect = () => {
    navigate(`/candidate/drive/${roundId}`);
  };

  // =======================================================
  // TIMER
  // =======================================================

  const Timer = ({ initialTime, onExpire }) => {
    const [time, setTime] = useState(initialTime || 0);

    useEffect(() => {
      if (time <= 0) {
        onExpire?.();
        return;
      }
      const interval = setInterval(() => setTime((prev) => prev - 1), 1000);
      return () => clearInterval(interval);
    }, [time, onExpire]);

    const formatTime = (seconds) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hrs > 0) {
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      }
      return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const isWarning = time < 300;

    return (
      <span
        className={`font-mono text-sm font-medium tabular-nums px-2.5 py-1 rounded-md ${
          isWarning
            ? "text-red-600 bg-red-50 animate-pulse"
            : "text-gray-700 bg-gray-100"
        }`}
      >
        {formatTime(time)}
      </span>
    );
  };

  if (loading) return <Loader />;

  // =======================================================
  // THANK YOU (NO MARKS) — MINIMAL
  // =======================================================

  if (showThankYou) {
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-sm w-full p-8 text-center shadow-lg">
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
            Your test has been submitted successfully. Your responses have been
            recorded.
          </p>

          <button
            onClick={handleRedirect}
            className="w-full py-2.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Return to Drive
          </button>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];
  const total = questions.length;
  const answered = Object.keys(answers).length;

  // =======================================================
  // MAIN UI
  // =======================================================

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* =================================================
          HEADER
      ================================================= */}

      <header className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-sm font-medium text-gray-900">Aptitude Test</h1>

          <span className="text-xs text-gray-500 tabular-nums">
            Q{currentIndex + 1} / {total}
          </span>

          <span className="text-xs text-emerald-600 font-medium tabular-nums">
            {answered} / {total} answered
          </span>
        </div>

        <Timer initialTime={timeLeft} onExpire={handleAutoSubmit} />
      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* =================================================
            QUESTION AREA
        ================================================= */}

        <div className="flex-1 flex flex-col overflow-hidden p-6 bg-white">
          {current && (
            <>
              {/* Question */}
              <div className="flex-shrink-0 mb-5">
                <p className="text-base font-medium text-gray-900 leading-relaxed">
                  {current.question}
                </p>
              </div>

              {/* Options */}
              <div className="flex-shrink-0 space-y-2">
                {[0, 1, 2, 3].map((idx) => {
                  const key = `option_${idx + 1}`;
                  const selected = answers[current.id] === key;

                  return (
                    <button
                      key={key}
                      onClick={() => handleSelect(current.id, key)}
                      className={`w-full text-left rounded-lg border transition-all ${
                        selected
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-3 px-3.5 py-2.5">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                            selected
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span
                          className={`text-sm ${
                            selected
                              ? "text-gray-900 font-medium"
                              : "text-gray-700"
                          }`}
                        >
                          {current[key]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Navigation Footer */}
              <div className="flex-shrink-0 mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentIndex((prev) => prev - 1)}
                    disabled={currentIndex === 0}
                    className="px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  {currentIndex < total - 1 && (
                    <button
                      onClick={() => setCurrentIndex((prev) => prev + 1)}
                      className="px-3.5 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors"
                    >
                      Next
                    </button>
                  )}
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Test"}
                </button>
              </div>
            </>
          )}
        </div>

        {/* =================================================
            QUESTION PALETTE
        ================================================= */}

        <aside className="w-72 bg-white border-l border-gray-100 p-5 overflow-y-auto flex-shrink-0">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
            Question Palette
          </h4>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isCurrent = idx === currentIndex;
              const isAnswered = !!answers[q.id];

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-10 h-10 rounded-md text-xs font-medium transition-colors ${
                    isCurrent
                      ? "bg-gray-900 text-white"
                      : isAnswered
                        ? "bg-emerald-500 text-white hover:bg-emerald-600"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="space-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded bg-emerald-500" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded bg-gray-100 border border-gray-200" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded bg-gray-900" />
                <span>Current</span>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500 tabular-nums">
              <span className="text-gray-900 font-medium">{answered}</span> /{" "}
              {total} answered
            </p>
          </div>
        </aside>
      </div>

      {/* =================================================
          CONFIRMATION MODAL — MINIMAL
      ================================================= */}

      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-lg">
            <h3 className="text-base font-medium text-gray-900 mb-1.5">
              Unanswered Questions
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              You have{" "}
              <span className="text-gray-900 font-medium">
                {unanswered.length}
              </span>{" "}
              unanswered question{unanswered.length > 1 ? "s" : ""}. They will
              be marked incorrect.
            </p>

            {/* Unanswered list */}
            <div className="max-h-40 overflow-y-auto mb-4 rounded-lg border border-gray-100 divide-y divide-gray-100">
              {unanswered.map((q) => {
                const idx = questions.indexOf(q) + 1;
                return (
                  <div
                    key={q.id}
                    className="flex items-start gap-2.5 px-3 py-2 text-xs"
                  >
                    <span className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 text-gray-600 font-medium flex-shrink-0">
                      {idx}
                    </span>
                    <span className="text-gray-600 line-clamp-2">
                      {q.question}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Anyway"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AptitudeTest;