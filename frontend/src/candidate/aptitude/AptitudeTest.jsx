// pages/aptitude/AptitudeTest.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import api from '../../configuration/api';

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
  const [resultData, setResultData] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (location.state?.attemptData) {
      const data = location.state.attemptData;
      setQuestions(data.questions || []);
      setAttemptId(data.attempt_id);
      // Use test_duration_minutes for timer
      const testDuration = data.test_duration_minutes || data.duration_minutes || 0;
      setTimeLeft(data.remaining_seconds || testDuration * 60);
      // Load existing answers if any
      if (data.answers) {
        setAnswers(data.answers);
      }
      setLoading(false);
    } else {
      fetchTest();
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

  const fetchTest = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/candidate/start-aptitude-test/${roundId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setQuestions(res.data.data.questions || []);
        setAttemptId(res.data.data.attempt_id);
        const testDuration = res.data.data.test_duration_minutes || res.data.data.duration_minutes || 0;
        setTimeLeft(res.data.data.remaining_seconds || testDuration * 60);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load test');
      navigate(`/candidate/drive/${roundId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (questionId, option) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleAutoSubmit = () => {
    if (!submitting) submitTest(true);
  };

  const handleSubmit = () => {
    const unansweredList = questions.filter(q => !answers[q.id]);
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
      const token = localStorage.getItem('token');
      const answerList = Object.entries(answers).map(([qId, opt]) => ({
        question_id: parseInt(qId),
        selected_option: opt
      }));

      const response = await api.post(`/candidate/submit-aptitude-test/${attemptId}/`, 
        { answers: answerList },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      clearInterval(timerRef.current);
      
      if (response.data.success) {
        setResultData(response.data.data);
        setShowThankYou(true);
      } else {
        toast.error(response.data.message || 'Failed to submit test');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit test');
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
          <p className="text-gray-600 mb-6">Your test has been submitted successfully.</p>
          
          {/* Result Summary */}
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
  const answered = Object.keys(answers).length;

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex items-center justify-between flex-shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold text-gray-900 text-sm">Aptitude Test</h2>
          <span className="text-sm text-gray-500">Q{currentIndex + 1} of {total}</span>
          <span className="text-sm text-green-600 font-medium">✓ {answered}/{total} answered</span>
        </div>
        <Timer initialTime={timeLeft} onExpire={handleAutoSubmit} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Question Area */}
        <div className="flex-1 flex flex-col overflow-hidden p-6 bg-white">
          {current && (
            <>
              <div className="flex-shrink-0 mb-4">
                <p className="text-xl font-semibold text-gray-900">{current.question}</p>
              </div>
              
              <div className="flex-shrink-0 space-y-2.5">
                {[0, 1, 2, 3].map(idx => {
                  const key = `option_${idx + 1}`;
                  const selected = answers[current.id] === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleSelect(current.id, key)}
                      className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                        selected ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${
                          selected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className={selected ? 'font-medium text-gray-900 text-base' : 'text-gray-700 text-base'}>
                          {current[key]}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex-shrink-0 mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                <div className="flex gap-3">
                  <button
                    onClick={() => setCurrentIndex(prev => prev - 1)}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  {currentIndex < total - 1 && (
                    <button
                      onClick={() => setCurrentIndex(prev => prev + 1)}
                      className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      Next
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-6 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Test'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Question Palette */}
        <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto flex-shrink-0">
          <h4 className="text-base font-semibold text-gray-700 mb-4">Question Palette</h4>
          <div className="grid grid-cols-5 gap-3">
            {questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-12 h-12 rounded-xl text-sm font-semibold transition-all ${
                  idx === currentIndex ? 'border-2 border-blue-600 bg-blue-100 text-blue-700' :
                  answers[q.id] ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600 space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded bg-green-500" /> 
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded bg-gray-200" /> 
                <span>Unanswered</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded bg-blue-100 border-2 border-blue-600" /> 
                <span>Current</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="text-base font-semibold text-gray-700">
              {answered}/{total} answered
            </span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unanswered Questions</h3>
            <p className="text-sm text-gray-600 mb-4">
              You have {unanswered.length} unanswered question(s):
            </p>
            <div className="max-h-40 overflow-y-auto mb-4 space-y-1">
              {unanswered.map(q => (
                <div key={q.id} className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                  Q{questions.indexOf(q) + 1}: {q.question.substring(0, 60)}...
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AptitudeTest;