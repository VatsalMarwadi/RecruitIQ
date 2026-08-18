// admin/pages/institute/InstituteList.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../../configuration/api";
import { showConfirmation } from "../../../components/ToastConfirmation";
import { FaPlus, FaSearch, FaEdit, FaToggleOn, FaToggleOff, FaUniversity } from "react-icons/fa";

export default function InstituteList() {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [filteredInstitutes, setFilteredInstitutes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

  useEffect(() => {
    fetchInstitutes();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredInstitutes(institutes);
    } else {
      const searchLower = searchTerm.toLowerCase();
      const filtered = institutes.filter(
        (institute) =>
          institute.name.toLowerCase().includes(searchLower) ||
          institute.code.toLowerCase().includes(searchLower) ||
          institute.city.toLowerCase().includes(searchLower) ||
          institute.state.toLowerCase().includes(searchLower) ||
          institute.tpo_name?.toLowerCase().includes(searchLower) ||
          institute.tpo_email?.toLowerCase().includes(searchLower)
      );
      setFilteredInstitutes(filtered);
    }
  }, [searchTerm, institutes]);

  const fetchInstitutes = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await api.get("/canadmin/get-admin-institute/", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setInstitutes(response.data.data);
        setFilteredInstitutes(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load institutes");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load institutes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (instituteId, currentStatus, instituteName) => {
    const action = currentStatus ? "deactivate" : "activate";
    
    showConfirmation({
      title: `${currentStatus ? 'Deactivate' : 'Activate'} Institute`,
      message: `Are you sure you want to ${action} "${instituteName}"?`,
      confirmText: currentStatus ? 'Deactivate' : 'Activate',
      confirmColor: currentStatus ? 'red' : 'green',
      onConfirm: async () => {
        setTogglingId(instituteId);
        try {
          const token = localStorage.getItem("token");
          const response = await api.patch(
            `/canadmin/update-institute-status/${instituteId}/`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (response.data.success) {
            toast.success(response.data.message);
            await fetchInstitutes();
          } else {
            toast.error(response.data.message || "Failed to update status");
          }
        } catch (error) {
          toast.error(error.response?.data?.message || "Failed to update status");
        } finally {
          setTogglingId(null);
        }
      }
    });
  };

  const handleEdit = (id) => {
    navigate(`/admin/institute/edit/${id}`);
  };

  const handleAdd = () => {
    navigate("/admin/institute/add");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Institutes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all registered institutes</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <FaPlus size={14} />
          Add Institute
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search institutes..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); }}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
          </div>
        ) : filteredInstitutes.length === 0 ? (
          <div className="text-center py-12">
            <FaUniversity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No institutes found</p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Institute</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TPO</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredInstitutes.map((institute) => (
                    <tr key={institute.id} className={`hover:bg-gray-50 transition-colors ${!institute.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                            {institute.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{institute.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-gray-600">{institute.code}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {institute.city}, {institute.state}
                      </td>
                      <td className="px-4 py-3">
                        {institute.tpo_name ? (
                          <div>
                            <p className="text-gray-900">{institute.tpo_name}</p>
                            <p className="text-xs text-gray-500">{institute.tpo_email}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not available</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                          institute.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${institute.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          {institute.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleToggleStatus(institute.id, institute.is_active, institute.name)}
                            disabled={togglingId === institute.id}
                            className={`p-1.5 rounded-lg transition-colors ${
                              institute.is_active 
                                ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50' 
                                : 'text-green-600 hover:text-green-700 hover:bg-green-50'
                            } ${togglingId === institute.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title={institute.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {togglingId === institute.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
                            ) : institute.is_active ? (
                              <FaToggleOn size={18} />
                            ) : (
                              <FaToggleOff size={18} />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(institute.id)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <FaEdit size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-500">
              Showing {filteredInstitutes.length} institute{filteredInstitutes.length !== 1 ? 's' : ''}
            </div>
          </>
        )}
      </div>
    </div>
  );
}