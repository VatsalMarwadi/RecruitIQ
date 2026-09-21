// pages/coding/CodingTest.jsx

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Loader from "../components/Loader";
import { CodingQuestionNavigator } from "./CodingQuestionNavigator";
import SubmitConfirmationModal from "../drive/SubmitConfirmation";
import FinalSubmissionModal from "../drive/FinalSubmission";
import api from "../../configuration/api";
import Editor from "@monaco-editor/react";

// =========================================================
// MONACO LANGUAGE MAP
// =========================================================

const MONACO_LANGUAGE_MAP = {
  python: "python",
  java: "java",
  cpp: "cpp",
  javascript: "javascript",
};

// =========================================================
// LANGUAGE OPTIONS
// =========================================================

const LANGUAGE_OPTIONS = [
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "javascript", label: "JavaScript" },
];

// =========================================================
// DEFAULT CODE
// =========================================================

const DEFAULT_CODE = {
  python:
    "# Write your Python code here\n\ndef solve():\n    # Your code here\n    pass\n",
  java: "public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}",
  cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}",
  javascript:
    "// Write your JavaScript code here\n\nfunction solve() {\n    // Your code here\n}\n",
};

// =========================================================
// CODING TEST COMPONENT
// =========================================================

export const CodingTest = () => {
  const navigate = useNavigate();
  const { roundId } = useParams();
  const location = useLocation();

  // =======================================================
  // STATES
  // =======================================================

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("python");
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [submittedQuestions, setSubmittedQuestions] = useState(new Set());
  const [savedSubmissions, setSavedSubmissions] = useState({});

  // =======================================================
  // REFS
  // =======================================================

  const timerRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  // =======================================================
  // LOAD CODING TEST
  // =======================================================

  useEffect(() => {
    if (location.state?.attemptData) {
      const data = location.state.attemptData;

      setQuestions(data.questions || []);
      setAttemptId(data.attempt_id);

      const testDuration =
        data.test_duration_minutes || data.duration_minutes || 0;
      setTimeLeft(data.remaining_seconds || testDuration * 60);

      loadSavedSubmissions(data.attempt_id);

      if (data.questions?.length) {
        setCode(DEFAULT_CODE[language] || "");
      }

      setLoading(false);
    } else {
      navigate(`/candidate/coding/${roundId}/instructions`);
    }

    return () => {
      clearInterval(timerRef.current);
    };
  }, []);

  // =======================================================
  // MAIN TIMER
  // =======================================================

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

    return () => {
      clearInterval(timerRef.current);
    };
  }, [timeLeft, loading, questions]);

  // =======================================================
  // AUTO SAVE CODE
  // =======================================================

  useEffect(() => {
    if (code && !submitting && attemptId && questions[currentIndex]) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(handleSaveCode, 3000);
    }

    return () => {
      clearTimeout(saveTimeoutRef.current);
    };
  }, [code, currentIndex]);

  // =======================================================
  // LOAD SAVED SUBMISSIONS
  // =======================================================

  const loadSavedSubmissions = async (attemptId) => {
    try {
      const token = localStorage.getItem("token");

      const res = await api.get(
        `/candidate/get-saved-submissions/${attemptId}/`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        const submissions = res.data.data.submissions || [];
        const submitted = new Set();
        const saved = {};

        submissions.forEach((sub) => {
          if (sub.status === "submitted") submitted.add(sub.question_id);
          saved[sub.question_id] = sub;
        });

        setSubmittedQuestions(submitted);
        setSavedSubmissions(saved);

        const currentQuestion = questions[currentIndex];
        if (currentQuestion && saved[currentQuestion.id]) {
          const savedSub = saved[currentQuestion.id];
          setCode(savedSub.code || DEFAULT_CODE[language] || "");
          setLanguage(savedSub.language || "python");
        }
      }
    } catch (error) {
      console.error("Error loading submissions:", error);
    }
  };

  // =======================================================
  // SAVE CODE
  // =======================================================

  const handleSaveCode = async () => {
    if (
      !attemptId ||
      !questions[currentIndex] ||
      submittedQuestions.has(questions[currentIndex].id)
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");

      await api.post(
        "/candidate/save-coding-code/",
        {
          attempt: attemptId,
          question: questions[currentIndex].id,
          language,
          code,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (error) {
      console.error("Error saving code:", error);
    }
  };

  // =======================================================
  // RUN CODE
  // =======================================================

  const handleRunCode = async () => {
    if (!attemptId || !questions[currentIndex]) return;

    const questionId = questions[currentIndex].id;

    if (submittedQuestions.has(questionId)) {
      toast.error("This question is already submitted");
      return;
    }

    setRunning(true);
    setRunResults(null);

    try {
      const token = localStorage.getItem("token");

      const res = await api.post(
        "/candidate/run-coding-code/",
        { attempt: attemptId, question: questionId, language, code },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        setRunResults(res.data.data.results || []);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to run code");
    } finally {
      setRunning(false);
    }
  };

  // =======================================================
  // TEST CASE HELPERS
  // =======================================================

  const isTestCasePassed = (result) => {
    if (!result) return false;
    if (typeof result.passed === "boolean") return result.passed;
    if (typeof result.status === "string")
      return result.status.toLowerCase() === "passed";
    if (typeof result.result === "string")
      return result.result.toLowerCase() === "passed";
    return false;
  };

  const getPassedCount = () =>
    Array.isArray(runResults)
      ? runResults.filter((r) => isTestCasePassed(r)).length
      : 0;

  const getFailedCount = () =>
    Array.isArray(runResults) ? runResults.length - getPassedCount() : 0;

  // =======================================================
  // SUBMIT CURRENT QUESTION
  // =======================================================

  const handleSubmitQuestion = async () => {
    if (!attemptId || !questions[currentIndex]) return;

    const questionId = questions[currentIndex].id;

    if (submittedQuestions.has(questionId)) {
      toast.info("Already submitted");
      setShowSubmitModal(false);
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const res = await api.post(
        "/candidate/submit-coding-question/",
        { attempt: attemptId, question: questionId, language, code },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (res.data.success) {
        setSubmittedQuestions((prev) => new Set([...prev, questionId]));
        toast.success("Question submitted");
        setShowSubmitModal(false);
        await loadSavedSubmissions(attemptId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit question");
    } finally {
      setSubmitting(false);
    }
  };

  // =======================================================
  // AUTO SUBMIT
  // =======================================================

  const handleAutoSubmit = async () => {
    if (submitting) return;
    await handleSubmitRound(true);
  };

  // =======================================================
  // SUBMIT COMPLETE ROUND
  // =======================================================

  const handleSubmitRound = async (isAuto = false) => {
    if (!attemptId) return;

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      const res = await api.post(
        "/candidate/submit-coding-round/",
        { attempt: attemptId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      clearInterval(timerRef.current);

      if (res.data.success) {
        setShowThankYou(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit round");
    } finally {
      setSubmitting(false);
    }
  };

  // =======================================================
  // RETURN TO DRIVE
  // =======================================================

  const handleRedirect = () => {
    navigate(`/candidate/drive/${roundId}`);
  };

  // =======================================================
  // CHANGE QUESTION
  // =======================================================

  const handleQuestionChange = (index) => {
    if (code && !submittedQuestions.has(questions[currentIndex]?.id)) {
      handleSaveCode();
    }

    setRunResults(null);
    setCurrentIndex(index);

    const question = questions[index];

    if (question && savedSubmissions[question.id]) {
      const saved = savedSubmissions[question.id];
      setCode(saved.code || DEFAULT_CODE[language] || "");
      setLanguage(saved.language || "python");
    } else {
      setCode(DEFAULT_CODE[language] || "");
    }
  };

  // =======================================================
  // CHANGE LANGUAGE
  // =======================================================

  const handleLanguageChange = (newLanguage) => {
    setRunResults(null);
    setLanguage(newLanguage);

    const currentId = questions[currentIndex]?.id;
    if (!submittedQuestions.has(currentId)) {
      setCode(DEFAULT_CODE[newLanguage] || "");
    }
  };

  // =======================================================
  // TIMER COMPONENT
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

  // =======================================================
  // LOADING
  // =======================================================

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
            Your coding test has been submitted successfully. Your responses
            have been recorded.
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

  // =======================================================
  // CURRENT QUESTION
  // =======================================================

  const current = questions[currentIndex];
  const total = questions.length;
  const isSubmitted = submittedQuestions.has(current?.id);

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
          <h1 className="text-sm font-medium text-gray-900">Coding Test</h1>

          <span className="text-xs text-gray-500 tabular-nums">
            Q{currentIndex + 1} / {total}
          </span>

          <span className="text-xs text-emerald-600 font-medium tabular-nums">
            {submittedQuestions.size} / {total} submitted
          </span>
        </div>

        <Timer initialTime={timeLeft} onExpire={handleAutoSubmit} />
      </header>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <div className="flex-1 flex overflow-hidden">
        {/* =================================================
            LEFT PANEL — QUESTION
        ================================================= */}

        <div className="w-1/2 overflow-y-auto bg-white p-6 border-r border-gray-100">
          {current && (
            <>
              <div className="flex items-start justify-between mb-5">
                <h2 className="text-base font-medium text-gray-900">
                  {current.problem_statement}
                </h2>

                {isSubmitted && (
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-xs font-medium whitespace-nowrap ml-3">
                    Submitted
                  </span>
                )}
              </div>

              <div className="space-y-5 text-sm">
                {/* Description */}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                    Description
                  </h4>
                  <p className="text-gray-700 leading-relaxed">
                    {current.description}
                  </p>
                </div>

                {/* Difficulty + Marks */}
                <div className="flex gap-6">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Difficulty
                    </h4>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
                        current.difficulty === "easy"
                          ? "bg-emerald-50 text-emerald-700"
                          : current.difficulty === "medium"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {current.difficulty}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                      Marks
                    </h4>
                    <span className="text-sm font-medium text-gray-900">
                      {current.marks}
                    </span>
                  </div>
                </div>

                {/* Sample Test Cases */}
                {current.sample_test_cases?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      Sample Test Cases
                    </h4>

                    <div className="space-y-2">
                      {current.sample_test_cases.map((tc, i) => (
                        <div
                          key={i}
                          className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                        >
                          <p className="text-xs font-medium text-gray-500 mb-2">
                            Test Case {i + 1}
                          </p>

                          <div className="space-y-2">
                            <div>
                              <span className="text-xs text-gray-400">
                                Input
                              </span>
                              <pre className="bg-white p-2 rounded-md mt-1 text-xs border border-gray-100 overflow-x-auto whitespace-pre-wrap break-all text-gray-700 font-mono">
                                {tc.input_data}
                              </pre>
                            </div>
                            <div>
                              <span className="text-xs text-gray-400">
                                Output
                              </span>
                              <pre className="bg-white p-2 rounded-md mt-1 text-xs border border-gray-100 overflow-x-auto whitespace-pre-wrap break-all text-gray-700 font-mono">
                                {tc.expected_output}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* =================================================
            RIGHT PANEL — EDITOR
        ================================================= */}

        <div className="w-1/2 flex flex-col bg-gray-900">
          {/* Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center gap-2 flex-shrink-0">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={isSubmitted}
              className="px-2.5 py-1 bg-gray-700 text-white text-xs border border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>

            <div className="flex-1" />

            {!isSubmitted && (
              <button
                onClick={handleRunCode}
                disabled={running}
                className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {running ? "Running..." : "Run"}
              </button>
            )}
          </div>

          {/* Editor + Run Results */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div
              className={`overflow-hidden relative ${
                runResults ? "flex-[3]" : "flex-1"
              }`}
            >
              <Editor
                key={`${current?.id}-${language}`}
                height="100%"
                width="100%"
                language={MONACO_LANGUAGE_MAP[language] || "python"}
                theme="vs-dark"
                value={code}
                onChange={(value) => {
                  if (!isSubmitted) setCode(value || "");
                }}
                options={{
                  readOnly: isSubmitted,
                  automaticLayout: true,
                  fontSize: 13,
                  lineHeight: 20,
                  fontFamily: 'Consolas, "Courier New", monospace',
                  minimap: { enabled: false },
                  wordWrap: "on",
                  tabSize: 4,
                  insertSpaces: true,
                  autoClosingBrackets: "always",
                  autoClosingQuotes: "always",
                  bracketPairColorization: { enabled: true },
                  guides: { indentation: true, bracketPairs: true },
                  cursorBlinking: "smooth",
                  cursorSmoothCaretAnimation: "on",
                  smoothScrolling: true,
                  suggestOnTriggerCharacters: true,
                  quickSuggestions: true,
                  selectionHighlight: true,
                  occurrencesHighlight: "singleFile",
                  folding: true,
                  lineNumbers: "on",
                  padding: { top: 12, bottom: 12 },
                  contextmenu: true,
                  scrollBeyondLastLine: false,
                }}
              />

              {/* Submitted Overlay */}
              {isSubmitted && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-sm font-medium text-white bg-emerald-600/90 px-4 py-2 rounded-md">
                    Submitted
                  </span>
                </div>
              )}
            </div>

            {/* Run Results Panel */}
            {runResults && (
              <div className="flex-[2] min-h-[180px] max-h-[260px] bg-gray-950 border-t border-gray-700 flex flex-col">
                <div className="px-3 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between flex-shrink-0">
                  <span className="text-xs font-medium text-gray-300">
                    Run Result
                  </span>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-emerald-400">
                      {getPassedCount()} passed
                    </span>
                    <span className="text-red-400">
                      {getFailedCount()} failed
                    </span>
                    <span className="text-gray-500">
                      {runResults.length} total
                    </span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                  {runResults.length > 0 ? (
                    <div className="space-y-1.5">
                      {runResults.map((result, index) => {
                        const passed = isTestCasePassed(result);

                        return (
                          <div
                            key={index}
                            className={`flex items-center justify-between px-3 py-1.5 rounded-md border ${
                              passed
                                ? "bg-emerald-900/10 border-emerald-900/50"
                                : "bg-red-900/10 border-red-900/50"
                            }`}
                          >
                            <span className="text-xs text-gray-300">
                              Test Case {index + 1}
                            </span>

                            <span
                              className={`text-xs font-medium ${
                                passed ? "text-emerald-400" : "text-red-400"
                              }`}
                            >
                              {passed ? "Passed" : "Failed"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-xs text-gray-500">
                        No test cases were executed
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-800 border-t border-gray-700 px-3 py-2 flex items-center justify-between gap-3 flex-shrink-0">
            <CodingQuestionNavigator
              questions={questions}
              current={currentIndex}
              submittedQuestions={submittedQuestions}
              onChange={handleQuestionChange}
            />

            <div className="flex gap-2">
              {!isSubmitted ? (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-medium bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              ) : (
                <span className="px-4 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-950/50 rounded-md border border-emerald-900">
                  Submitted
                </span>
              )}

              {total > 0 && (
                <button
                  onClick={() => setShowFinalSubmitModal(true)}
                  disabled={submitting || submittedQuestions.size === 0}
                  className={`px-4 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    submittedQuestions.size > 0
                      ? "bg-gray-100 text-gray-900 hover:bg-white"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {submitting
                    ? "Submitting..."
                    : `Submit Round (${submittedQuestions.size}/${total})`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          MODALS
      ================================================= */}

      <SubmitConfirmationModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmitQuestion}
        loading={submitting}
        questionTitle={current?.problem_statement || "Question"}
        isAlreadySubmitted={isSubmitted}
      />

      <FinalSubmissionModal
        isOpen={showFinalSubmitModal}
        onClose={() => setShowFinalSubmitModal(false)}
        onConfirm={() => handleSubmitRound(false)}
        loading={submitting}
        totalQuestions={total}
        submittedQuestions={submittedQuestions.size}
      />
    </div>
  );
};

export default CodingTest;
