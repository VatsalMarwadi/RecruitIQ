// admin/pages/drives/DriveDetails.jsx

import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../configuration/api";
import { showConfirmation } from "../../../components/ToastConfirmation";
import { FaArrowLeft, FaEdit, FaPlus, FaEye, FaInfoCircle, FaClock } from "react-icons/fa";

const roundStatusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-600" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

const roundTypeConfig = {
  aptitude: { label: "Aptitude", color: "bg-blue-100 text-blue-800" },
  coding: { label: "Coding", color: "bg-purple-100 text-purple-800" },
  gd: { label: "Group Discussion", color: "bg-orange-100 text-orange-800" },
  technical: { label: "Technical", color: "bg-indigo-100 text-indigo-800" },
  hr: { label: "HR", color: "bg-pink-100 text-pink-800" },
};

export default function DriveDetails() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [drive, setDrive] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingRoundId, setDeletingRoundId] = useState(null);

  useEffect(() => {
    if (id) fetchDriveDetails();
  }, [id]);

  const fetchDriveDetails = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get(`/canadmin/get-drive-details/${id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setDrive(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load drive");
        navigate("/admin/drive");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load drive");
      navigate("/admin/drive");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRound = async (roundId) => {
    showConfirmation({
      title: "Delete Round",
      message: "This action cannot be undone.",
      confirmText: "Delete",
      confirmColor: "red",
      onConfirm: async () => {
        setDeletingRoundId(roundId);
        try {
          const token = localStorage.getItem("token");
          const response = await api.delete(`/canadmin/delete-round/${roundId}/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.success) {
            toast.success(response.data.message);
            await fetchDriveDetails();
          }
        } catch (error) {
          toast.error("Failed to delete round");
        } finally {
          setDeletingRoundId(null);
        }
      }
    });
  };

  const handleViewRound = (roundId, roundType) => {
    if (roundType === "coding") {
      navigate(`/admin/drive/${id}/round/${roundId}/coding-round`);
    } else {
      navigate(`/admin/aptitude-round/${roundId}`);
    }
  };

  const getStatusLabel = (status) => roundStatusConfig[status]?.label || status;
  const getRoundTypeLabel = (type) => roundTypeConfig[type]?.label || type;
  const getDriveStatusColor = (status) => {
    const colors = {
      draft: "text-gray-600",
      published: "text-blue-600",
      in_progress: "text-yellow-600",
      completed: "text-green-600",
      cancelled: "text-red-600"
    };
    return colors[status] || "text-gray-600";
  };

  const formatTime = (datetime) => {
    if (!datetime) return "N/A";
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!drive) return null;

  const sortedRounds = drive.rounds ? [...drive.rounds].sort((a, b) => a.round_order - b.round_order) : [];
  const isDriveFinal = ["completed", "cancelled"].includes(drive.status);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/admin/drive")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <FaArrowLeft className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{drive.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {drive.job_role} • {drive.institute?.name || "N/A"}
          </p>
        </div>
        <button
          onClick={() => navigate(`/admin/drive/edit/${id}`)}
          className={`ml-auto p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ${isDriveFinal ? "opacity-50 cursor-not-allowed" : ""}`}
          title={isDriveFinal ? `Cannot edit ${drive.status} drive` : "Edit Drive"}
          disabled={isDriveFinal}
        >
          <FaEdit size={16} />
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Status</p>
          <p className={`text-sm font-medium mt-1 capitalize ${getDriveStatusColor(drive.status)}`}>
            {drive.status}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Date</p>
          <p className="text-sm font-medium text-gray-900 mt-1">
            {drive.drive_date_time ? new Date(drive.drive_date_time).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">Rounds</p>
          <p className="text-sm font-medium text-gray-900 mt-1">{sortedRounds.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 font-medium">CTC</p>
          <p className="text-sm font-medium text-green-600 mt-1">{drive.ctc || "N/A"}</p>
        </div>
      </div>

      {/* Rounds Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-sm font-medium text-gray-900">Rounds</h2>
          <button
            onClick={() => navigate(`/admin/drive/${id}/rounds/add`)}
            disabled={isDriveFinal}
            className={`flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors ${isDriveFinal ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <FaPlus size={14} /> Add Round
          </button>
        </div>

        {sortedRounds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">No rounds added yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Round</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRounds.map((round) => {
                  const status = roundStatusConfig[round.status] || roundStatusConfig.pending;
                  const isRoundFinal = ["completed", "cancelled"].includes(round.status);

                  return (
                    <tr key={round.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">Round {round.round_order}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${roundTypeConfig[round.round_type]?.color || "bg-gray-100"}`}>
                          {getRoundTypeLabel(round.round_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-700">
                            <FaClock className="inline mr-1 text-blue-500" size={10} />
                            {formatTime(round.round_start_datetime)}
                          </span>
                          {round.test_duration_minutes && (
                            <span className="text-xs text-gray-400 mt-0.5">
                              Test: {formatTime(round.round_start_datetime)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-700">
                            Round: {round.round_duration_minutes || round.duration_minutes || 'N/A'} min
                          </span>
                          <span className="text-xs text-gray-400">
                            Test: {round.test_duration_minutes || 'N/A'} min
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleViewRound(round.id, round.round_type)}
                            className={`p-1 rounded transition-colors ${
                              round.round_type === "coding" ? "text-purple-600 hover:bg-purple-50" : "text-blue-600 hover:bg-blue-50"
                            }`}
                            title={round.round_type === "coding" ? "View Coding Questions" : "View Aptitude Questions"}
                          >
                            <FaEye size={14} />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/drive/${id}/rounds/edit/${round.id}`)}
                            disabled={isRoundFinal || isDriveFinal}
                            className={`p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors ${(isRoundFinal || isDriveFinal) ? "opacity-50 cursor-not-allowed" : ""}`}
                            title={isRoundFinal ? `Cannot edit ${round.status} round` : "Edit Round"}
                          >
                            <FaEdit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteRound(round.id)}
                            disabled={deletingRoundId === round.id || isRoundFinal || isDriveFinal}
                            className={`p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors ${(deletingRoundId === round.id || isRoundFinal || isDriveFinal) ? "opacity-50 cursor-not-allowed" : ""}`}
                          >
                            {deletingRoundId === round.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent"></div>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}