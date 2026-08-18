// components/SubmitConfirmationModal.jsx
import React from 'react';
import { Modal } from '../components/Modal';

export default function SubmitConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading,
  questionTitle,
  isAlreadySubmitted = false
}) {
  if (isAlreadySubmitted) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Already Submitted">
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              This question has already been submitted.
            </p>
            <p className="text-sm text-yellow-700 mt-2">
              <strong>{questionTitle}</strong>
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Submission" size="md">
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Are you sure you want to submit this question?
          </p>
          <p className="text-sm text-yellow-700 mt-2">
            <strong>{questionTitle}</strong>
          </p>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700">
            Once submitted, you cannot make changes to this question.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Submitting...
              </>
            ) : (
              "Submit Question"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}