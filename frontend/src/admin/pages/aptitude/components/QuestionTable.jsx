// admin/pages/aptitude/components/QuestionTable.jsx

import React, { useState } from 'react';
import { Edit, Trash2, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { confirmDelete } from '../../../../components/ToastConfirmation';

export default function QuestionTable({ questions, loading, onEdit, onDelete }) {
  const [expandedRow, setExpandedRow] = useState(null);

  const getOptionLetter = (index) => {
    return String.fromCharCode(65 + index);
  };

  const toggleExpand = (questionId) => {
    setExpandedRow(expandedRow === questionId ? null : questionId);
  };

  const handleDelete = (question) => {
    confirmDelete({
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question?',
      confirmText: 'Delete',
      onConfirm: () => onDelete(question.id)
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto"></div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <p className="text-gray-500">No questions found. Add your first question.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">#</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Marks</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Correct</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {questions.map((question, index) => (
              <React.Fragment key={question.id}>
                <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleExpand(question.id)}>
                  <td className="px-4 py-3 text-xs text-gray-500 text-center">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {question.question}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">
                    {question.marks || 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      {getOptionLetter(['option_1', 'option_2', 'option_3', 'option_4'].indexOf(question.correct_option))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onEdit(question)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(question)}
                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleExpand(question.id)}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                      >
                        {expandedRow === question.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
                {expandedRow === question.id && (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 bg-gray-50">
                      <div className="w-full">
                        <div className="space-y-2.5">
                          {['option_1', 'option_2', 'option_3', 'option_4'].map((opt, idx) => {
                            const isCorrect = opt === question.correct_option;
                            return (
                              <div
                                key={opt}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                                  isCorrect 
                                    ? 'bg-green-50 border border-green-200 text-green-700' 
                                    : 'bg-white border border-gray-200 text-gray-700'
                                }`}
                              >
                                <span className={`font-medium w-6 ${isCorrect ? 'text-green-600' : 'text-gray-400'}`}>
                                  {getOptionLetter(idx)}.
                                </span>
                                <span className="flex-1">{question[opt]}</span>
                                {isCorrect && <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
        Showing {questions.length} questions
      </div>
    </div>
  );
}