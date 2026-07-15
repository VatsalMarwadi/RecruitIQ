import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
  FaIdBadge,
  FaUserCheck,
  FaUserTimes,
  FaGraduationCap,
  FaBriefcase,
  FaCode,
  FaLanguage,
  FaCertificate,
  FaPhone,
  FaMapMarkerAlt,
  FaBirthdayCake,
  FaLink,
  FaGithub,
  FaLinkedin,
  FaClock,
  FaMedal,
  FaFilePdf,
  FaDownload,
  FaEye,
  FaExternalLinkAlt,
} from "react-icons/fa";
import { MdEmail, MdLocationOn, MdPhone, MdWork, MdSchool } from "react-icons/md";
import toast from "react-hot-toast";
import api, { authHeader } from "../../configuration/api";

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showResumeModal, setShowResumeModal] = useState(false);

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/canadmin/get-admin-user-details/${id}/`, authHeader());

      if (response.data.success) {
        setUserData(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load user details");
        navigate("/admin/users");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      toast.error(error.response?.data?.message || "Failed to load user details");
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      "from-blue-500 to-blue-600",
      "from-green-500 to-green-600",
      "from-purple-500 to-purple-600",
      "from-pink-500 to-pink-600",
      "from-indigo-500 to-indigo-600",
      "from-teal-500 to-teal-600",
      "from-orange-500 to-orange-600",
      "from-red-500 to-red-600",
    ];
    const index = name?.length ? name.length % colors.length : 0;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-orange-500 opacity-20 animate-pulse"></div>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500 font-medium">Loading user details...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 mb-4">
          <FaUser className="w-10 h-10 text-slate-400" />
        </div>
        <p className="text-slate-600 font-medium">User not found</p>
        <button
          onClick={() => navigate("/admin/users")}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <FaArrowLeft size={14} />
          Back to Users
        </button>
      </div>
    );
  }

  const { user, profile, educations, experiences, skills, projects, languages, certificates } = userData;

  // Check if profile has profile picture or resume
  const hasProfilePicture = profile?.profile_picture;
  const hasResume = profile?.resume;

  // Handle resume download
  const handleDownloadResume = () => {
    if (profile?.resume) {
      window.open(profile.resume, '_blank');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/users")}
        className="group inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl transition-all duration-200 shadow-sm border border-slate-200 hover:shadow-md"
      >
        <FaArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Users</span>
      </button>

      {/* Profile Header Card */}
      <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-sm">
        {/* Background Gradient */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-orange-400 to-orange-500"></div>
        
        <div className="relative px-6 pt-20 pb-6">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 -mt-12">
            {/* Avatar with Profile Picture */}
            <div className="relative group">
              {hasProfilePicture ? (
                <div className="relative">
                  <img
                    src={profile.profile_picture}
                    alt={user.name}
                    className="w-28 h-28 rounded-2xl object-cover shadow-lg ring-4 ring-white"
                  />
                  <div className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <a
                      href={profile.profile_picture}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white text-xs font-medium flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-lg"
                    >
                      <FaEye size={12} /> View
                    </a>
                  </div>
                </div>
              ) : (
                <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${getAvatarColor(user.name)} flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white`}>
                  {getInitials(user.name)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full ${
                  user.is_active
                    ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                    : "bg-red-500 text-white shadow-lg shadow-red-500/30"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? "bg-white" : "bg-white"}`}></span>
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              </div>
              <p className="text-sm text-slate-500 mt-0.5">Candidate ID: #{String(user.id).padStart(4, '0')}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                  <FaEnvelope className="text-slate-400" size={12} />
                  {user.email}
                </span>
                {user.date_of_birth && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                    <FaBirthdayCake className="text-slate-400" size={12} />
                    {formatDate(user.date_of_birth)}
                  </span>
                )}
                {profile?.phone && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                    <FaPhone className="text-slate-400" size={12} />
                    {profile.phone}
                  </span>
                )}
                {profile?.location && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg">
                    <FaMapMarkerAlt className="text-slate-400" size={12} />
                    {profile.location}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-4">
              <div className="text-center bg-slate-50 px-4 py-2 rounded-xl min-w-[70px]">
                <p className="text-xl font-bold text-slate-900">{educations?.length || 0}</p>
                <p className="text-xs text-slate-500">Education</p>
              </div>
              <div className="text-center bg-slate-50 px-4 py-2 rounded-xl min-w-[70px]">
                <p className="text-xl font-bold text-slate-900">{experiences?.length || 0}</p>
                <p className="text-xs text-slate-500">Experience</p>
              </div>
              <div className="text-center bg-slate-50 px-4 py-2 rounded-xl min-w-[70px]">
                <p className="text-xl font-bold text-slate-900">{skills?.length || 0}</p>
                <p className="text-xs text-slate-500">Skills</p>
              </div>
            </div>
          </div>

          {/* Summary */}
          {profile?.summary && (
            <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
              <p className="text-sm text-slate-700 leading-relaxed">{profile.summary}</p>
            </div>
          )}
        </div>
      </div>

      {/* Profile Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FaUser className="text-blue-500" size={16} />
            </div>
            <h3 className="font-semibold text-slate-900">Personal Info</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                <FaIdBadge className="text-slate-400" size={14} />
              </div>
              <div>
                <p className="text-xs text-slate-500">User ID</p>
                <p className="text-sm font-medium text-slate-900">#{String(user.id).padStart(4, '0')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                <FaEnvelope className="text-slate-400" size={14} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-medium text-slate-900 break-all">{user.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                <FaCalendarAlt className="text-slate-400" size={14} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Date of Birth</p>
                <p className="text-sm font-medium text-slate-900">{formatDate(user.date_of_birth)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
              <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                <FaUserCheck className="text-slate-400" size={14} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Role</p>
                <p className="text-sm font-medium text-slate-900 capitalize">{user.role || "Candidate"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <FaIdBadge className="text-purple-500" size={16} />
            </div>
            <h3 className="font-semibold text-slate-900">Profile Details</h3>
          </div>
          {profile ? (
            <div className="space-y-3">
              {profile.phone && (
                <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                    <FaPhone className="text-slate-400" size={14} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-sm font-medium text-slate-900">{profile.phone}</p>
                  </div>
                </div>
              )}
              {profile.location && (
                <div className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                  <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                    <FaMapMarkerAlt className="text-slate-400" size={14} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Location</p>
                    <p className="text-sm font-medium text-slate-900">{profile.location}</p>
                  </div>
                </div>
              )}
              <div className="space-y-2 mt-2">
                {profile.linkedin && (
                  <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-2 p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600">
                    <FaLinkedin size={16} />
                    <span className="text-sm font-medium truncate">LinkedIn Profile</span>
                  </a>
                )}
                {profile.github && (
                  <a href={profile.github} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors text-slate-700">
                    <FaGithub size={16} />
                    <span className="text-sm font-medium truncate">GitHub Profile</span>
                  </a>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors text-green-600">
                    <FaLink size={16} />
                    <span className="text-sm font-medium truncate">Website</span>
                  </a>
                )}
              </div>
              {!profile.phone && !profile.location && !profile.linkedin && !profile.github && !profile.website && (
                <p className="text-sm text-slate-500 text-center py-4">No additional profile details</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">No profile details available</p>
          )}
        </div>

        {/* Documents & Quick Links */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <FaFilePdf className="text-green-500" size={16} />
            </div>
            <h3 className="font-semibold text-slate-900">Documents & Links</h3>
          </div>
          <div className="space-y-3">
            {/* Resume Section */}
            {hasResume ? (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <FaFilePdf className="text-red-500" size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Resume / CV</p>
                      <p className="text-xs text-slate-500">Click to view or download</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => window.open(profile.resume, '_blank')}
                      className="p-2 bg-white hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
                      title="View Resume"
                    >
                      <FaEye className="text-blue-600" size={16} />
                    </button>
                    <button
                      onClick={handleDownloadResume}
                      className="p-2 bg-white hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
                      title="Download Resume"
                    >
                      <FaDownload className="text-green-600" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-200 rounded-lg">
                    <FaFilePdf className="text-slate-400" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">No Resume Uploaded</p>
                    <p className="text-xs text-slate-400">Candidate hasn't uploaded a resume yet</p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Picture Info */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FaUser className="text-purple-500" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Profile Picture</p>
                    <p className="text-xs text-slate-500">
                      {hasProfilePicture ? "Uploaded" : "Not uploaded"}
                    </p>
                  </div>
                </div>
                {hasProfilePicture && (
                  <a
                    href={profile.profile_picture}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-white hover:bg-slate-50 rounded-lg shadow-sm transition-colors"
                    title="View Profile Picture"
                  >
                    <FaExternalLinkAlt className="text-purple-600" size={14} />
                  </a>
                )}
              </div>
            </div>

            {/* Member Info */}
            <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-100/50 rounded-xl">
              <p className="text-xs text-orange-600 font-medium">Member Since</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {user.created_at ? formatDate(user.created_at) : "N/A"}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-xl">
              <p className="text-xs text-slate-500 font-medium">Last Updated</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {user.updated_at ? formatDate(user.updated_at) : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Education Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FaGraduationCap className="text-orange-500" size={18} />
              </div>
              <h3 className="font-semibold text-slate-900">Education</h3>
            </div>
            <span className="px-3 py-1 bg-orange-200 text-orange-700 text-xs font-bold rounded-full">
              {educations?.length || 0}
            </span>
          </div>
        </div>
        <div className="p-6">
          {educations?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No education records found</p>
          ) : (
            <div className="space-y-6">
              {educations.map((edu) => (
                <div key={edu.id} className="relative pl-6 before:absolute before:left-0 before:top-3 before:bottom-0 before:w-0.5 before:bg-orange-200 last:before:hidden">
                  <div className="absolute left-[-6px] top-1 w-3 h-3 rounded-full bg-orange-500 ring-4 ring-orange-100"></div>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{edu.degree}</h4>
                      <p className="text-sm text-slate-600">{edu.institute}</p>
                      <p className="text-xs text-slate-500 mt-1">{edu.field}</p>
                      {edu.description && (
                        <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg">{edu.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-1 min-w-[120px]">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <FaCalendarAlt size={12} />
                        {edu.start_year} - {edu.is_current ? "Present" : edu.end_year}
                      </span>
                      <span className="text-sm font-semibold text-slate-700">
                        {edu.marks} ({edu.evaluation_format})
                      </span>
                      {edu.is_current && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                  {edu.degree_image && (
                    <div className="mt-3">
                      <a
                        href={edu.degree_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 text-xs font-medium rounded-lg transition-colors"
                      >
                        <FaCertificate size={12} />
                        View Certificate
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Experience Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaBriefcase className="text-blue-500" size={18} />
              </div>
              <h3 className="font-semibold text-slate-900">Experience</h3>
            </div>
            <span className="px-3 py-1 bg-blue-200 text-blue-700 text-xs font-bold rounded-full">
              {experiences?.length || 0}
            </span>
          </div>
        </div>
        <div className="p-6">
          {experiences?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No experience records found</p>
          ) : (
            <div className="space-y-6">
              {experiences.map((exp) => (
                <div key={exp.id} className="relative pl-6 before:absolute before:left-0 before:top-3 before:bottom-0 before:w-0.5 before:bg-blue-200 last:before:hidden">
                  <div className="absolute left-[-6px] top-1 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-blue-100"></div>
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{exp.position}</h4>
                      <p className="text-sm text-slate-600">{exp.company}</p>
                      {exp.description && (
                        <p className="text-sm text-slate-600 mt-2 bg-slate-50 p-3 rounded-lg">{exp.description}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-start md:items-end gap-1 min-w-[120px]">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
                        <FaClock size={12} />
                        {exp.start_date ? formatDate(exp.start_date) : "N/A"} -{" "}
                        {exp.is_current ? "Present" : exp.end_date ? formatDate(exp.end_date) : "N/A"}
                      </span>
                      {exp.is_current && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Skills Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FaCode className="text-purple-500" size={18} />
              </div>
              <h3 className="font-semibold text-slate-900">Skills</h3>
            </div>
            <span className="px-3 py-1 bg-purple-200 text-purple-700 text-xs font-bold rounded-full">
              {skills?.length || 0}
            </span>
          </div>
        </div>
        <div className="p-6">
          {skills?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No skills found</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <span
                  key={skill.id}
                  className="px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 text-sm font-medium rounded-lg border border-orange-100 hover:shadow-md transition-shadow"
                >
                  {skill.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCode className="text-green-500" size={18} />
              </div>
              <h3 className="font-semibold text-slate-900">Projects</h3>
            </div>
            <span className="px-3 py-1 bg-green-200 text-green-700 text-xs font-bold rounded-full">
              {projects?.length || 0}
            </span>
          </div>
        </div>
        <div className="p-6">
          {projects?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No projects found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <div key={project.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-slate-900">{project.title}</h4>
                  {project.description && (
                    <p className="text-sm text-slate-600 mt-1">{project.description}</p>
                  )}
                  {project.technologies && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {project.technologies.split(',').map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-white text-slate-600 text-xs rounded-full border border-slate-200"
                        >
                          {tech.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3 mt-3">
                    {project.github_link && (
                      <a
                        href={project.github_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                      >
                        <FaGithub size={12} /> GitHub
                      </a>
                    )}
                    {project.live_link && (
                      <a
                        href={project.live_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                      >
                        <FaLink size={12} /> Live Demo
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Certificates Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaCertificate className="text-yellow-600" size={18} />
              </div>
              <h3 className="font-semibold text-slate-900">Certificates</h3>
            </div>
            <span className="px-3 py-1 bg-yellow-200 text-yellow-700 text-xs font-bold rounded-full">
              {certificates?.length || 0}
            </span>
          </div>
        </div>
        <div className="p-6">
          {certificates?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No certificates found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="p-4 bg-gradient-to-r from-yellow-50/50 to-amber-50/50 rounded-xl border border-yellow-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{cert.name}</h4>
                      <p className="text-sm text-slate-600">{cert.issuer}</p>
                      {cert.description && (
                        <p className="text-xs text-slate-500 mt-1">{cert.description}</p>
                      )}
                    </div>
                    <FaMedal className="text-yellow-500 text-xl flex-shrink-0" />
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-yellow-100">
                    <span className="text-xs text-slate-500">
                      {cert.issue_date ? formatDate(cert.issue_date) : "N/A"}
                      {cert.expiry_date && ` - ${formatDate(cert.expiry_date)}`}
                    </span>
                    {cert.certificate_url && (
                      <a
                        href={cert.certificate_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Languages Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-pink-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <FaLanguage className="text-red-500" size={18} />
              </div>
              <h3 className="font-semibold text-slate-900">Languages</h3>
            </div>
            <span className="px-3 py-1 bg-red-200 text-red-700 text-xs font-bold rounded-full">
              {languages?.length || 0}
            </span>
          </div>
        </div>
        <div className="p-6">
          {languages?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No languages found</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {languages.map((lang) => (
                <div
                  key={lang.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:shadow-md transition-shadow"
                >
                  <span className="font-medium text-slate-900">{lang.name}</span>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                    lang.proficiency === 'Native' ? 'bg-green-100 text-green-700' :
                    lang.proficiency === 'Fluent' ? 'bg-blue-100 text-blue-700' :
                    lang.proficiency === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {lang.proficiency}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDetails;