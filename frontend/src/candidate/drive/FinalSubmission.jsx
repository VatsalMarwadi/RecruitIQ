// components/FinalSubmissionModal.jsx
import React from "react";
import { Modal } from "../components/Modal";

export default function FinalSubmissionModal({
  isOpen,
  onClose,
  onConfirm,
  loading,
  totalQuestions,
  submittedQuestions,
}) {
  const allSubmitted = submittedQuestions === totalQuestions;
  const hasSubmissions = submittedQuestions > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Submit Coding Round"
      size="lg"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          {allSubmitted
            ? "All questions have been submitted. Ready to finalize?"
            : hasSubmissions
              ? `You have submitted ${submittedQuestions} of ${totalQuestions} questions.`
              : "You have not submitted any questions yet."}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <div className="text-xl font-medium text-gray-900">
              {totalQuestions}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Total</div>
          </div>
          <div
            className={`rounded-lg p-3 text-center ${
              allSubmitted
                ? "bg-emerald-50"
                : hasSubmissions
                  ? "bg-amber-50"
                  : "bg-gray-50"
            }`}
          >
            <div
              className={`text-xl font-medium ${
                allSubmitted
                  ? "text-emerald-600"
                  : hasSubmissions
                    ? "text-amber-600"
                    : "text-gray-400"
              }`}
            >
              {submittedQuestions}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">Submitted</div>
          </div>
        </div>

        {!allSubmitted && hasSubmissions && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <p className="text-xs text-amber-700">
              {totalQuestions - submittedQuestions} unsubmitted question(s)
              will not be evaluated.
            </p>
          </div>
        )}

        {!hasSubmissions && (
          <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            <p className="text-xs text-red-700">
              Submit at least one question before finalizing.
            </p>
          </div>
        )}

        {allSubmitted && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            <p className="text-xs text-emerald-700">
              Your responses will be recorded for evaluation.
            </p>
          </div>
        )}

        <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || !hasSubmissions}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              hasSubmissions && !loading
                ? "bg-gray-900 text-white hover:bg-gray-800"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
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