import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { 
  FaBriefcase, 
  FaUser, 
  FaClipboardCheck,
  FaArrowRight,
  FaCalendarAlt,
  FaBuilding,
  FaClock,
  FaRocket,
  FaTrophy,
  FaPlay,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaChevronDown,
  FaChevronRight
} from "react-icons/fa";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import api from "../configuration/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const [institute, setInstitute] = useState(null);
  const [stats, setStats] = useState({
    totalDrives: 0,
    attemptedDrives: 0,
    completedRounds: 0,
    upcomingRounds: 0
  });
  const [nextAssessment, setNextAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [showProfileWarning, setShowProfileWarning] = useState(false);
  const [driveResults, setDriveResults] = useState([]);
  const [expandedDrives, setExpandedDrives] = useState({});

  const isDashboardRoute = location.pathname === "/candidate/dashboard" || 
                           location.pathname === "/candidate/";

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      if (parsedUser.institute) {
        setInstitute(parsedUser.institute);
      }
    }
    fetchDashboardData();
  }, []);

  const toggleDriveExpand = (driveId) => {
    setExpandedDrives(prev => ({
      ...prev,
      [driveId]: !prev[driveId]
    }));
  };

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Fetch available drives for the institute
      const drivesRes = await api.get("/candidate/get-available-drives/", {
        headers: { Authorization: `Bearer ${token}` }
      });

      let totalDrives = 0;
      let attemptedDrivesCount = 0;
      let completedRoundsCount = 0;
      let upcomingRoundsCount = 0;
      let nextAssessmentData = null;
      let resultsByDrive = {};

      if (drivesRes.data.success) {
        const availableDrives = drivesRes.data.data || [];
        totalDrives = availableDrives.length;
        
        // For each drive, check if user has attempts
        for (const drive of availableDrives) {
          try {
            const roundStatusRes = await api.get(`/candidate/get-candidate-round-status/${drive.id}/`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (roundStatusRes.data.success) {
              const rounds = roundStatusRes.data.data?.rounds || [];
              const hasAttempt = rounds.some(r => r.attempt_status || r.final_status !== "Not Started");
              
              if (hasAttempt) {
                attemptedDrivesCount++;
                
                // Check for in-progress rounds
                const inProgressRounds = rounds.filter(r => r.final_status === "In Progress");
                const completedRoundsList = rounds.filter(r => 
                  r.final_status === "Passed" || 
                  r.final_status === "Failed" || 
                  r.final_status === "Evaluated" ||
                  r.final_status === "Submitted - Awaiting Evaluation"
                );
                
                completedRoundsCount += completedRoundsList.length;
                upcomingRoundsCount += inProgressRounds.length;
                
                if (inProgressRounds.length > 0 && !nextAssessmentData) {
                  const inProgressRound = inProgressRounds[0];
                  nextAssessmentData = {
                    driveTitle: drive.title,
                    driveId: drive.id,
                    roundType: inProgressRound.round_type_display || inProgressRound.round_type,
                    roundId: inProgressRound.round_id,
                    attemptId: inProgressRound.attempt_id,
                    status: "in_progress"
                  };
                }

                // Collect results grouped by drive
                if (completedRoundsList.length > 0) {
                  const driveResultsList = completedRoundsList.map(round => ({
                    roundId: round.round_id,
                    roundType: round.round_type_display || round.round_type,
                    roundOrder: round.round_order,
                    status: round.final_status,
                    score: round.attempt_score || round.score,
                    totalMarks: round.attempt_total_marks || round.total_marks,
                    percentage: round.attempt_percentage || round.percentage,
                    decision: round.decision?.decision || null,
                    isPassed: round.final_status === "Passed" || round.decision?.decision === "shortlisted",
                    startedAt: round.started_at,
                    submittedAt: round.submitted_at
                  }));

                  resultsByDrive[drive.id] = {
                    driveId: drive.id,
                    driveTitle: drive.title,
                    jobRole: drive.job_role,
                    ctc: drive.ctc,
                    rounds: driveResultsList
                  };
                }
              }
            }
          } catch (error) {
            console.error(`Error fetching round status for drive ${drive.id}:`, error);
          }
        }
        
        // Convert to array and sort by drive with most recent first
        const sortedDrives = Object.values(resultsByDrive).sort((a, b) => {
          const aLatest = a.rounds.reduce((max, r) => r.submittedAt > max ? r.submittedAt : max, '');
          const bLatest = b.rounds.reduce((max, r) => r.submittedAt > max ? r.submittedAt : max, '');
          return bLatest.localeCompare(aLatest);
        });
        
        setDriveResults(sortedDrives);
        
        // Auto-expand first drive if any
        if (sortedDrives.length > 0) {
          setExpandedDrives({ [sortedDrives[0].driveId]: true });
        }
      }

      setStats({
        totalDrives: totalDrives,
        attemptedDrives: attemptedDrivesCount,
        completedRounds: completedRoundsCount,
        upcomingRounds: upcomingRoundsCount
      });

      setNextAssessment(nextAssessmentData);

      // Fetch profile data
      try {
        const profileRes = await api.get("/candidate/get-candidate-profile/", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileRes.data.success) {
          setProfileData(profileRes.data.data);
          setShowProfileWarning(false);
        }
      } catch (profileError) {
        if (profileError.response?.status === 404) {
          setShowProfileWarning(true);
          setProfileData(null);
        }
      }

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case "Passed":
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full"><FaCheckCircle className="w-3 h-3" /> Passed</span>;
      case "Failed":
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2.5 py-1 rounded-full"><FaTimesCircle className="w-3 h-3" /> Failed</span>;
      case "Evaluated":
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full"><FaCheckCircle className="w-3 h-3" /> Evaluated</span>;
      case "Submitted - Awaiting Evaluation":
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full"><FaHourglassHalf className="w-3 h-3" /> Pending Evaluation</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar toggleSidebar={toggleSidebar} user={user} />
        <Sidebar isOpen={isSidebarOpen} />
        <main className={`pt-16 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"}`}>
          <div className="p-6 min-h-[calc(100vh-64px)] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar toggleSidebar={toggleSidebar} user={user} />
      <Sidebar isOpen={isSidebarOpen} />
      
      <main 
        className={`pt-16 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <div className="p-6 min-h-[calc(100vh-64px)]">
          {isDashboardRoute ? (
            <>
              {/* ============================================================ */}
              {/* Profile Section */}
              {/* ============================================================ */}
              <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-xl flex-shrink-0">
                    {user?.name?.charAt(0)?.toUpperCase() || "C"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {getGreeting()}, {user?.name || "Candidate"}
                        </h2>
                        <p className="text-gray-500 text-sm">{user?.email}</p>
                        {institute && (
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                            <FaBuilding className="text-gray-400" />
                            <span>{typeof institute === 'object' ? institute.name : institute || "Your Institute"}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs font-medium ${profileData ? 'text-green-600' : 'text-yellow-600'}`}>
                            {profileData ? 'Profile Complete' : 'Profile Incomplete'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/candidate/profile")}
                        className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-lg transition-colors"
                      >
                        {profileData ? 'Update Profile' : 'Create Profile'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Warning */}
              {showProfileWarning && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
                  <FaExclamationTriangle className="text-yellow-600 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-800">Complete Your Profile</h4>
                    <p className="text-sm text-yellow-700">
                      Complete your profile to increase your chances of getting shortlisted.
                    </p>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* Statistics Cards */}
              {/* ============================================================ */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                      <FaBriefcase className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Drives</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalDrives}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                      <FaRocket className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Drives Attempted</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.attemptedDrives}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                      <FaTrophy className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Completed Rounds</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completedRounds}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-yellow-50 flex items-center justify-center text-yellow-600">
                      <FaClock className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Upcoming Rounds</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.upcomingRounds}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ============================================================ */}
              {/* Next Assessment */}
              {/* ============================================================ */}
              {nextAssessment && (
                <div className="mb-8">
                  <h3 className="font-semibold text-gray-900 mb-4">Next Assessment</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="flex items-start md:items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <FaPlay className="text-blue-600 text-xl" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{nextAssessment.driveTitle}</h4>
                          <p className="text-sm text-gray-600">{nextAssessment.roundType}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                              In Progress
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/candidate/assessments/${nextAssessment.driveId}`)}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Continue Assessment
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================ */}
              {/* Results - List Format Grouped by Drive */}
              {/* ============================================================ */}
              {driveResults.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Your Results</h3>
                  <div className="space-y-4">
                    {driveResults.map((drive) => (
                      <div key={drive.driveId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Drive Header - Clickable to expand */}
                        <div 
                          className="p-4 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-between"
                          onClick={() => toggleDriveExpand(drive.driveId)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-gray-400">
                              {expandedDrives[drive.driveId] ? 
                                <FaChevronDown className="w-4 h-4" /> : 
                                <FaChevronRight className="w-4 h-4" />
                              }
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{drive.driveTitle}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                {drive.jobRole && <span>{drive.jobRole}</span>}
                                {drive.ctc && <span>• CTC: {drive.ctc}</span>}
                                <span>• {drive.rounds.length} round{drive.rounds.length > 1 ? 's' : ''} completed</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {drive.rounds.some(r => r.isPassed) && (
                              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                Shortlisted
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Round Results - Expanded */}
                        {expandedDrives[drive.driveId] && (
                          <div className="border-t border-gray-100">
                            {drive.rounds.map((round, index) => (
                              <div 
                                key={round.roundId} 
                                className={`p-4 ${
                                  index !== drive.rounds.length - 1 ? 'border-b border-gray-100' : ''
                                } ${round.isPassed ? 'bg-green-50/30' : ''}`}
                              >
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-3">
                                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                                      {round.roundOrder}
                                    </span>
                                    <div>
                                      <p className="font-medium text-gray-800">{round.roundType}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {getStatusBadge(round.status)}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    {round.score !== undefined && round.totalMarks && (
                                      <>
                                        <p className="text-sm font-medium text-gray-700">
                                          Score: <span className="font-semibold">{round.score}</span> / {round.totalMarks}
                                        </p>
                                        {round.percentage !== undefined && (
                                          <p className="text-sm text-gray-500">
                                            {round.percentage}%
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Show message when no drives are available */}
              {stats.totalDrives === 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaBriefcase className="text-gray-400 text-3xl" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">No Drives Available</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    There are no drives available for your institute right now.
                  </p>
                  <p className="text-gray-400 text-sm">Check back later for new opportunities.</p>
                </div>
              )}

              {/* Show message when no results */}
              {stats.totalDrives > 0 && driveResults.length === 0 && stats.attemptedDrives > 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaTrophy className="text-gray-400 text-3xl" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-700">No Results Yet</h4>
                  <p className="text-sm text-gray-500">Your assessment results will appear here once completed.</p>
                  <p className="text-xs text-gray-400 mt-1">You have {stats.upcomingRounds} upcoming round{stats.upcomingRounds > 1 ? 's' : ''} to complete.</p>
                </div>
              )}

              {/* Show message when no drives attempted */}
              {stats.totalDrives > 0 && stats.attemptedDrives === 0 && (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaRocket className="text-gray-400 text-3xl" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-700">Start Your Journey</h4>
                  <p className="text-sm text-gray-500">You have not applied to any drives yet.</p>
                  <button
                    onClick={() => navigate("/candidate/drive")}
                    className="mt-3 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    View Available Drives
                  </button>
                </div>
              )}
            </>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;