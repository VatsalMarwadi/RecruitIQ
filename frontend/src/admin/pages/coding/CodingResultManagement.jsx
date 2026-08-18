// admin/pages/coding/CodingResultManagement.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../../configuration/api';
import { 
  FaArrowLeft, 
  FaEye, 
  FaSpinner, 
  FaUserCircle,
  FaEdit,
  FaSave,
  FaUndo,
  FaChartBar,
  FaCode
} from 'react-icons/fa';

export default function CodingResultManagement() {
  const navigate = useNavigate();
  const { roundId } = useParams();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [roundData, setRoundData] = useState(null);
  const [passingPercentage, setPassingPercentage] = useState(40);
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [results, setResults] = useState([]);
  const [modifiedResults, setModifiedResults] = useState({});
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    fetchRoundDetails();
  }, [roundId]);

  const fetchRoundDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const roundResponse = await api.get(`/canadmin/get-round-details/${roundId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (roundResponse.data.success) {
        setRoundData(roundResponse.data.data);
      }
      
      const resultResponse = await api.get(`/canadmin/list-coding-results/${roundId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (resultResponse.data.success) {
        setResults(resultResponse.data.data.results || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (passingPercentage < 0 || passingPercentage > 100) {
      toast.error('Passing percentage must be between 0 and 100');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `/canadmin/preview-round-results/${roundId}/`,
        { passing_percentage: passingPercentage },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setPreviewData(response.data.data);
        setIsPreviewMode(true);
        setShowPreview(true);
        
        const initialModifications = {};
        response.data.data.results.forEach(result => {
          if (result.suggested_result !== 'pending') {
            const id = result.submission_id || result.attempt_id;
            initialModifications[id] = result.suggested_result;
          }
        });
        setModifiedResults(initialModifications);
        toast.success('Preview generated successfully');
      } else {
        toast.error(response.data.message || 'Failed to preview results');
      }
    } catch (error) {
      console.error('Error previewing results:', error);
      toast.error(error.response?.data?.message || 'Failed to preview results');
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) {
      toast.error('Please preview results first');
      return;
    }

    const payload = previewData.results
      .map(result => {
        const submissionId = result.submission_id;
        const finalResult = modifiedResults[submissionId] || result.suggested_result;
        
        if (finalResult && finalResult !== 'pending' && submissionId) {
          return {
            submission_id: submissionId,
            result: finalResult
          };
        }
        return null;
      })
      .filter(item => item !== null);

    if (payload.length === 0) {
      toast.error('No candidates to mark. Please check the results.');
      return;
    }

    setConfirming(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `/canadmin/confirm-round-results/${roundId}/`,
        { results: payload },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(`Successfully marked ${response.data.data.updated_count} candidates`);
        await fetchRoundDetails();
        setShowPreview(false);
        setIsPreviewMode(false);
        setPreviewData(null);
        setModifiedResults({});
      } else {
        toast.error(response.data.message || 'Failed to confirm results');
      }
    } catch (error) {
      console.error('Error confirming results:', error);
      const errorMessage = error.response?.data?.message || 'Failed to confirm results';
      toast.error(errorMessage);
    } finally {
      setConfirming(false);
    }
  };

  const handleResultToggle = (candidateId, currentResult) => {
    const newResult = currentResult === 'passed' ? 'failed' : 'passed';
    setModifiedResults(prev => ({
      ...prev,
      [candidateId]: newResult
    }));
  };

  const getCurrentStatus = (candidateId) => {
    if (modifiedResults[candidateId]) {
      return modifiedResults[candidateId];
    }
    const existingResult = results.find(
      r => (r.submission_id || r.attempt_id) === candidateId
    );
    if (existingResult && existingResult.status) {
      return existingResult.status;
    }
    return 'pending';
  };

  const resetAllModifications = () => {
    const initialModifications = {};
    if (previewData) {
      previewData.results.forEach(result => {
        if (result.suggested_result !== 'pending') {
          const id = result.submission_id || result.attempt_id;
          initialModifications[id] = result.suggested_result;
        }
      });
    }
    setModifiedResults(initialModifications);
    toast.success('All modifications reset');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/admin/coding-round/${roundId}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaArrowLeft className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Coding Results</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {roundData?.round_type_display || 'Coding Round'} • {results.length} candidates
          </p>
        </div>
        {isPreviewMode && (
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={resetAllModifications}
              className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <FaUndo size={12} /> Reset
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {confirming ? (
                <>
                  <FaSpinner className="animate-spin" /> Confirming...
                </>
              ) : (
                <>
                  <FaSave size={14} /> Confirm Results
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Configuration */}
      {!showPreview ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 max-w-2xl">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Set Passing Criteria</h2>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passing Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handlePreview}
              disabled={processing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {processing ? (
                <>
                  <FaSpinner className="animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <FaEye /> Preview
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <span className="font-medium">Note:</span> Preview will show suggested pass or fail based on the percentage. 
            You can manually override individual results before confirming.
          </p>
        </div>
      ) : (
        // Preview Results
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                <FaChartBar className="text-blue-600" /> Preview Results
                <span className="text-xs text-gray-500 font-normal ml-2">
                  ({passingPercentage}% passing)
                </span>
              </h2>
              <div className="flex items-center gap-4 text-xs mt-1">
                <span className="flex items-center gap-1 text-green-600">
                  <span className="text-green-600">●</span> {previewData?.summary?.suggested_passed || 0} Passed
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <span className="text-red-600">●</span> {previewData?.summary?.suggested_failed || 0} Failed
                </span>
                <span className="flex items-center gap-1 text-yellow-600">
                  <span className="text-yellow-600">●</span> {previewData?.summary?.pending || 0} Pending
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowPreview(false);
                  setIsPreviewMode(false);
                  setPreviewData(null);
                  setModifiedResults({});
                }}
                className="px-4 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Edit Criteria
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Candidate</th>
                  <th className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Attempted</th>
                  <th className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Suggested</th>
                  <th className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Current</th>
                  <th className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewData?.results?.map((result) => {
                  const candidateId = result.submission_id || result.attempt_id;
                  const suggested = result.suggested_result;
                  const current = getCurrentStatus(candidateId);
                  const isModified = modifiedResults[candidateId] && modifiedResults[candidateId] !== suggested;
                  const isPending = suggested === 'pending';
                  
                  return (
                    <tr key={candidateId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FaUserCircle className="text-gray-400" />
                          <span className="font-medium text-gray-900">{result.candidate_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center text-blue-600 font-medium">{result.score}</td>
                      <td className="px-6 py-3 text-center text-gray-500">{result.total_marks}</td>
                      <td className="px-6 py-3 text-center">
                        <span className={`font-medium ${(result.percentage || 0) >= passingPercentage ? 'text-green-600' : 'text-red-600'}`}>
                          {result.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          <FaCode size={12} />
                          {result.attempted_questions || 0}/{result.total_questions || 0}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        {!isPending ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            suggested === 'passed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          }`}>
                            {suggested === 'passed' ? 'Passed' : 'Failed'}
                          </span>
                        ) : (
                          <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">Pending</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          current === 'passed' ? 'bg-green-50 text-green-700' :
                          current === 'failed' ? 'bg-red-50 text-red-700' :
                          'bg-gray-50 text-gray-500'
                        }`}>
                          {current === 'passed' ? 'Passed' :
                           current === 'failed' ? 'Failed' :
                           'Pending'}
                          {isModified && !isPending && (
                            <span className="text-xs text-blue-600 font-medium ml-1">(Manual)</span>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        {!isPending ? (
                          <button
                            onClick={() => handleResultToggle(candidateId, current === 'passed' ? 'passed' : 'failed')}
                            className={`px-3 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 mx-auto ${
                              current === 'passed' 
                                ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                                : 'bg-green-50 text-green-600 hover:bg-green-100'
                            }`}
                          >
                            <FaEdit size={10} />
                            {current === 'passed' ? 'Mark Failed' : 'Mark Passed'}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Cannot override</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              Showing {previewData?.results?.length || 0} candidates
            </span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1 text-green-600">
                <span className="text-green-600">●</span>
                {previewData?.results?.filter(r => {
                  const id = r.submission_id || r.attempt_id;
                  return (modifiedResults[id] || r.suggested_result) === 'passed';
                }).length || 0} Passed (Final)
              </span>
              <span className="flex items-center gap-1 text-red-600">
                <span className="text-red-600">●</span>
                {previewData?.results?.filter(r => {
                  const id = r.submission_id || r.attempt_id;
                  return (modifiedResults[id] || r.suggested_result) === 'failed';
                }).length || 0} Failed (Final)
              </span>
              <span className="flex items-center gap-1 text-yellow-600">
                <span className="text-yellow-600">●</span>
                {previewData?.results?.filter(r => {
                  const id = r.submission_id || r.attempt_id;
                  return (modifiedResults[id] || r.suggested_result) === 'pending';
                }).length || 0} Pending
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}