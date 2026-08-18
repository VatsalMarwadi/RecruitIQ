// admin/pages/drives/DriveList.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../configuration/api";
import { FaPlus, FaSearch, FaEye, FaEdit, FaPlusCircle, FaInfoCircle } from "react-icons/fa";

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800" },
  published: { label: "Published", color: "bg-blue-100 text-blue-800" },
  in_progress: { label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
  completed: { label: "Completed", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" },
};

export default function DriveList() {
  const navigate = useNavigate();
  const [drives, setDrives] = useState([]);
  const [filteredDrives, setFilteredDrives] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDrives();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDrives(drives);
    } else {
      const searchLower = searchTerm.toLowerCase();
      setFilteredDrives(
        drives.filter(
          (d) =>
            d.title?.toLowerCase().includes(searchLower) ||
            d.job_role?.toLowerCase().includes(searchLower) ||
            d.institute_name?.toLowerCase().includes(searchLower)
        )
      );
    }
  }, [searchTerm, drives]);

  const fetchDrives = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/canadmin/get-drive/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        const data = response.data.data.map(d => ({
          ...d,
          institute_name: d.institute_details?.name || "N/A"
        }));
        setDrives(data);
        setFilteredDrives(data);
      } else {
        toast.error(response.data.message || "Failed to load drives");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load drives");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status) => statusConfig[status]?.label || status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drive Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all placement drives</p>
        </div>
        <button
          onClick={() => navigate("/admin/drive/add")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <FaPlus size={14} /> Add Drive
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search drives by title, role, or institute..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : filteredDrives.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No drives found</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap w-[25%]">Drive</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap w-[20%]">Institute</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap w-[15%]">Date</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap w-[12%]">Status</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium text-gray-500 uppercase whitespace-nowrap w-[28%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDrives.map((drive) => {
                const status = statusConfig[drive.status] || statusConfig.draft;

                return (
                  <tr key={drive.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 truncate max-w-xs">{drive.title}</div>
                      <div className="text-xs text-gray-500">{drive.job_role}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{drive.institute_name}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {drive.drive_date_time ? new Date(drive.drive_date_time).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${status.color} whitespace-nowrap`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/admin/drive/${drive.id}/rounds/add`)}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors flex-shrink-0"
                          title="Add Rounds"
                        >
                          <FaPlusCircle size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/drive/view/${drive.id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                          title="View"
                        >
                          <FaEye size={14} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/drive/edit/${drive.id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors flex-shrink-0"
                          title="Edit"
                        >
                          <FaEdit size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}