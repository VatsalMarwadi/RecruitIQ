import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader } from '../components/Loader';
import api from '../../configuration/api';

export const Languages = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', proficiency: 'Intermediate' });

  const proficiencies = ['Beginner', 'Intermediate', 'Advanced', 'Fluent', 'Native'];

  useEffect(() => {
    fetchLanguages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/candidate/get-language/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setLanguages(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load languages');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Language name is required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await api.post('/candidate/add-update-language/', { ...formData, id: editingId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Language saved successfully');
      setFormData({ name: '', proficiency: 'Intermediate' });
      setEditingId(null);
      fetchLanguages();
    } catch (error) {
      toast.error('Failed to save language');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this language?')) return;
    try {
      const token = localStorage.getItem('token');
      await api.delete(`/candidate/delete-language/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Deleted successfully');
      fetchLanguages();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const getProficiencyColor = (level) => {
    const colors = { 
      Beginner: 'bg-blue-100 text-blue-700', 
      Intermediate: 'bg-yellow-100 text-yellow-700', 
      Advanced: 'bg-orange-100 text-orange-700', 
      Fluent: 'bg-green-100 text-green-700', 
      Native: 'bg-purple-100 text-purple-700' 
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <Loader />;

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Languages</h2>
          <span className="text-sm text-gray-500">{languages.length} languages</span>
        </div>

        {/* Languages List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {languages.map((lang) => (
            <div key={lang.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">{lang.name}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${getProficiencyColor(lang.proficiency)}`}>{lang.proficiency}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setFormData(lang); setEditingId(lang.id); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => handleDelete(lang.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
          {languages.length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p>No languages added</p>
              <p className="text-sm">Add your languages below</p>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-4">{editingId ? 'Edit' : 'Add'} Language</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Language Name *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g., English, Spanish, French" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="min-w-[150px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency</label>
              <select value={formData.proficiency} onChange={(e) => setFormData(prev => ({ ...prev, proficiency: e.target.value }))} className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                {proficiencies.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              {editingId && (
                <button onClick={() => { setFormData({ name: '', proficiency: 'Intermediate' }); setEditingId(null); }} className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
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
    </div>
  );
};