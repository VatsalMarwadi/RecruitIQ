// pages/coding/CodingQuestionNavigator.jsx
import React from 'react';

export const CodingQuestionNavigator = ({ total, current, submittedQuestions, onChange }) => {
  if (!total) return null;

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400 mr-2">Questions:</span>
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: total }, (_, i) => {
          const isSubmitted = submittedQuestions.has(i);
          const isCurrent = i === current;
          
          return (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all relative ${
                isCurrent
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-1 ring-offset-gray-800'
                  : isSubmitted
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title={`Question ${i + 1}${isSubmitted ? ' (Submitted)' : ''}`}
            >
              {i + 1}
              {isSubmitted && (
                <span className="absolute -top-1 -right-1 text-[8px]">✓</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};