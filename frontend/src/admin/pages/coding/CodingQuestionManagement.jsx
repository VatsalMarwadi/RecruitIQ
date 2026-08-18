// admin/pages/coding/CodingQuestionManagement.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../configuration/api";
import { 
  FaArrowLeft, 
  FaPlus, 
  FaSearch, 
  FaEdit, 
  FaTrash, 
  FaChevronDown, 
  FaChevronUp,
  FaCode,
  FaTerminal,
  FaPlusCircle
} from "react-icons/fa";
import { confirmDelete } from "../../../components/ToastConfirmation";
import AddQuestionDrawer from "./components/AddQuestionDrawer";

export default function CodingQuestionManagement() {
  const navigate = useNavigate();
  const { driveId, roundId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roundInfo, setRoundInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [loadingTestCases, setLoadingTestCases] = useState({});

  useEffect(() => {
    if (roundId) {
      fetchQuestions();
      fetchRoundInfo();
    }
  }, [roundId]);

  useEffect(() => {
    if (questions.length > 0) {
      let filtered = [...questions];
      if (searchTerm.trim() !== "") {
        const searchLower = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (q) =>
            (q.problem_statement || '').toLowerCase().includes(searchLower) ||
            (q.description || '').toLowerCase().includes(searchLower)
        );
      }
      setFilteredQuestions(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, questions]);

  const fetchRoundInfo = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/canadmin/get-round-details/${roundId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) setRoundInfo(response.data.data);
    } catch (error) {
      console.error("Error fetching round info:", error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get(`/canadmin/get-coding-questions/${roundId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const questionsData = response.data.data || [];
        
        const formattedQuestions = questionsData.map(q => ({
          ...q,
          test_case_count: q.test_case_count || q.test_cases?.length || 0,
          test_cases: q.test_cases || []
        }));
        
        setQuestions(formattedQuestions);
        setFilteredQuestions(formattedQuestions);
        
        await fetchAllTestCases(formattedQuestions);
      } else {
        toast.error(response.data.message || "Failed to load questions");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTestCases = async (questionsList) => {
    const token = localStorage.getItem("token");
    
    for (const question of questionsList) {
      try {
        const response = await api.get(`/canadmin/get-coding-test-cases/${question.id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (response.data.success) {
          const testCases = response.data.data || [];
          const testCaseCount = testCases.length;
          
          setQuestions(prevQuestions => 
            prevQuestions.map(q => 
              q.id === question.id 
                ? { ...q, test_cases: testCases, test_case_count: testCaseCount }
                : q
            )
          );
          setFilteredQuestions(prev => 
            prev.map(q => 
              q.id === question.id 
                ? { ...q, test_cases: testCases, test_case_count: testCaseCount }
                : q
            )
          );
        }
      } catch (error) {
        console.error(`Error fetching test cases for question ${question.id}:`, error);
      }
    }
  };

  const fetchTestCases = async (questionId) => {
    setLoadingTestCases(prev => ({ ...prev, [questionId]: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(`/canadmin/get-coding-test-cases/${questionId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const testCases = response.data.data || [];
        const testCaseCount = testCases.length;
        
        setQuestions(prevQuestions => 
          prevQuestions.map(q => 
            q.id === questionId 
              ? { ...q, test_cases: testCases, test_case_count: testCaseCount }
              : q
          )
        );
        setFilteredQuestions(prev => 
          prev.map(q => 
            q.id === questionId 
              ? { ...q, test_cases: testCases, test_case_count: testCaseCount }
              : q
          )
        );
      }
    } catch (error) {
      console.error("Error fetching test cases:", error);
    } finally {
      setLoadingTestCases(prev => ({ ...prev, [questionId]: false }));
    }
  };

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setShowDrawer(true);
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setShowDrawer(true);
  };

  const handleSaveQuestion = async (questionData) => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...questionData,
        round: parseInt(roundId),
        id: editingQuestion?.id || undefined
      };

      const response = await api.post(`/canadmin/add-update-coding-question/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowDrawer(false);
        setEditingQuestion(null);
        fetchQuestions();
      } else {
        toast.error(response.data.message || "Failed to save question");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save question");
    }
  };

  const handleDeleteQuestion = (question) => {
    confirmDelete(
      "Delete Question",
      `Are you sure you want to delete "${question.problem_statement}"? All test cases will also be deleted.`
    ).then(async (confirmed) => {
      if (confirmed) {
        try {
          const token = localStorage.getItem("token");
          const response = await api.delete(`/canadmin/delete-coding-question/${question.id}/`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success) {
            toast.success(response.data.message);
            fetchQuestions();
          } else {
            toast.error(response.data.message || "Failed to delete question");
          }
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete question");
        }
      }
    });
  };

  const handleDeleteTestCase = async (questionId, testCaseId) => {
    confirmDelete(
      "Delete Test Case",
      "This action cannot be undone."
    ).then(async (confirmed) => {
      if (confirmed) {
        try {
          const token = localStorage.getItem("token");
          await api.delete(`/canadmin/delete-coding-test-case/${testCaseId}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          toast.success("Test case deleted successfully");
          fetchQuestions();
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to delete test case");
        }
      }
    });
  };

  const handleAddTestCase = (questionId) => {
    if (!driveId || driveId === "undefined") {
      toast.error("Drive ID is missing. Please try again.");
      return;
    }
    navigate(`/admin/drive/${driveId}/round/${roundId}/coding-question/${questionId}/testcase/add`);
  };

  const handleEditTestCase = (questionId, testCaseId) => {
    if (!driveId || driveId === "undefined") {
      toast.error("Drive ID is missing. Please try again.");
      return;
    }
    navigate(`/admin/drive/${driveId}/round/${roundId}/coding-question/${questionId}/testcase/edit/${testCaseId}`);
  };

  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const toggleExpand = (questionId) => {
    if (expandedRow === questionId) {
      setExpandedRow(null);
      return;
    }
    setExpandedRow(questionId);
    const question = questions.find(q => q.id === questionId);
    if (question && (!question.test_cases || question.test_cases.length === 0)) {
      fetchTestCases(questionId);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (!roundId) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">Invalid round ID</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Coding Questions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {questions.length} questions • {roundInfo?.round_type_display || 'Coding'} Round
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={handleAddQuestion}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <FaPlus size={14} /> Add Question
        </button>
        <div className="flex-1 max-w-xs ml-auto relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No coding questions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Problem</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Marks</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Test Cases</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((question, index) => (
                    <React.Fragment key={question.id}>
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-xs text-gray-500">{indexOfFirstItem + index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-800">
                          {question.problem_statement || 'Untitled'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty || 'Medium'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">
                          {question.marks || 100}
                        </td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <FaTerminal size={14} />
                            {question.test_case_count || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditQuestion(question)}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit"
                            >
                              <FaEdit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(question)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <FaTrash size={14} />
                            </button>
                            <button
                              onClick={() => toggleExpand(question.id)}
                              className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors"
                              title="Details"
                            >
                              {expandedRow === question.id ? (
                                <FaChevronUp size={14} />
                              ) : (
                                <FaChevronDown size={14} />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === question.id && (
                        <tr>
                          <td colSpan="6" className="px-4 py-3 bg-gray-50">
                            <div className="space-y-3">
                              {/* Question Details */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Description</p>
                                  <p className="text-sm text-gray-700 mt-1">{question.description || 'No description'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Constraints</p>
                                  <p className="text-sm text-gray-700 mt-1 font-mono">{question.constraints || 'Not specified'}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Input Format</p>
                                  <p className="text-sm text-gray-700 mt-1 font-mono">{question.input_format || 'Not specified'}</p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Output Format</p>
                                  <p className="text-sm text-gray-700 mt-1 font-mono">{question.output_format || 'Not specified'}</p>
                                </div>
                              </div>

                              {/* Test Cases Section */}
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                    <FaTerminal size={14} />
                                    Test Cases ({question.test_case_count || 0})
                                  </p>
                                  <button
                                    onClick={() => handleAddTestCase(question.id)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                  >
                                    <FaPlusCircle size={12} /> Add Test Case
                                  </button>
                                </div>

                                {loadingTestCases[question.id] ? (
                                  <div className="text-center py-4">
                                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto"></div>
                                    <p className="text-xs text-gray-500 mt-2">Loading test cases...</p>
                                  </div>
                                ) : question.test_cases && question.test_cases.length > 0 ? (
                                  <div className="space-y-2">
                                    {question.test_cases.map((tc, idx) => (
                                      <div key={tc.id} className="bg-white p-3 rounded-lg border border-gray-200">
                                        <div className="flex justify-between items-start">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              <span className="text-xs font-medium text-gray-500">#{idx + 1}</span>
                                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                tc.is_sample ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                              }`}>
                                                {tc.is_sample ? 'Sample' : 'Hidden'}
                                              </span>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                              <div>
                                                <p className="text-xs text-gray-500">Input</p>
                                                <p className="text-xs font-mono text-gray-700 bg-gray-50 p-1.5 rounded break-all">
                                                  {tc.input_data || 'N/A'}
                                                </p>
                                              </div>
                                              <div>
                                                <p className="text-xs text-gray-500">Expected Output</p>
                                                <p className="text-xs font-mono text-gray-700 bg-gray-50 p-1.5 rounded break-all">
                                                  {tc.expected_output || 'N/A'}
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="flex gap-1 ml-2">
                                            <button
                                              onClick={() => handleEditTestCase(question.id, tc.id)}
                                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                              title="Edit"
                                            >
                                              <FaEdit size={12} />
                                            </button>
                                            <button
                                              onClick={() => handleDeleteTestCase(question.id, tc.id)}
                                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                              title="Delete"
                                            >
                                              <FaTrash size={12} />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                                    <p className="text-sm text-gray-400">No test cases added yet</p>
                                    <button
                                      onClick={() => handleAddTestCase(question.id)}
                                      className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      Add your first test case
                                    </button>
                                  </div>
                                )}
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

            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
              <span>
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredQuestions.length)} of {filteredQuestions.length}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center">
          <nav className="flex items-center gap-1">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-1 rounded text-sm ${
                  currentPage === number ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {number}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Add Question Drawer */}
      <AddQuestionDrawer
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        editingQuestion={editingQuestion}
        roundId={roundId}
      />
    </div>
  );
}