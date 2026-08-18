import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader } from '../components/Loader';
import api from '../../configuration/api';

export const Certifications = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [certifications, setCertifications] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', issuer: '', date: '', link: '' });

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/candidate/get-certificate/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCertifications(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.issuer) {
      toast.error('Name and issuer are required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        issue_org: formData.issuer,
        issue_month_year: formData.date ? `${formData.date}-01` : null,
        id: editingId
      };
      await api.post('/candidate/add-update-certificate/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Certification saved successfully');
      setFormData({ name: '', issuer: '', date: '', link: '' });
      setEditingId(null);
      fetchCertifications();
    } catch (error) {
      toast.error('Failed to save certification');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this certification?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/candidate/delete-certificate/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted successfully');
      fetchCertifications();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Certifications</h2>
          <span className="text-sm text-gray-500">{certifications.length} certifications</span>
        </div>

        {/* Certifications List */}
        <div className="space-y-3 mb-6">
          {certifications.map((cert) => (
            <div key={cert.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-semibold text-gray-900">{cert.name}</h4>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-sm text-gray-600">{cert.issue_org}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <p className="text-xs text-gray-500">
                    {cert.issue_month_year ? new Date(cert.issue_month_year).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                  </p>
                  {cert.link && (
                    <a href={cert.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      Verify
                    </a>
                  )}
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => { setFormData({ ...cert, date: cert.issue_month_year?.slice(0, 7) || '' }); setEditingId(cert.id); }} className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                  Edit
                </button>
                <button onClick={() => handleDelete(cert.id)} className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {certifications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No certifications added</p>
              <p className="text-sm">Add your certifications below</p>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-4">{editingId ? 'Edit' : 'Add'} Certification</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Certification Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="AWS Certified Developer" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Issuing Organization *</label>
              <input type="text" value={formData.issuer} onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))} placeholder="Amazon Web Services" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Obtained</label>
              <input type="month" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credential Link</label>
              <input type="url" value={formData.link} onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))} placeholder="https://credential.net/..." className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {editingId && (
              <button onClick={() => { setFormData({ name: '', issuer: '', date: '', link: '' }); setEditingId(null); }} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            )}
            <button onClick={handleSubmit} disabled={saving} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : editingId ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};