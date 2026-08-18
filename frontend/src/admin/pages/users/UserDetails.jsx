// admin/pages/users/UserDetails.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaCalendarAlt,
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
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaExternalLinkAlt,
  FaEye,
  FaLink,
  FaFileAlt,
  FaImage,
  FaUniversity,
  FaStar,
  FaAward,
  FaInfoCircle,
  FaDownload,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api, { authHeader } from "../../../configuration/api";

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [driveAttempts, setDriveAttempts] = useState([]);
  const [loadingDrives, setLoadingDrives] = useState(false);

  useEffect(() => {
    fetchUserDetails();
    fetchUserDriveAttempts();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/canadmin/get-admin-user-details/${id}/`,
        authHeader(),
      );
      if (response.data.success) {
        setUserData(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load user details");
        navigate("/admin/users");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load user details",
      );
      navigate("/admin/users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDriveAttempts = async () => {
    try {
      setLoadingDrives(true);
      const response = await api.get(
        `/canadmin/get-user-drive-attempts/${id}/`,
        authHeader(),
      );
      if (response.data.success) {
        setDriveAttempts(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load drive attempts:", error);
    } finally {
      setLoadingDrives(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
      active: "bg-green-50 text-green-700 border-green-200",
      completed: "bg-blue-50 text-blue-700 border-blue-200",
      cancelled: "bg-gray-50 text-gray-700 border-gray-200",
      draft: "bg-gray-50 text-gray-700 border-gray-200",
      published: "bg-blue-50 text-blue-700 border-blue-200",
      in_progress: "bg-purple-50 text-purple-700 border-purple-200",
      passed: "bg-green-50 text-green-700 border-green-200",
      failed: "bg-red-50 text-red-700 border-red-200",
      shortlisted: "bg-green-50 text-green-700 border-green-200",
      rejected: "bg-red-50 text-red-700 border-red-200",
    };
    return colors[status] || "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getRoundLabel = (roundType) => {
    const labels = {
      aptitude: "Aptitude",
      coding: "Coding",
      gd: "GD",
      technical: "Tech",
      hr: "HR",
    };
    return labels[roundType] || "Round";
  };

  const renderTechnologies = (technologies) => {
    if (!technologies) return null;
    if (Array.isArray(technologies)) return technologies;
    if (typeof technologies === "string") {
      return technologies
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
    }
    return [];
  };

  const handleViewResult = (e, roundType, roundId, attemptId) => {
    e.stopPropagation();
    e.preventDefault();

    if (!attemptId) {
      toast.error("Attempt ID is missing. Cannot view result.");
      return;
    }

    if (roundType === "aptitude") {
      navigate(`/admin/aptitude-round/${roundId}/result/${attemptId}`);
    } else if (roundType === "coding") {
      navigate(`/admin/coding-round/${roundId}/result/${attemptId}`);
    } else {
      toast.info(
        "Detailed results are only available for aptitude and coding rounds",
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!userData) return null;

  const {
    user,
    profile,
    educations,
    experiences,
    skills,
    projects,
    languages,
    certificates,
  } = userData;
  const profilePicture = profile?.profile_picture || null;

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-10">
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/users")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <FaArrowLeft size={12} />
        Back to Users
      </button>

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt={user.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-blue-100"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML = `
                      <div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                        ${getInitials(user.name)}
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                  {getInitials(user.name)}
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.name}
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex flex-wrap gap-4 mt-1.5 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <FaEnvelope size={12} />
                  {user.email}
                </span>
                {profile?.phone && (
                  <span className="flex items-center gap-1.5">
                    <FaPhone size={12} />
                    {profile.phone}
                  </span>
                )}
                {profile?.location && (
                  <span className="flex items-center gap-1.5">
                    <FaMapMarkerAlt size={12} />
                    {profile.location}
                  </span>
                )}
                {user.date_of_birth && (
                  <span className="flex items-center gap-1.5">
                    <FaBirthdayCake size={12} />
                    {formatDate(user.date_of_birth)}
                  </span>
                )}
              </div>

              {profile?.about && (
                <p className="mt-3 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  {profile.about}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info & Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Personal Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <FaUser className="text-blue-500" size={14} />
            <h4 className="font-medium text-gray-900">Personal Information</h4>
          </div>
          <div className="p-5 space-y-2.5 text-sm">
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">User ID</span>
              <span className="font-medium text-gray-900">
                #{String(user.id).padStart(4, "0")}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Role</span>
              <span className="font-medium text-gray-900 capitalize">
                {user.role || "Candidate"}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Joined</span>
              <span className="font-medium text-gray-900">
                {formatDate(user.created_at)}
              </span>
            </div>
            {user.date_of_birth && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Date of Birth</span>
                <span className="font-medium text-gray-900">
                  {formatDate(user.date_of_birth)}
                </span>
              </div>
            )}
            {profile?.gender && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Gender</span>
                <span className="font-medium text-gray-900">
                  {profile.gender}
                </span>
              </div>
            )}
            {profile?.nationality && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Nationality</span>
                <span className="font-medium text-gray-900">
                  {profile.nationality}
                </span>
              </div>
            )}

            {/* Resume */}
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500 flex items-center gap-2">
                Resume
              </span>
              {profile?.resume ? (
                <a
                  href={profile.resume}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1.5"
                >
                  View Resume
                </a>
              ) : (
                <span className="text-gray-400 text-sm">Not uploaded</span>
              )}
            </div>

            {/* Profile Picture */}
            <div className="flex justify-between py-1.5">
              <span className="text-gray-500 flex items-center gap-2">
                Profile Picture
              </span>
              {profile?.profile_picture ? (
                <a
                  href={profile.profile_picture}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-1.5"
                >
                  View Profile Picture
                </a>
              ) : (
                <span className="text-gray-400 text-sm">Not uploaded</span>
              )}
            </div>
          </div>
        </div>

        {/* Contact & Address */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
            <FaMapMarkerAlt className="text-green-500" size={14} />
            <h4 className="font-medium text-gray-900">Contact & Address</h4>
          </div>
          <div className="p-5 space-y-2.5 text-sm">
            {profile?.phone && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Phone</span>
                <span className="font-medium text-gray-900">
                  {profile.phone}
                </span>
              </div>
            )}
            <div className="flex justify-between py-1.5 border-b border-gray-50">
              <span className="text-gray-500">Email</span>
              <span className="font-medium text-gray-900">{user.email}</span>
            </div>
            {profile?.address && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Address</span>
                <span className="font-medium text-gray-900 text-right max-w-[60%]">
                  {profile.address}
                </span>
              </div>
            )}
            {profile?.city && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">City</span>
                <span className="font-medium text-gray-900">
                  {profile.city}
                </span>
              </div>
            )}
            {profile?.state && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">State</span>
                <span className="font-medium text-gray-900">
                  {profile.state}
                </span>
              </div>
            )}
            {profile?.country && (
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">Country</span>
                <span className="font-medium text-gray-900">
                  {profile.country}
                </span>
              </div>
            )}
            {profile?.zip_code && (
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Zip Code</span>
                <span className="font-medium text-gray-900">
                  {profile.zip_code}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Education */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaGraduationCap className="text-blue-500" size={14} />
              <h4 className="font-medium text-gray-900">Education</h4>
            </div>
            <span className="text-xs bg-gray-100 px-2.5 py-0.5 rounded-full text-gray-600">
              {educations?.length || 0}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {educations?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No education records
              </p>
            ) : (
              educations.map((edu) => (
                <div
                  key={edu.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-blue-200 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900">
                        {edu.degree}
                      </h5>
                      <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                        <FaUniversity size={12} className="text-gray-400" />
                        {edu.institute}
                      </p>
                      {edu.field && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {edu.field}
                        </p>
                      )}
                      {edu.description && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {edu.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {edu.start_year} -{" "}
                        {edu.is_current ? "Present" : edu.end_year}
                      </span>
                      <p className="text-sm font-medium text-blue-600 mt-0.5">
                        {edu.marks} ({edu.evaluation_format})
                      </p>
                    </div>
                  </div>
                  {edu.degree_image && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <a
                        href={edu.degree_image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <FaExternalLinkAlt size={10} />
                        View Certificate
                      </a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Experience */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaBriefcase className="text-purple-500" size={14} />
              <h4 className="font-medium text-gray-900">Experience</h4>
            </div>
            <span className="text-xs bg-gray-100 px-2.5 py-0.5 rounded-full text-gray-600">
              {experiences?.length || 0}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {experiences?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No experience records
              </p>
            ) : (
              experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-purple-200 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900">
                        {exp.position}
                      </h5>
                      <p className="text-sm text-gray-600">{exp.company}</p>
                      {exp.location && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <FaMapMarkerAlt size={10} />
                          {exp.location}
                        </p>
                      )}
                      {exp.description && (
                        <p className="text-xs text-gray-500 mt-1 italic">
                          {exp.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          exp.is_current
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {exp.is_current ? "Current" : "Past"}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {exp.start_year} -{" "}
                        {exp.is_current ? "Present" : exp.end_year}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Skills */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaStar className="text-yellow-500" size={14} />
              <h4 className="font-medium text-gray-900">Skills</h4>
            </div>
            <span className="text-xs bg-gray-100 px-2.5 py-0.5 rounded-full text-gray-600">
              {skills?.length || 0}
            </span>
          </div>
          <div className="p-4">
            {skills?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No skills
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <div
                    key={skill.id}
                    className="bg-gray-100 rounded-lg px-3 py-2 hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {skill.name}
                    </span>
                    <span className="text-xs text-gray-500 ml-1.5">
                      ({skill.level})
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCode className="text-green-500" size={14} />
              <h4 className="font-medium text-gray-900">Projects</h4>
            </div>
            <span className="text-xs bg-gray-100 px-2.5 py-0.5 rounded-full text-gray-600">
              {projects?.length || 0}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {projects?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No projects
              </p>
            ) : (
              projects.map((project) => {
                const techArray = renderTechnologies(project.technologies);
                return (
                  <div
                    key={project.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-green-200 transition-colors"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900">
                          {project.title}
                        </h5>
                        {project.description && (
                          <p className="text-sm text-gray-600 mt-0.5">
                            {project.description}
                          </p>
                        )}
                        {project.link && (
                          <a
                            href={project.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1"
                          >
                            <FaLink size={10} />
                            {project.link
                              .replace(/^https?:\/\//, "")
                              .replace(/\/$/, "")}
                          </a>
                        )}
                        {techArray && techArray.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {techArray.map((tech, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-white text-xs text-gray-600 rounded border border-gray-200"
                              >
                                {tech.trim()}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs text-gray-500">
                          {formatDate(project.start_month_year)} -{" "}
                          {formatDate(project.end_month_year)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Languages */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaLanguage className="text-orange-500" size={14} />
              <h4 className="font-medium text-gray-900">Languages</h4>
            </div>
            <span className="text-xs bg-gray-100 px-2.5 py-0.5 rounded-full text-gray-600">
              {languages?.length || 0}
            </span>
          </div>
          <div className="p-4 space-y-2.5">
            {languages?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No languages
              </p>
            ) : (
              languages.map((lang) => (
                <div
                  key={lang.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="font-medium text-gray-700">{lang.name}</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lang.proficiency === "Native"
                        ? "bg-green-100 text-green-700"
                        : lang.proficiency === "Fluent"
                          ? "bg-blue-100 text-blue-700"
                          : lang.proficiency === "Advanced"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {lang.proficiency}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Certificates */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaAward className="text-yellow-500" size={14} />
              <h4 className="font-medium text-gray-900">Certificates</h4>
            </div>
            <span className="text-xs bg-gray-100 px-2.5 py-0.5 rounded-full text-gray-600">
              {certificates?.length || 0}
            </span>
          </div>
          <div className="p-4 space-y-3">
            {certificates?.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No certificates
              </p>
            ) : (
              certificates.map((cert) => (
                <div
                  key={cert.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-yellow-200 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className="font-semibold text-gray-900">
                        {cert.name}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {cert.issuer || cert.issue_org}
                      </p>
                      {cert.issue_month_year && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          <FaCalendarAlt size={10} className="inline mr-1" />
                          {formatDate(cert.issue_month_year)}
                        </p>
                      )}
                    </div>
                    {cert.link && (
                      <a
                        href={cert.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1 flex-shrink-0"
                      >
                        <FaExternalLinkAlt size={10} />
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Drive Attempts */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FaBuilding className="text-purple-500" size={16} />
            Drive Attempts
          </h3>
          <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600">
            {driveAttempts.length} Drives
          </span>
        </div>
        <div className="p-4">
          {loadingDrives ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            </div>
          ) : driveAttempts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              No drive attempts
            </p>
          ) : (
            <div className="space-y-4">
              {driveAttempts.map((drive) => (
                <div
                  key={drive.drive_id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  {/* Drive Header */}
                  <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-sm font-medium">
                        #{drive.drive_id}
                      </span>
                      <span className="font-semibold text-gray-900">
                        {drive.drive_title}
                      </span>
                      <span className="text-xs text-gray-500">
                        {drive.job_role}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-gray-500">
                        {formatDateTime(drive.drive_date_time)}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(drive.drive_status)}`}
                      >
                        {drive.drive_status?.replace("_", " ")}
                      </span>
                    </div>
                  </div>

                  {/* Rounds */}
                  <div className="divide-y divide-gray-100">
                    {drive.rounds.map((round) => {
                      const hasAttempt =
                        round.attempt_id != null &&
                        round.attempt_id !== undefined;
                      const isNotInProgress =
                        round.attempt_status &&
                        round.attempt_status !== "in_progress";
                      const isAptitudeOrCoding =
                        round.round_type === "aptitude" ||
                        round.round_type === "coding";
                      const canViewResult =
                        hasAttempt && isNotInProgress && isAptitudeOrCoding;

                      return (
                        <div
                          key={round.round_id}
                          className={`px-4 py-2.5 flex items-center justify-between transition-colors ${
                            canViewResult
                              ? "hover:bg-blue-50 cursor-pointer"
                              : "hover:bg-gray-50"
                          }`}
                          onClick={(e) => {
                            if (canViewResult) {
                              handleViewResult(
                                e,
                                round.round_type,
                                round.round_id,
                                round.attempt_id,
                              );
                            }
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium text-gray-900">
                                  Round {round.round_order}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {round.round_type_display}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(round.round_status)}`}
                                >
                                  {round.round_status}
                                </span>
                              </div>
                              <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                                {round.started_at && (
                                  <span>
                                    Started: {formatDateTime(round.started_at)}
                                  </span>
                                )}
                                {round.submitted_at && (
                                  <span>
                                    Submitted:{" "}
                                    {formatDateTime(round.submitted_at)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            {round.attempt_status &&
                              round.attempt_status !== "in_progress" && (
                                <div className="text-sm">
                                  <span className="text-gray-600">
                                    {round.score || 0}/{round.total_marks || 0}
                                  </span>
                                  <span className="text-blue-600 font-medium ml-1">
                                    ({round.percentage || 0}%)
                                  </span>
                                </div>
                              )}
                            {round.decision && (
                              <div className="flex items-center gap-1 justify-end text-sm mt-0.5">
                                {round.decision.decision === "shortlisted" ||
                                round.decision.decision === "passed" ? (
                                  <FaCheckCircle
                                    className="text-green-500"
                                    size={12}
                                  />
                                ) : round.decision.decision === "rejected" ||
                                  round.decision.decision === "failed" ? (
                                  <FaTimesCircle
                                    className="text-red-500"
                                    size={12}
                                  />
                                ) : (
                                  <FaClock
                                    className="text-yellow-500"
                                    size={12}
                                  />
                                )}
                                <span
                                  className={`font-medium ${
                                    round.decision.decision === "shortlisted" ||
                                    round.decision.decision === "passed"
                                      ? "text-green-600"
                                      : round.decision.decision ===
                                            "rejected" ||
                                          round.decision.decision === "failed"
                                        ? "text-red-600"
                                        : "text-yellow-600"
                                  }`}
                                >
                                  {round.decision.decision || "Pending"}
                                </span>
                              </div>
                            )}
                            {round.coding_submission && (
                              <div className="text-xs text-gray-400 mt-0.5">
                                {round.coding_submission.attempted_questions ||
                                  0}
                                /{round.coding_submission.total_questions || 0}{" "}
                                solved
                                {round.coding_submission.status ===
                                  "evaluated" && " Evaluated"}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}