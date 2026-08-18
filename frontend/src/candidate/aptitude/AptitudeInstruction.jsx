// pages/aptitude/AptitudeInstructions.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import Loader from '../components/Loader';
import api from '../../configuration/api';

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
      const token = localStorage.getItem('token');
      
      // Get round details
      const roundRes = await api.get(`/candidate/get-round-details/${roundId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (roundRes.data.success) {
        setRoundInfo(roundRes.data.data.round);
        setDriveId(roundRes.data.data.drive?.id);
      }

      // Check attempt status
      const attemptRes = await api.get(`/candidate/get-attempt-status/${roundId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (attemptRes.data.success) {
        setAttemptStatus(attemptRes.data.data);
        if (attemptRes.data.data.status === 'in_progress') {
          navigate(`/candidate/aptitude/${roundId}/test`);
        }
        if (attemptRes.data.data.status === 'completed' || 
            attemptRes.data.data.status === 'passed' || 
            attemptRes.data.data.status === 'failed') {
          // Show completed state
        }
      }
    } catch (error) {
      toast.error('Failed to load test information');
      navigate('/candidate/drive');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await api.post(`/candidate/start-aptitude-test/${roundId}/`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        navigate(`/candidate/aptitude/${roundId}/test`, {
          state: { attemptData: res.data.data }
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start test');
    } finally {
      setStarting(false);
    }
  };

  if (loading) return <Loader />;

  const status = roundInfo?.display_status || roundInfo?.status;
  const isCompleted = attemptStatus?.status === 'completed' || 
                      attemptStatus?.status === 'passed' || 
                      attemptStatus?.status === 'failed';

  // Show result if completed
  if (isCompleted && attemptStatus) {
    const isPassed = attemptStatus.status === 'passed' || 
                     (attemptStatus.status === 'completed' && (attemptStatus.percentage || 0) >= 40);
    
    return (
      <div className="min-h-screen bg-gray-50 py-8 w-full">
        <div className="w-full px-6 lg:px-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-2xl mx-auto">
            <div className={`px-8 py-6 ${isPassed ? 'bg-green-600' : 'bg-yellow-600'} text-white`}>
              <h1 className="text-2xl font-bold text-center">
                {isPassed ? 'Test Completed - Passed' : 'Test Completed'}
              </h1>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <span className="text-xs text-gray-500">Score</span>
                  <p className="text-2xl font-bold text-blue-600">{attemptStatus.score || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <span className="text-xs text-gray-500">Percentage</span>
                  <p className={`text-2xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {attemptStatus.percentage || 0}%
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <span className="text-xs text-gray-500">Status</span>
                <p className={`text-lg font-semibold ${isPassed ? 'text-green-600' : 'text-yellow-600'}`}>
                  {isPassed ? 'Passed' : 'Awaiting Review'}
                </p>
              </div>
              <button
                onClick={() => navigate(`/candidate/drive/${driveId}`)}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Return to Drive
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get duration values
  const roundDuration = roundInfo?.round_duration_minutes || roundInfo?.duration_minutes || 0;
  const testDuration = roundInfo?.test_duration_minutes || roundInfo?.duration_minutes || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 w-full">
      <div className="w-full px-6 lg:px-12">
        <button 
          onClick={() => navigate(`/candidate/drive/${driveId}`)}
          className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center gap-1"
        >
          <span className="text-blue-600">←</span> Back to Drive
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full max-w-2xl mx-auto">
          <div className="bg-blue-600 px-8 py-6 text-white">
            <h1 className="text-2xl font-bold">Aptitude Test Instructions</h1>
            <p className="text-blue-100 text-sm mt-1">{roundInfo?.round_type_display || 'Aptitude'}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <span className="text-xs text-gray-500">Round Duration</span>
                <p className="font-semibold">{roundDuration} minutes</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <span className="text-xs text-gray-500">Test Duration</span>
                <p className="font-semibold">{testDuration} minutes</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-center col-span-2">
                <span className="text-xs text-gray-500">Questions</span>
                <p className="font-semibold">{roundInfo?.total_questions || 0}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Important Instructions</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>Read each question carefully before answering</span>
                </li>
                <li className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>You can navigate between questions freely</span>
                </li>
                <li className="flex items-start gap-2 p-2 bg-gray-50 rounded">
                  <span className="text-blue-600 font-bold">•</span>
                  <span>You can change answers before final submission</span>
                </li>
                <li className="flex items-start gap-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                  <span className="text-yellow-600 font-bold">!</span>
                  <span>Test will auto-submit when time runs out</span>
                </li>
                <li className="flex items-start gap-2 p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="text-blue-600 font-bold">i</span>
                  <span>You have <strong>{testDuration} minutes</strong> to complete the test</span>
                </li>
              </ul>
            </div>

            {status === 'active' && !isCompleted && (
              <button
                onClick={handleStart}
                disabled={starting}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {starting ? 'Starting...' : 'Start Test'}
              </button>
            )}

            {status !== 'active' && !isCompleted && (
              <div className="text-center py-3 bg-gray-50 text-gray-500 rounded-lg font-medium">
                {status === 'pending' ? 'Test not started yet' : 'Test not available'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AptitudeInstructions;