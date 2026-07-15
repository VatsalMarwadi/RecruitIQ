import React, { useState, useEffect } from "react";
import {
  FaUsers,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaUserCheck,
  FaUserTimes,
  FaEnvelope,
  FaCalendarAlt,
  FaEye,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api, { authHeader } from "../../configuration/api";
import { confirmDelete } from "../../components/ToastConfirmation";

const AdminUsers = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const usersPerPage = 10;

  // Fetch users from API
  useEffect(() => {
    fetchUsers();
  }, [currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/canadmin/get-admin-user/", authHeader());

      if (response.data.success) {
        setUsers(response.data.data);
        setTotalUsers(response.data.count);
      } else {
        toast.error(response.data.message || "Failed to load users");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(error.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // Handle user status toggle (activate/deactivate) with custom confirmation
  const handleToggleStatus = (userId, currentStatus, userName) => {
    const action = currentStatus ? "deactivate" : "activate";
    const actionText = currentStatus ? "Deactivate" : "Activate";
    
    // Use custom toast confirmation
    import("../../components/ToastConfirmation").then(({ showConfirmation }) => {
      showConfirmation({
        title: `${actionText} User`,
        message: `Are you sure you want to ${action} "${userName}"?`,
        confirmText: actionText,
        cancelText: "Cancel",
        confirmColor: currentStatus ? "red" : "green",
        icon: currentStatus ? <FaUserTimes className="text-xl" /> : <FaUserCheck className="text-xl" />,
        onConfirm: async () => {
          try {
            const response = await api.patch(
              `/canadmin/update-user-status/${userId}/`,
              {},
              authHeader()
            );

            if (response.data.success) {
              toast.success(response.data.message);
              await fetchUsers();
            } else {
              toast.error(response.data.message || `Failed to ${action} user`);
            }
          } catch (error) {
            console.error("Error toggling user status:", error);
            toast.error(error.response?.data?.message || "Failed to update user status");
          }
        },
      });
    });
  };

  // Navigate to user details page
  const viewUserDetails = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Format date helper functions
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const month = date.toLocaleString("en-US", { month: "short" });
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Get color for avatar
  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-cyan-500",
      "bg-amber-500",
    ];
    const index = name?.length ? name.length % colors.length : 0;
    return colors[index];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <FaUsers className="text-orange-500" />
          User Management
        </h2>
        <span className="text-sm text-slate-500">
          Total: {totalUsers} {totalUsers === 1 ? "user" : "users"}
        </span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FaSearch className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            <p className="mt-3 text-sm text-slate-500">Loading users...</p>
          </div>
        ) : currentUsers.length === 0 ? (
          <div className="text-center py-12">
            <FaUsers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">
              {searchTerm ? "No users match your search" : "No users found"}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="mt-2 text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date of Birth
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold ${getAvatarColor(
                              user.name
                            )}`}
                          >
                            {getInitials(user.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              ID: #{user.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FaEnvelope className="text-slate-400 text-xs" />
                          <span className="text-sm text-slate-600">
                            {user.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <FaCalendarAlt className="text-slate-400 text-xs" />
                          <span className="text-sm text-slate-600">
                            {formatDate(user.date_of_birth)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                            user.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              user.is_active ? "bg-green-500" : "bg-red-500"
                            }`}
                          ></span>
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-sm text-slate-500">
                          {formatDateShort(user.created_at)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => viewUserDetails(user.id)}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <FaEye size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(user.id, user.is_active, user.name)}
                            className={`p-2 rounded-lg transition-colors ${
                              user.is_active
                                ? "text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                                : "text-green-500 hover:text-green-600 hover:bg-green-50"
                            }`}
                            title={user.is_active ? "Deactivate" : "Activate"}
                          >
                            {user.is_active ? (
                              <FaUserTimes size={16} />
                            ) : (
                              <FaUserCheck size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-sm text-slate-500 order-2 sm:order-1">
                  Showing {indexOfFirstUser + 1} to{" "}
                  {Math.min(indexOfLastUser, filteredUsers.length)} of{" "}
                  {filteredUsers.length} users
                </div>
                <div className="flex items-center gap-1.5 order-1 sm:order-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border transition-colors ${
                      currentPage === 1
                        ? "text-slate-300 cursor-not-allowed border-slate-200"
                        : "text-slate-600 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <FaChevronLeft size={14} />
                  </button>
                  <span className="px-3.5 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg">
                    {currentPage}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border transition-colors ${
                      currentPage === totalPages
                        ? "text-slate-300 cursor-not-allowed border-slate-200"
                        : "text-slate-600 hover:bg-slate-100 border-slate-200"
                    }`}
                  >
                    <FaChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;