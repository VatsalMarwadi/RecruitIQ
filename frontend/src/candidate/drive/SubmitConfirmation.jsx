// components/SubmitConfirmationModal.jsx
import React from "react";
import { Modal } from "../components/Modal";

export default function SubmitConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  questionTitle,
  isAlreadySubmitted = false,
}) {
  if (isAlreadySubmitted) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Already Submitted">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            This question has already been submitted.
          </p>
          <p className="text-sm text-gray-900 font-medium">{questionTitle}</p>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirm Submission"
      size="md"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            Are you sure you want to submit this question?
          </p>
          <p className="text-sm text-gray-900 font-medium mt-2">
            {questionTitle}
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          <p className="text-xs text-amber-700">
            Once submitted, you cannot make changes to this question.
          </p>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}