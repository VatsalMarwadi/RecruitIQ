import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader } from '../components/Loader';
import api from '../../configuration/api';

export const Experience = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [experience, setExperience] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    company: '', position: '', location: '', start_year: '', end_year: '', is_current: false, description: ''
  });

  useEffect(() => {
    fetchExperience();
  }, []);

  const fetchExperience = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/candidate/get-experience/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setExperience(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load experience');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async () => {
    if (!formData.company || !formData.position) {
      toast.error('Company and Position are required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = { ...formData, id: editingId };
      await api.post('/candidate/add-update-experience/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Experience saved successfully');
      setFormData({ company: '', position: '', location: '', start_year: '', end_year: '', is_current: false, description: '' });
      setEditingId(null);
      fetchExperience();
    } catch (error) {
      toast.error('Failed to save experience');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this experience record?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/candidate/delete-experience/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted successfully');
      fetchExperience();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Work Experience</h2>
          <span className="text-sm text-gray-500">{experience.length} records</span>
        </div>

        {/* Experience List */}
        <div className="space-y-3 mb-6">
          {experience.map((exp) => (
            <div key={exp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-sm text-gray-600">{exp.company}</p>
                  {exp.is_current && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Current</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {exp.location && <p className="text-xs text-gray-500">{exp.location}</p>}
                  <p className="text-xs text-gray-500">{exp.start_year || '?'} - {exp.is_current ? 'Present' : exp.end_year || '?'}</p>
                </div>
                {exp.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{exp.description}</p>}
              </div>
              <div className="flex gap-2 ml-4">
                <button onClick={() => handleEdit(exp)} className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                  Edit
                </button>
                <button onClick={() => handleDelete(exp.id)} className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {experience.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No experience records added</p>
              <p className="text-sm">Add your work experience below</p>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-4">{editingId ? 'Edit' : 'Add'} Experience</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
              <input type="text" name="company" value={formData.company} onChange={handleChange} placeholder="Google Inc." className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
              <input type="text" name="position" value={formData.position} onChange={handleChange} placeholder="Software Engineer" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="San Francisco, CA" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
              <input type="number" name="start_year" value={formData.start_year} onChange={handleChange} placeholder="2021" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Year</label>
              <input type="number" name="end_year" value={formData.end_year} onChange={handleChange} placeholder="2024" disabled={formData.is_current} className={`w-full px-4 py-2 border border-gray-200 rounded-lg ${formData.is_current ? 'bg-gray-100 cursor-not-allowed' : 'focus:ring-2 focus:ring-blue-500'}`} />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="is_current" checked={formData.is_current} onChange={handleChange} className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-700">Currently working</span>
              </label>
            </div>
            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Describe your responsibilities and achievements..." className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" rows="2" />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {editingId && (
              <button onClick={() => { setFormData({ company: '', position: '', location: '', start_year: '', end_year: '', is_current: false, description: '' }); setEditingId(null); }} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
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