// pages/CandidateDrive.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FaBriefcase, 
  FaMapMarkerAlt, 
  FaCalendar, 
  FaArrowRight, 
  FaBuilding, 
  FaClock, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaHourglassHalf,
  FaCode,
  FaSpinner
} from 'react-icons/fa';
import Loader from './components/Loader';
import api from '../configuration/api';

export const CandidateDrive = () => {
  const navigate = useNavigate();
  const [drives, setDrives] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDrives();
  }, []);

  const fetchDrives = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/candidate/get-available-drives/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setDrives(res.data.data || []);
      }
    } catch (error) {
      toast.error('Failed to load drives');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-700 border-green-200',
      'published': 'bg-blue-100 text-blue-700 border-blue-200',
      'draft': 'bg-gray-100 text-gray-500 border-gray-200',
      'in_progress': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'completed': 'bg-purple-100 text-purple-700 border-purple-200',
      'cancelled': 'bg-red-100 text-red-700 border-red-200',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-500 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'active': <FaCheckCircle className="w-3 h-3" />,
      'published': <FaCheckCircle className="w-3 h-3" />,
      'draft': <FaHourglassHalf className="w-3 h-3" />,
      'in_progress': <FaHourglassHalf className="w-3 h-3" />,
      'completed': <FaCheckCircle className="w-3 h-3" />,
      'cancelled': <FaTimesCircle className="w-3 h-3" />,
    };
    return icons[status?.toLowerCase()] || null;
  };

  const getStatusLabel = (status) => {
    const labels = {
      'active': 'Active',
      'published': 'Published',
      'draft': 'Draft',
      'in_progress': 'In Progress',
      'completed': 'Completed',
      'cancelled': 'Cancelled',
    };
    return labels[status?.toLowerCase()] || status || 'Draft';
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Available Drives</h1>
            <p className="text-sm text-gray-500 mt-0.5">Browse and apply for available drives</p>
          </div>
          <span className="text-sm text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
            <FaBriefcase className="w-4 h-4 text-gray-400" />
            {drives.length} {drives.length === 1 ? 'drive' : 'drives'}
          </span>
        </div>

        {/* Drives List */}
        {drives.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBriefcase className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No Drives Available</h3>
            <p className="text-sm text-gray-500 mt-1">Check back later for new opportunities</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drives.map((drive) => (
              <div
                key={drive.id}
                onClick={() => navigate(`/candidate/drive/${drive.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all cursor-pointer group hover:border-blue-200"
              >
                {/* Drive Header */}
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 flex-1">
                      {drive.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap flex items-center gap-1 ${getStatusColor(drive.status)}`}>
                      {getStatusIcon(drive.status)}
                      {getStatusLabel(drive.status)}
                    </span>
                  </div>
                  {drive.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{drive.description}</p>
                  )}
                </div>

                {/* Drive Details */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {drive.job_role && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaBriefcase className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{drive.job_role}</span>
                    </div>
                  )}
                  {drive.job_location && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaMapMarkerAlt className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">{drive.job_location}</span>
                    </div>
                  )}
                  {drive.drive_date_time && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FaCalendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{new Date(drive.drive_date_time).toLocaleDateString()}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FaClock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>{drive.total_rounds || 0} {drive.total_rounds === 1 ? 'round' : 'rounds'}</span>
                  </div>
                  {drive.ctc && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 col-span-2">
                      <FaBuilding className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-green-600">{drive.ctc}</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {drive.institute_name && (
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FaBuilding className="w-3 h-3" />
                        {drive.institute_name}
                      </span>
                    )}
                  </div>
                  <span className="text-blue-600 text-sm font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    View Details
                    <FaArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateDrive;