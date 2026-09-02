// src/admin/AdminDashboard.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  UsersIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  BriefcaseIcon,
  XCircleIcon,
  TrophyIcon,
} from "@heroicons/react/24/outline";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

import api from "../configuration/api";
import toast from "react-hot-toast";

const COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
];

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-700",
  published: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    totalInstitutes: 0,
    activeInstitutes: 0,
    totalDrives: 0,
    activeDrives: 0,
    completedDrives: 0,
    draftDrives: 0,
  });

  const [recentDrives, setRecentDrives] = useState([]);

  const [driveStatusData, setDriveStatusData] = useState([]);

  const [userGrowthData, setUserGrowthData] = useState([]);

  const [monthlyDrivesData, setMonthlyDrivesData] = useState([]);

  const [recentRoundResults, setRecentRoundResults] = useState([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));

    if (userData?.role !== "admin") {
      toast.error("Access denied. Admin only.");
      navigate("/login");
      return;
    }

    fetchDashboardData();
  }, []);

  /*
  ============================================================
  GET ROUND RESULT
  ============================================================
  */

  const getRoundResult = (round) => {
    let candidates = [];

    // Check all possible places where candidate data might be stored
    if (Array.isArray(round.results)) {
      candidates = round.results;
    } else if (Array.isArray(round.candidates)) {
      candidates = round.candidates;
    } else if (Array.isArray(round.attempts)) {
      candidates = round.attempts;
    } else if (Array.isArray(round.attempts_data)) {
      candidates = round.attempts_data;
    }

    // Check for direct counts in the round object
    const totalCandidates =
      round.total_candidates ??
      round.totalCandidates ??
      round.total_attempts ??
      round.totalAttempts ??
      candidates.length ??
      0;

    const passed =
      round.passed_candidates ??
      round.passed ??
      round.passed_count ??
      round.passedCount ??
      candidates.filter(
        (candidate) =>
          candidate.status === "passed" ||
          candidate.result === "passed" ||
          candidate.decision === "shortlisted" ||
          candidate.decision === "Shortlisted" ||
          candidate.is_passed === true,
      ).length;

    const failed =
      round.failed_candidates ??
      round.failed ??
      round.failed_count ??
      round.failedCount ??
      candidates.filter(
        (candidate) =>
          candidate.status === "failed" ||
          candidate.result === "failed" ||
          candidate.decision === "rejected" ||
          candidate.decision === "Rejected" ||
          candidate.is_passed === false,
      ).length;

    return {
      totalCandidates: Number(totalCandidates) || 0,
      passed: Number(passed) || 0,
      failed: Number(failed) || 0,
    };
  };

  /*
  ============================================================
  FETCH DASHBOARD DATA
  ============================================================
  */

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, institutesRes, drivesRes] = await Promise.all([
        api.get("/canadmin/get-admin-user/"),
        api.get("/canadmin/get-admin-institute/"),
        api.get("/canadmin/get-drive/"),
      ]);

      const users = usersRes.data?.data || [];

      const institutes = institutesRes.data?.data || [];

      const drives = drivesRes.data?.data || [];

      console.log("=== DRIVES DATA ===");
      console.log(drives);

      /*
      ========================================================
      DRIVE STATUS
      ========================================================
      */

      const draftDrives = drives.filter((drive) => drive.status === "draft");

      const publishedDrives = drives.filter(
        (drive) => drive.status === "published",
      );

      const inProgressDrives = drives.filter(
        (drive) => drive.status === "in_progress",
      );

      const completedDrives = drives.filter(
        (drive) => drive.status === "completed",
      );

      const cancelledDrives = drives.filter(
        (drive) => drive.status === "cancelled",
      );

      const driveStatusDistribution = [
        {
          name: "Draft",
          value: draftDrives.length,
        },
        {
          name: "Published",
          value: publishedDrives.length,
        },
        {
          name: "In Progress",
          value: inProgressDrives.length,
        },
        {
          name: "Completed",
          value: completedDrives.length,
        },
        {
          name: "Cancelled",
          value: cancelledDrives.length,
        },
      ].filter((item) => item.value > 0);

      /*
      ========================================================
      USER GROWTH
      ========================================================
      */

      const userMonthMap = {};

      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}`;

        userMonthMap[key] = {
          month: date.toLocaleString("default", {
            month: "short",
          }),
          users: 0,
        };
      }

      let usersWithCreatedDate = 0;

      users.forEach((user) => {
        if (!user.created_at) return;

        const date = new Date(user.created_at);

        if (Number.isNaN(date.getTime())) {
          return;
        }

        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}`;

        if (userMonthMap[key]) {
          userMonthMap[key].users += 1;
          usersWithCreatedDate += 1;
        }
      });

      let cumulativeUsers = 0;

      const userGrowth = Object.values(userMonthMap).map(
        (item, index, array) => {
          cumulativeUsers += item.users;

          return {
            month: item.month,

            users:
              usersWithCreatedDate > 0
                ? cumulativeUsers
                : index === array.length - 1
                  ? users.length
                  : 0,
          };
        },
      );

      /*
      ========================================================
      MONTHLY DRIVES
      ========================================================
      */

      const drivesMonthMap = {};

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);

        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}`;

        drivesMonthMap[key] = {
          month: date.toLocaleString("default", {
            month: "short",
          }),

          drives: 0,
        };
      }

      drives.forEach((drive) => {
        const driveDate = drive.created_at || drive.drive_date_time;

        if (!driveDate) return;

        const date = new Date(driveDate);

        if (Number.isNaN(date.getTime())) {
          return;
        }

        const key = `${date.getFullYear()}-${String(
          date.getMonth() + 1,
        ).padStart(2, "0")}`;

        if (drivesMonthMap[key]) {
          drivesMonthMap[key].drives += 1;
        }
      });

      const monthlyDrives = Object.values(drivesMonthMap);

      /*
      ========================================================
      RECENT ROUND RESULTS
      ========================================================
      */

      // Collect all rounds from all drives
      const allRounds = [];
      drives.forEach((drive) => {
        if (Array.isArray(drive.rounds)) {
          drive.rounds.forEach((round) => {
            allRounds.push({
              ...round,
              drive_title: drive.title,
              drive_id: drive.id,
            });
          });
        }
      });

      console.log("=== ALL ROUNDS ===");
      console.log(allRounds);

      // Sort rounds by created_at or updated_at (newest first)
      const sortedRounds = allRounds.sort((a, b) => {
        const dateA = new Date(a.created_at || a.updated_at || 0);
        const dateB = new Date(b.created_at || b.updated_at || 0);
        return dateB - dateA;
      });

      // Get recent rounds with results
      const recentResults = sortedRounds
        .slice(0, 10)
        .map((round) => {
          const result = getRoundResult(round);

          const roundTypeDisplay =
            {
              aptitude: "Aptitude",
              coding: "Coding",
              gd: "Group Discussion",
              technical: "Technical Interview",
              hr: "HR Interview",
            }[round.round_type] ||
            round.round_type ||
            "Round";

          const passRate =
            result.totalCandidates > 0
              ? Math.round((result.passed / result.totalCandidates) * 100)
              : 0;

          return {
            id: round.id,
            round_order: round.round_order || 1,
            round_type: round.round_type || "unknown",
            round_type_display: roundTypeDisplay,
            drive_title: round.drive_title || "Unknown Drive",
            drive_id: round.drive_id,

            totalCandidates: result.totalCandidates,
            passed: result.passed,
            failed: result.failed,
            passRate,
            hasResults: result.totalCandidates > 0,
          };
        })
        .slice(0, 5);

      /*
      ========================================================
      SET STATS
      ========================================================
      */

      setStats({
        totalUsers: users.length,

        activeUsers: users.filter((user) => user.is_active).length,

        inactiveUsers: users.filter((user) => !user.is_active).length,

        totalInstitutes: institutes.length,

        activeInstitutes: institutes.filter((institute) => institute.is_active)
          .length,

        totalDrives: drives.length,

        activeDrives: publishedDrives.length + inProgressDrives.length,

        completedDrives: completedDrives.length,

        draftDrives: draftDrives.length,
      });

      setRecentDrives(drives.slice(0, 5));

      setDriveStatusData(driveStatusDistribution);

      setUserGrowthData(userGrowth);

      setMonthlyDrivesData(monthlyDrives);

      setRecentRoundResults(recentResults);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        setError("Session expired. Please login again.");

        toast.error("Session expired. Please login again.");

        setTimeout(() => {
          localStorage.removeItem("token");

          localStorage.removeItem("user");

          navigate("/login");
        }, 2000);
      } else {
        setError("Failed to load dashboard data.");

        toast.error(
          error.response?.data?.message || "Failed to load dashboard data",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
  ============================================================
  TOP STAT CARDS
  ============================================================
  */

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: UsersIcon,
      bg: "bg-blue-50",
      color: "text-blue-600",
    },

    {
      title: "Institutes",
      value: stats.totalInstitutes,
      icon: BuildingOfficeIcon,
      bg: "bg-green-50",
      color: "text-green-600",
    },

    {
      title: "Total Drives",
      value: stats.totalDrives,
      icon: CalendarIcon,
      bg: "bg-purple-50",
      color: "text-purple-600",
    },

    {
      title: "Active Drives",
      value: stats.activeDrives,
      icon: ChartBarIcon,
      bg: "bg-orange-50",
      color: "text-orange-600",
    },
  ];

  const getStatusBadge = (status) => {
    return STATUS_COLORS[status] || STATUS_COLORS.draft;
  };

  /*
  ============================================================
  CUSTOM TOOLTIP
  ============================================================
  */

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-xl border border-gray-100">
          <p className="text-sm font-semibold text-gray-800">{label}</p>

          {payload.map((item, index) => (
            <p key={index} className="text-sm text-gray-600 mt-1">
              {item.name}: <span className="font-semibold">{item.value}</span>
            </p>
          ))}
        </div>
      );
    }

    return null;
  };

  /*
  ============================================================
  LOADING
  ============================================================
  */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-blue-200 border-t-blue-600 mx-auto" />

          <p className="mt-4 text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  /*
  ============================================================
  ERROR
  ============================================================
  */

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>

          <p className="text-red-600 text-lg font-medium">{error}</p>

          <button
            onClick={fetchDashboardData}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>

          <p className="text-gray-500 mt-1">
            Overview of your placement and recruitment system.
          </p>
        </div>
      </div>

      {/* =====================================================
          TOP FOUR CARDS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <div
              key={index}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.title}</p>

                  <p className="text-3xl font-bold text-gray-800 mt-1">
                    {stat.value}
                  </p>
                </div>

                <div className={`p-3 rounded-xl ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          DRIVE STATUS + USER GROWTH
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DRIVE STATUS */}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Drive Status
              </h3>

              <p className="text-xs text-gray-500">
                Distribution of placement drives
              </p>
            </div>

            <ChartBarIcon className="w-5 h-5 text-gray-400" />
          </div>

          <div className="h-64">
            {driveStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={driveStatusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {driveStatusData.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>

                  <Tooltip content={<CustomTooltip />} />

                  <Legend verticalAlign="bottom" height={40} iconSize={9} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-gray-400">
                No drive data available
              </div>
            )}
          </div>
        </div>

        {/* USER GROWTH */}

        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                User Growth
              </h3>

              <p className="text-xs text-gray-500">
                Actual cumulative user growth
              </p>
            </div>

            <UserGroupIcon className="w-5 h-5 text-gray-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowthData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />

                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                <XAxis
                  dataKey="month"
                  stroke="#9CA3AF"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  domain={[
                    0,
                    (dataMax) => Math.max(dataMax, stats.totalUsers, 2),
                  ]}
                  stroke="#9CA3AF"
                  tick={{
                    fontSize: 12,
                  }}
                />

                <Tooltip content={<CustomTooltip />} />

                <Area
                  type="monotone"
                  dataKey="users"
                  name="Users"
                  stroke="#3B82F6"
                  fill="url(#colorUsers)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* =====================================================
          MONTHLY DRIVES + RECENT ROUND RESULTS

          LEFT SIDE:
          Monthly Drives + Active/Completed

          RIGHT SIDE:
          Active Users + Active Institutes
          Recent Round Results
      ===================================================== */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* =================================================
            LEFT SIDE
        ================================================= */}

        <div className="flex flex-col gap-4">
          {/* MONTHLY DRIVES */}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  Monthly Drives
                </h3>

                <p className="text-xs text-gray-500">
                  Drives created in the last 6 months
                </p>
              </div>

              <BriefcaseIcon className="w-5 h-5 text-gray-400" />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyDrivesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />

                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <YAxis
                    allowDecimals={false}
                    stroke="#9CA3AF"
                    tick={{
                      fontSize: 12,
                    }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    dataKey="drives"
                    name="Drives"
                    fill="#10B981"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ACTIVE + COMPLETED DRIVES */}

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <ClockIcon className="w-5 h-5 text-yellow-700" />
                </div>

                <div>
                  <p className="text-2xl font-bold text-yellow-700">
                    {stats.activeDrives}
                  </p>

                  <p className="text-xs text-yellow-600">Active Drives</p>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircleIcon className="w-5 h-5 text-purple-700" />
                </div>

                <div>
                  <p className="text-2xl font-bold text-purple-700">
                    {stats.completedDrives}
                  </p>

                  <p className="text-xs text-purple-600">Completed Drives</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            RIGHT SIDE
        ================================================= */}

        <div className="flex flex-col gap-4 h-full">
          {/* ACTIVE USERS + ACTIVE INSTITUTES */}

          <div className="grid grid-cols-2 gap-4 flex-shrink-0">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <UserGroupIcon className="w-5 h-5 text-blue-700" />
                </div>

                <div>
                  <p className="text-2xl font-bold text-blue-700">
                    {stats.activeUsers}
                  </p>

                  <p className="text-xs text-blue-600">Active Users</p>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-100 rounded-xl p-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BuildingOfficeIcon className="w-5 h-5 text-green-700" />
                </div>

                <div>
                  <p className="text-2xl font-bold text-green-700">
                    {stats.activeInstitutes}
                  </p>

                  <p className="text-xs text-green-600">Active Institutes</p>
                </div>
              </div>
            </div>
          </div>

          {/* =================================================
              RECENT ROUND RESULTS
          ================================================= */}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
            {/* HEADER */}

            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-800">
                  Recent Round Results
                </h3>

                <p className="text-xs text-gray-500">
                  Performance of recent assessment rounds
                </p>
              </div>

              <TrophyIcon className="w-5 h-5 text-gray-400" />
            </div>

            {/* TABLE OR EMPTY STATE */}

            <div className="overflow-auto flex-1">
              {recentRoundResults.length > 0 &&
              recentRoundResults.some((d) => d.totalCandidates > 0) ? (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">
                        Round
                      </th>

                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">
                        Type
                      </th>

                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">
                        Total
                      </th>

                      <th className="px-3 py-3 text-center text-xs font-semibold text-green-600">
                        Passed
                      </th>

                      <th className="px-3 py-3 text-center text-xs font-semibold text-red-600">
                        Failed
                      </th>

                      <th className="px-3 py-3 text-center text-xs font-semibold text-gray-500">
                        Pass %
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {recentRoundResults
                      .filter((round) => round.totalCandidates > 0)
                      .map((round) => (
                        <tr
                          key={round.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                navigate(`/admin/drive/view/${round.drive_id}`)
                              }
                              className="text-left"
                            >
                              <p className="text-sm font-medium text-gray-800 hover:text-blue-600 truncate max-w-[140px]">
                                {round.drive_title}
                              </p>

                              <p className="text-xs text-gray-400">
                                Round {round.round_order}
                              </p>
                            </button>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                              {round.round_type_display}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-center text-sm font-medium text-gray-700">
                            {round.totalCandidates}
                          </td>

                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-green-600">
                              <CheckCircleIcon className="w-4 h-4" />

                              {round.passed}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
                              <XCircleIcon className="w-4 h-4" />

                              {round.failed}
                            </span>
                          </td>

                          <td className="px-3 py-3 text-center">
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700">
                              {round.passRate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <TrophyIcon className="w-12 h-12 text-gray-300 mb-3" />

                  <p className="text-sm font-medium text-gray-500">
                    No round results available yet
                  </p>

                  <p className="text-xs text-gray-400 mt-1 max-w-[250px]">
                    Results will appear here once candidates complete the
                    rounds.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          RECENT DRIVES
      ===================================================== */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Recent Drives
            </h2>

            <p className="text-sm text-gray-500">
              Latest placement drives created
            </p>
          </div>

          <button
            onClick={() => navigate("/admin/drive")}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View All →
          </button>
        </div>

        <div className="overflow-x-auto">
          {recentDrives.length > 0 ? (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Title
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Job Role
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Institute
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {recentDrives.map((drive) => (
                  <tr
                    key={drive.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {drive.title?.charAt(0) || "D"}
                        </div>

                        <span className="text-sm font-medium text-gray-800">
                          {drive.title}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {drive.job_role || "N/A"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {drive.institute_details?.name ||
                        drive.institute_name ||
                        "N/A"}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {drive.drive_date_time
                        ? new Date(drive.drive_date_time).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${getStatusBadge(
                          drive.status,
                        )}`}
                      >
                        {drive.status?.replace("_", " ") || "Draft"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          navigate(`/admin/drive/view/${drive.id}`)
                        }
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-16 text-center text-gray-500">
              No drives available.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}