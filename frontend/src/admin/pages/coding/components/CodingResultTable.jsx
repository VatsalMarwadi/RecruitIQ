// admin/pages/coding/components/CodingResultTable.jsx

import React, { useState } from 'react';
import { Eye, Search, CheckCircle, XCircle, ChevronDown, ChevronUp, Code, Clock } from 'lucide-react';

export default function CodingResultTable({ results, onViewResult }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');

  const filteredResults = results.filter(result => {
    const name = (result.candidate_name || '').toLowerCase();
    return name.includes(searchTerm.toLowerCase());
  });

  const sortedResults = [...filteredResults].sort((a, b) => {
    let aVal = a[sortField] || 0;
    let bVal = b[sortField] || 0;
    
    if (sortField === 'candidate_name') {
      aVal = (a.candidate_name || '').toLowerCase();
      bVal = (b.candidate_name || '').toLowerCase();
    }
    
    return sortOrder === 'desc' ? (aVal > bVal ? -1 : 1) : (aVal < bVal ? -1 : 1);
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'desc' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />;
  };

  // Helper to get status display based on evaluation status
  const getStatusDisplay = (result) => {
    const hasDecision = result.candidate_decision !== null && 
                       result.candidate_decision !== undefined &&
                       result.candidate_decision.decision !== 'pending';
    
    if (!hasDecision) {
      return { 
        label: 'Evaluation Pending', 
        icon: <Clock className="w-3 h-3" />, 
        color: 'bg-yellow-50 text-yellow-700' 
      };
    }

    const decision = result.candidate_decision.decision;
    
    switch(decision) {
      case 'shortlisted':
        return { label: 'Passed', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-50 text-green-700' };
      case 'rejected':
        return { label: 'Failed', icon: <XCircle className="w-3 h-3" />, color: 'bg-red-50 text-red-700' };
      case 'on_hold':
        return { label: 'On Hold', icon: <Clock className="w-3 h-3" />, color: 'bg-yellow-50 text-yellow-700' };
      default:
        return { label: 'Pending', icon: null, color: 'bg-gray-50 text-gray-500' };
    }
  };

  // Check if a result is passed based on evaluation decision
  const isPassed = (result) => {
    const hasDecision = result.candidate_decision !== null && 
                       result.candidate_decision !== undefined &&
                       result.candidate_decision.decision !== 'pending';
    if (hasDecision) {
      return result.candidate_decision.decision === 'shortlisted';
    }
    return (result.percentage || 0) >= 40;
  };

  // Check if a result is failed based on evaluation decision
  const isFailed = (result) => {
    const hasDecision = result.candidate_decision !== null && 
                       result.candidate_decision !== undefined &&
                       result.candidate_decision.decision !== 'pending';
    if (hasDecision) {
      return result.candidate_decision.decision === 'rejected';
    }
    return (result.percentage || 0) < 40 && (result.status === 'completed' || result.status === 'evaluated');
  };

  // Check if a result is pending evaluation
  const isPending = (result) => {
    const hasDecision = result.candidate_decision !== null && 
                       result.candidate_decision !== undefined &&
                       result.candidate_decision.decision !== 'pending';
    return !hasDecision;
  };

  return (
    <div>
      {/* Search */}
      <div className="px-6 pt-4 pb-3 border-b border-gray-100">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search candidates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th 
                className="px-6 py-2.5 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('candidate_name')}
              >
                <div className="flex items-center gap-1">
                  Candidate
                  <SortIcon field="candidate_name" />
                </div>
              </th>
              <th 
                className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('score')}
              >
                <div className="flex items-center justify-center gap-1">
                  Score
                  <SortIcon field="score" />
                </div>
              </th>
              <th className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
              <th 
                className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700"
                onClick={() => handleSort('percentage')}
              >
                <div className="flex items-center justify-center gap-1">
                  Percentage
                  <SortIcon field="percentage" />
                </div>
              </th>
              <th className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">
                Attempted
              </th>
              <th className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {sortedResults.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-sm text-gray-500">
                  No candidates found
                </td>
              </tr>
            ) : (
              sortedResults.map((result) => {
                const statusInfo = getStatusDisplay(result);
                
                return (
                  <tr key={result.attempt_id || result.submission_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                      {result.candidate_name || 'N/A'}
                    </td>
                    <td className="px-6 py-3 text-sm text-center font-medium text-blue-600">
                      {result.score || 0}
                    </td>
                    <td className="px-6 py-3 text-sm text-center text-gray-500">
                      {result.total_marks || 0}
                    </td>
                    <td className="px-6 py-3 text-sm text-center">
                      <span className={`font-medium ${
                        (result.percentage || 0) >= 40 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(result.percentage || 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        <Code className="w-3 h-3" />
                        {result.attempted_questions || 0}/{result.total_questions || 0}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => onViewResult(result.attempt_id || result.submission_id)}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {sortedResults.length > 0 && (
        <div className="px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>
            Showing {sortedResults.length} of {results.length} candidates
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-3 h-3" />
              {sortedResults.filter(r => isPassed(r)).length} Passed
            </span>
            <span className="flex items-center gap-1 text-red-600">
              <XCircle className="w-3 h-3" />
              {sortedResults.filter(r => isFailed(r)).length} Failed
            </span>
            <span className="flex items-center gap-1 text-yellow-600">
              <Clock className="w-3 h-3" />
              {sortedResults.filter(r => isPending(r)).length} Pending
            </span>
          </div>
        </div>
      )}
    </div>
  );
}