// pages/coding/CodingQuestionNavigator.jsx
import React from "react";

export const CodingQuestionNavigator = ({
  questions,
  current,
  submittedQuestions,
  onChange,
}) => {
  if (!questions || !questions.length) return null;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500">Questions</span>
      <div className="flex gap-1.5 flex-wrap max-h-20 overflow-y-auto">
        {questions.map((q, i) => {
          const isSubmitted = submittedQuestions.has(q.id);
          const isCurrent = i === current;

          return (
            <button
              key={q.id}
              onClick={() => onChange(i)}
              className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${
                isCurrent
                  ? "bg-blue-500 text-white"
                  : isSubmitted
                    ? "bg-emerald-500/90 text-white hover:bg-emerald-500"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200"
              }`}
              title={`Question ${i + 1}${isSubmitted ? " • Submitted" : ""}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};