// components/FinalSubmissionModal.jsx
import React from 'react';
import { Modal } from '../components/Modal';

export default function FinalSubmissionModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  totalQuestions,
  submittedQuestions
}) {
  const allSubmitted = submittedQuestions === totalQuestions;
  const hasSubmissions = submittedQuestions > 0;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Coding Round" size="lg">
      <div className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-purple-800 font-medium">
            {allSubmitted 
              ? 'All questions have been submitted. Ready to finalize?'
              : hasSubmissions
              ? `You have submitted ${submittedQuestions} out of ${totalQuestions} questions.`
              : 'You have not submitted any questions yet.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-gray-700">{totalQuestions}</div>
            <div className="text-sm text-gray-500">Total Questions</div>
          </div>
          <div className={`rounded-lg p-3 text-center ${
            allSubmitted ? 'bg-green-50' : hasSubmissions ? 'bg-yellow-50' : 'bg-gray-50'
          }`}>
            <div className={`text-2xl font-bold ${
              allSubmitted ? 'text-green-600' : hasSubmissions ? 'text-yellow-600' : 'text-gray-400'
            }`}>
              {submittedQuestions}
            </div>
            <div className="text-sm text-gray-500">Submitted</div>
          </div>
        </div>

        {!allSubmitted && hasSubmissions && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-700">
              You have {totalQuestions - submittedQuestions} unsubmitted question(s).
              Unsubmitted questions will not be evaluated.
            </p>
          </div>
        )}

        {!hasSubmissions && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-700">
              You have not submitted any questions. Please submit at least one question before finalizing.
            </p>
          </div>
        )}

        {allSubmitted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-700">
              All questions have been submitted. Your final score will be calculated.
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !hasSubmissions}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              hasSubmissions && !loading
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Submitting...
              </>
            ) : (
              "Submit Round"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}