// admin/pages/aptitude/AptitudeQuestionManagement.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../configuration/api";
import {
  FaArrowLeft,
  FaPlus,
  FaFileExcel,
  FaDownload,
  FaSearch,
  FaEdit,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle
} from "react-icons/fa";
import { confirmDelete } from "../../../components/ToastConfirmation";
import AddQuestionDrawer from "./components/AddQuestionDrawer";
import UploadExcelModal from "./components/UploadExcelModal";

export default function AptitudeQuestionManagement() {
  const navigate = useNavigate();
  const { roundId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [roundInfo, setRoundInfo] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    fetchQuestions();
    fetchRoundInfo();
  }, [roundId]);

  useEffect(() => {
    let filtered = [...questions];
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.question.toLowerCase().includes(searchLower) ||
          q.option_1.toLowerCase().includes(searchLower) ||
          q.option_2.toLowerCase().includes(searchLower) ||
          q.option_3.toLowerCase().includes(searchLower) ||
          q.option_4.toLowerCase().includes(searchLower)
      );
    }
    setFilteredQuestions(filtered);
    setCurrentPage(1);
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
      const response = await api.get(`/canadmin/get-aptitude-questions/${roundId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setQuestions(response.data.data);
        setFilteredQuestions(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error(error.response?.data?.message || "Failed to load questions");
    } finally {
      setLoading(false);
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
      const payload = { ...questionData, round: parseInt(roundId) };
      if (editingQuestion) payload.id = editingQuestion.id;

      const response = await api.post(`/canadmin/add-update-aptitude-question/`, payload, {
        headers: { Authorization: `Bearer ${token}` },
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
      console.error("Error saving question:", error);
      toast.error(error.response?.data?.message || "Failed to save question");
    }
  };

  const handleDeleteQuestion = (question) => {
    confirmDelete(
      "Delete Question",
      "Are you sure you want to delete this question?"
    ).then(async (confirmed) => {
      if (confirmed) {
        try {
          const token = localStorage.getItem("token");
          const response = await api.delete(`/canadmin/delete-aptitude-question/${question.id}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.success) {
            toast.success(response.data.message);
            fetchQuestions();
          } else {
            toast.error(response.data.message || "Failed to delete question");
          }
        } catch (error) {
          console.error("Error deleting question:", error);
          toast.error(error.response?.data?.message || "Failed to delete question");
        }
      }
    });
  };

  const handleExportExcel = () => {
    if (questions.length === 0) {
      toast.error("No questions to export");
      return;
    }

    import("xlsx").then((XLSX) => {
      const excelData = questions.map((q, index) => ({
        "S.No": index + 1,
        Question: q.question,
        "Option 1": q.option_1,
        "Option 2": q.option_2,
        "Option 3": q.option_3,
        "Option 4": q.option_4,
        "Correct Option": q.correct_option,
        Marks: q.marks || 1,
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      ws["!cols"] = [{ wch: 6 }, { wch: 40 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 25 }, { wch: 18 }, { wch: 10 }];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Questions");
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `aptitude_questions_round_${roundId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Questions exported successfully");
    }).catch(() => toast.error("Failed to export. Please try again."));
  };

  const getOptionLetter = (index) => String.fromCharCode(65 + index);

  const toggleExpand = (questionId) => {
    setExpandedRow(expandedRow === questionId ? null : questionId);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredQuestions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/admin/aptitude-round/${roundId}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaArrowLeft className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Aptitude Questions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {questions.length} questions • {roundInfo?.round_type_display || "Aptitude"} Round
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
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          <FaFileExcel size={14} /> Upload
        </button>
        <button
          onClick={handleExportExcel}
          disabled={questions.length === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            questions.length === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          <FaDownload size={14} /> Export
        </button>
        <div className="flex-1 max-w-xs ml-auto relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            <p className="text-gray-500">No questions found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Question</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Marks</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Correct</th>
                    <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((question, index) => (
                    <React.Fragment key={question.id}>
                      <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => toggleExpand(question.id)}>
                        <td className="px-4 py-3 text-xs text-gray-500">{indexOfFirstItem + index + 1}</td>
                        <td className="px-4 py-3 text-sm text-gray-800 max-w-md truncate">{question.question}</td>
                        <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{question.marks || 1}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                            <FaCheckCircle size={12} />
                            {getOptionLetter(["option_1", "option_2", "option_3", "option_4"].indexOf(question.correct_option))}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleEditQuestion(question)} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                              <FaEdit size={14} />
                            </button>
                            <button onClick={() => handleDeleteQuestion(question)} className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">
                              <FaTrash size={14} />
                            </button>
                            <button onClick={() => toggleExpand(question.id)} className="p-1 text-gray-400 hover:bg-gray-100 rounded transition-colors">
                              {expandedRow === question.id ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRow === question.id && (
                        <tr>
                          <td colSpan="5" className="px-4 py-3 bg-gray-50">
                            <div className="grid grid-cols-2 gap-2 max-w-2xl">
                              {["option_1", "option_2", "option_3", "option_4"].map((opt, idx) => {
                                const isCorrect = opt === question.correct_option;
                                return (
                                  <div key={opt} className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm ${isCorrect ? "bg-green-50 text-green-700" : "bg-white text-gray-700"}`}>
                                    <span className="font-medium text-gray-400">{getOptionLetter(idx)}.</span>
                                    <span>{question[opt]}</span>
                                    {isCorrect && <FaCheckCircle className="text-green-500 ml-auto" size={14} />}
                                  </div>
                                );
                              })}
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
            <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50">
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
              <button key={number} onClick={() => paginate(number)} className={`px-3 py-1 rounded text-sm ${currentPage === number ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {number}
              </button>
            ))}
            <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50">
              Next
            </button>
          </nav>
        </div>
      )}

      {/* Drawer & Modal */}
      <AddQuestionDrawer
        isOpen={showDrawer}
        onClose={() => { setShowDrawer(false); setEditingQuestion(null); }}
        onSave={handleSaveQuestion}
        editingQuestion={editingQuestion}
        roundId={roundId}
      />

      <UploadExcelModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        roundId={roundId}
        onSuccess={fetchQuestions}
      />
    </div>
  );
}