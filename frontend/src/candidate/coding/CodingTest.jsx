// pages/coding/CodingTest.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Modal } from '../components/Modal';
import Loader from '../components/Loader';
import { CodingQuestionNavigator } from './CodingQuestionNavigator';
import { RunResult } from './RunResult';
import SubmitConfirmationModal from '../drive/SubmitConfirmation';
import FinalSubmissionModal from '../drive/FinalSubmission';
import api from '../../configuration/api';

const LANGUAGE_OPTIONS = [
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'javascript', label: 'JavaScript' }
];

const DEFAULT_CODE = {
  python: '# Write your Python code here\n\ndef solve():\n    # Your code here\n    pass\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}',
  cpp: '#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}',
  javascript: '// Write your JavaScript code here\n\nfunction solve() {\n    // Your code here\n}\n'
};

export const CodingTest = () => {
  const navigate = useNavigate();
  const { roundId } = useParams();
  const location = useLocation();

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showFinalSubmitModal, setShowFinalSubmitModal] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [submittedQuestions, setSubmittedQuestions] = useState(new Set());
  const [savedSubmissions, setSavedSubmissions] = useState({});
  const [resultData, setResultData] = useState(null);
  const timerRef = useRef(null);
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    if (location.state?.attemptData) {
      const data = location.state.attemptData;
      setQuestions(data.questions || []);
      setAttemptId(data.attempt_id);
      // Use test_duration_minutes for timer
      const testDuration = data.test_duration_minutes || data.duration_minutes || 0;
      setTimeLeft(data.remaining_seconds || testDuration * 60);
      loadSavedSubmissions(data.attempt_id);
      if (data.questions?.length) {
        setCode(DEFAULT_CODE[language] || '');
      }
      setLoading(false);
    } else {
      navigate(`/candidate/coding/${roundId}/instructions`);
    }
    return () => clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && !loading && questions.length) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
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

  useEffect(() => {
    if (code && !submitting && attemptId && questions[currentIndex]) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(handleSaveCode, 3000);
    }
    return () => clearTimeout(saveTimeoutRef.current);
  }, [code, currentIndex]);

  const loadSavedSubmissions = async (attemptId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get(`/candidate/get-saved-submissions/${attemptId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const submissions = res.data.data.submissions || [];
        const submitted = new Set();
        const saved = {};
        submissions.forEach(sub => {
          if (sub.status === 'submitted') submitted.add(sub.question_id);
          saved[sub.question_id] = sub;
        });
        setSubmittedQuestions(submitted);
        setSavedSubmissions(saved);
        
        const currentQuestion = questions[currentIndex];
        if (currentQuestion && saved[currentQuestion.id]) {
          const savedSub = saved[currentQuestion.id];
          setCode(savedSub.code || DEFAULT_CODE[language] || '');
          setLanguage(savedSub.language || 'python');
        }
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const handleSaveCode = async () => {
    if (!attemptId || !questions[currentIndex] || submittedQuestions.has(questions[currentIndex].id)) return;
    try {
      const token = localStorage.getItem('token');
      await api.post('/candidate/save-coding-code/', {
        attempt: attemptId,
        question: questions[currentIndex].id,
        language,
        code
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error('Error saving code:', error);
    }
  };

  const handleRunCode = async () => {
    if (!attemptId || !questions[currentIndex]) return;
    if (submittedQuestions.has(questions[currentIndex].id)) {
      toast.error('This question is already submitted');
      return;
    }

    setRunning(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/candidate/run-coding-code/', {
        attempt: attemptId,
        question: questions[currentIndex].id,
        language,
        code
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        setRunResults(res.data.data.results);
        setShowRunModal(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to run code');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitQuestion = async () => {
    if (!attemptId || !questions[currentIndex]) return;
    const questionId = questions[currentIndex].id;
    if (submittedQuestions.has(questionId)) {
      toast.info('Already submitted');
      setShowSubmitModal(false);
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/candidate/submit-coding-question/', {
        attempt: attemptId,
        question: questionId,
        language,
        code
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (res.data.success) {
        setSubmittedQuestions(prev => new Set([...prev, questionId]));
        toast.success('Question submitted successfully');
        setShowSubmitModal(false);
        await loadSavedSubmissions(attemptId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit question');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    if (submitting) return;
    await handleSubmitRound(true);
  };

  const handleSubmitRound = async (isAuto = false) => {
    if (!attemptId) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post('/candidate/submit-coding-round/', {
        attempt: attemptId
      }, { headers: { Authorization: `Bearer ${token}` } });

      clearInterval(timerRef.current);
      
      if (res.data.success) {
        setResultData(res.data.data);
        setShowThankYou(true);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit round');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRedirect = () => {
    navigate(`/candidate/drive/${roundId}`);
  };

  const handleQuestionChange = (index) => {
    if (code && !submittedQuestions.has(questions[currentIndex]?.id)) {
      handleSaveCode();
    }
    setCurrentIndex(index);
    const question = questions[index];
    if (question && savedSubmissions[question.id]) {
      const saved = savedSubmissions[question.id];
      setCode(saved.code || DEFAULT_CODE[language] || '');
      setLanguage(saved.language || 'python');
    } else {
      setCode(DEFAULT_CODE[language] || '');
    }
  };

  const Timer = ({ initialTime, onExpire }) => {
    const [time, setTime] = useState(initialTime || 0);

    useEffect(() => {
      if (time <= 0) {
        onExpire?.();
        return;
      }
      const interval = setInterval(() => setTime(prev => prev - 1), 1000);
      return () => clearInterval(interval);
    }, [time, onExpire]);

    const formatTime = (seconds) => {
      const hrs = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      if (hrs > 0) return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const isWarning = time < 300;

    return (
      <div className={`font-mono font-bold text-lg ${isWarning ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
        {formatTime(time)}
      </div>
    );
  };

  if (loading) return <Loader />;

  if (showThankYou && resultData) {
    const isPassed = (resultData.percentage || 0) >= 40;
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
          <div className="text-4xl mb-4">{isPassed ? 'Passed' : 'Submitted'}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isPassed ? 'Congratulations' : 'Test Submitted'}
          </h2>
          <p className="text-gray-600 mb-6">Your coding test has been submitted successfully.</p>
          
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="text-sm text-gray-500">Score</span>
              <span className="text-sm font-medium text-gray-900">
                {resultData.score || 0} / {resultData.total_marks || 0}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="text-sm text-gray-500">Percentage</span>
              <span className={`text-sm font-medium ${isPassed ? 'text-green-600' : 'text-yellow-600'}`}>
                {resultData.percentage || 0}%
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-200">
              <span className="text-sm text-gray-500">Attempted</span>
              <span className="text-sm font-medium text-gray-900">
                {resultData.attempted_questions || 0}/{resultData.total_questions || 0}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-sm text-gray-500">Status</span>
              <span className={`text-sm font-medium ${isPassed ? 'text-green-600' : 'text-yellow-600'}`}>
                {isPassed ? 'Passed' : 'Awaiting Review'}
              </span>
            </div>
          </div>

          <button
            onClick={handleRedirect}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Return to Drive
          </button>
        </div>
      </div>
    );
  }

  const current = questions[currentIndex];
  const total = questions.length;
  const isSubmitted = submittedQuestions.has(current?.id);
  const allSubmitted = submittedQuestions.size === total;

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="font-semibold text-gray-900">Coding Test</h1>
          <span className="text-sm text-gray-500">Q{currentIndex + 1}/{total}</span>
          <span className="text-sm text-green-600 font-medium">✓ {submittedQuestions.size}/{total} Submitted</span>
        </div>
        <Timer initialTime={timeLeft} onExpire={handleAutoSubmit} />
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Question Description */}
        <div className="w-1/2 overflow-y-auto bg-white p-6 border-r border-gray-200">
          {current && (
            <>
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">{current.problem_statement}</h2>
                {isSubmitted && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    Submitted
                  </span>
                )}
              </div>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
                  <p className="text-gray-600">{current.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Difficulty</h4>
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    current.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                    current.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>{current.difficulty}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-1">Marks</h4>
                  <span className="text-gray-900 font-medium">{current.marks}</span>
                </div>
                {current.sample_test_cases?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Sample Test Cases</h4>
                    {current.sample_test_cases.map((tc, i) => (
                      <div key={i} className="bg-gray-50 p-3 rounded-lg mt-2 border border-gray-200">
                        <p className="font-medium text-xs text-gray-600">Test Case {i + 1}</p>
                        <div className="mt-1 space-y-2">
                          <div>
                            <span className="text-gray-500 text-xs">Input:</span>
                            <pre className="bg-white p-2 rounded mt-1 text-xs border border-gray-200 overflow-x-auto whitespace-pre-wrap break-all">
                              {tc.input_data}
                            </pre>
                          </div>
                          <div>
                            <span className="text-gray-500 text-xs">Output:</span>
                            <pre className="bg-white p-2 rounded mt-1 text-xs border border-gray-200 overflow-x-auto whitespace-pre-wrap break-all">
                              {tc.expected_output}
                            </pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right Panel - Code Editor */}
        <div className="w-1/2 flex flex-col bg-gray-900">
          {/* Toolbar */}
          <div className="bg-gray-800 border-b border-gray-700 p-3 flex items-center gap-3 flex-shrink-0">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isSubmitted}
              className="px-3 py-1.5 bg-gray-700 text-white border border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {LANGUAGE_OPTIONS.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
            <div className="flex-1" />
            {!isSubmitted && (
              <button
                onClick={handleRunCode}
                disabled={running}
                className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {running ? 'Running...' : 'Run'}
              </button>
            )}
          </div>

          {/* Editor */}
          <div className="flex-1 overflow-hidden relative">
            <textarea
              value={code}
              onChange={(e) => !isSubmitted && setCode(e.target.value)}
              disabled={isSubmitted}
              className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none bg-gray-900 text-gray-100"
              style={{ fontFamily: 'ui-monospace, monospace', lineHeight: '1.6' }}
              spellCheck={false}
              placeholder="Write your code here..."
            />
            {isSubmitted && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <span className="text-white text-lg font-semibold bg-green-600 px-6 py-3 rounded-lg">Submitted</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-800 border-t border-gray-700 p-3 flex items-center justify-between flex-shrink-0">
            <CodingQuestionNavigator
              total={total}
              current={currentIndex}
              submittedQuestions={submittedQuestions}
              onChange={handleQuestionChange}
            />
            <div className="flex gap-3">
              {!isSubmitted ? (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              ) : (
                <span className="px-6 py-2 bg-green-900/30 text-green-400 rounded-lg font-medium border border-green-800">
                  Submitted
                </span>
              )}
              {total > 0 && (
                <button
                  onClick={() => setShowFinalSubmitModal(true)}
                  disabled={submitting || submittedQuestions.size === 0}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    submittedQuestions.size > 0
                      ? 'bg-purple-600 text-white hover:bg-purple-700'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Submitting...' : `Submit Round (${submittedQuestions.size}/${total})`}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RunResult isOpen={showRunModal} onClose={() => setShowRunModal(false)} results={runResults} />

      <SubmitConfirmationModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={handleSubmitQuestion}
        loading={submitting}
        questionTitle={current?.problem_statement || 'Question'}
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