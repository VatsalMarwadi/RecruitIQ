// pages/coding/RunResult.jsx
import React from 'react';
import { Modal } from '../components/Modal';

export const RunResult = ({ isOpen, onClose, results }) => {
  if (!results) return null;

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Test Results" size="lg">
      <div className="space-y-4">
        <div className={`flex items-center justify-between p-4 rounded-lg ${
          allPassed ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <span className="font-medium text-gray-700">Test Results:</span>
          <span className={`font-bold ${allPassed ? 'text-green-600' : 'text-yellow-600'}`}>
            {passed} / {total} passed
          </span>
          {allPassed && (
            <span className="text-green-600 text-sm font-medium">All tests passed</span>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto space-y-3">
          {results.map((result, idx) => (
            <div key={idx} className={`border rounded-lg p-4 ${
              result.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Test Case {idx + 1}</span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  result.passed ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                }`}>
                  {result.passed ? 'Passed' : 'Failed'}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500 font-medium">Input:</span>
                  <pre className="bg-white p-2 rounded mt-1 text-xs border border-gray-200 overflow-x-auto">
                    {result.input || '(empty)'}
                  </pre>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Expected Output:</span>
                  <pre className="bg-white p-2 rounded mt-1 text-xs border border-gray-200 overflow-x-auto">
                    {result.expected_output || '(empty)'}
                  </pre>
                </div>
                <div>
                  <span className="text-gray-500 font-medium">Your Output:</span>
                  <pre className={`p-2 rounded mt-1 text-xs border overflow-x-auto ${
                    result.passed ? 'bg-green-100 border-green-300 text-green-800' : 'bg-red-100 border-red-300 text-red-800'
                  }`}>
                    {result.your_output || '(empty)'}
                  </pre>
                </div>
                {result.error && (
                  <div>
                    <span className="text-red-500 font-medium">Error:</span>
                    <pre className="bg-red-50 p-2 rounded mt-1 text-xs text-red-700 border border-red-200 overflow-x-auto">
                      {result.error}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};