import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader } from '../components/Loader';
import api from '../../configuration/api';

export const Education = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [education, setEducation] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    degree: '',
    institute: '',
    field: '',
    start_year: '',
    end_year: '',
    is_current: false,
    evaluation_format: '',
    marks: '',
    description: '',
    degree_image: null,
  });

  useEffect(() => {
    fetchEducation();
  }, []);

  const fetchEducation = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/candidate/get-education/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setEducation(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load education');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, degree_image: file }));
    }
  };

  const handleSubmit = async () => {
    if (!formData.degree || !formData.institute) {
      toast.error('Degree and Institute are required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const payload = new FormData();
      
      const fields = {
        degree: formData.degree.trim(),
        institute: formData.institute.trim(),
        field: formData.field.trim() || '',
        start_year: formData.start_year || '',
        end_year: formData.is_current ? '' : (formData.end_year || ''),
        is_current: formData.is_current ? 'true' : 'false',
        evaluation_format: formData.evaluation_format || '',
        marks: formData.marks || '',
        description: formData.description || '',
      };

      Object.keys(fields).forEach(key => {
        if (fields[key] !== undefined && fields[key] !== null) {
          payload.append(key, fields[key]);
        }
      });

      if (editingId) {
        payload.append('id', editingId);
      }

      if (formData.degree_image) {
        payload.append('degree_image', formData.degree_image);
      }

      const res = await api.post('/candidate/add-update-education/', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Education saved successfully');
        resetForm();
        fetchEducation();
      } else {
        if (res.data.errors) {
          const errors = res.data.errors;
          const errorMessages = Object.values(errors).flat();
          toast.error(errorMessages.join(', '));
        } else {
          toast.error(res.data.message || 'Failed to save education');
        }
      }
    } catch (error) {
      console.error('Error saving education:', error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        toast.error(errorMessages.join(', '));
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save education');
      }
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      degree: '',
      institute: '',
      field: '',
      start_year: '',
      end_year: '',
      is_current: false,
      evaluation_format: '',
      marks: '',
      description: '',
      degree_image: null,
    });
    setEditingId(null);
  };

  const handleEdit = (item) => {
    setFormData({
      degree: item.degree || '',
      institute: item.institute || '',
      field: item.field || '',
      start_year: item.start_year || '',
      end_year: item.end_year || '',
      is_current: item.is_current || false,
      evaluation_format: item.evaluation_format || '',
      marks: item.marks || '',
      description: item.description || '',
      degree_image: null,
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this education record?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`/candidate/delete-education/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Deleted successfully');
        if (editingId === id) {
          resetForm();
        }
        fetchEducation();
      } else {
        toast.error(res.data.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Education</h2>
          <span className="text-sm text-gray-500">{education.length} records</span>
        </div>

        {/* Education List */}
        <div className="space-y-3 mb-6">
          {education.map((edu) => (
            <div key={edu.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-sm text-gray-600">{edu.institute}</p>
                  {edu.is_current && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">Current</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {edu.field && <p className="text-xs text-gray-500">Field: {edu.field}</p>}
                  <p className="text-xs text-gray-500">{edu.start_year || '?'} - {edu.is_current ? 'Present' : edu.end_year || '?'}</p>
                  {edu.evaluation_format && edu.marks && (
                    <p className="text-xs text-gray-500">Marks: {edu.marks} ({edu.evaluation_format})</p>
                  )}
                  {edu.degree_image && (
                    <a href={edu.degree_image} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      Certificate
                    </a>
                  )}
                </div>
                {edu.description && (
                  <p className="text-xs text-gray-500 mt-1">{edu.description}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button 
                  onClick={() => handleEdit(edu)} 
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(edu.id)} 
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {education.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No education records added</p>
              <p className="text-sm">Add your education details below</p>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-4">{editingId ? 'Edit' : 'Add'} Education</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Degree *</label>
              <input 
                type="text" 
                name="degree" 
                value={formData.degree} 
                onChange={handleChange} 
                placeholder="B.Sc. Computer Science" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Institute *</label>
              <input 
                type="text" 
                name="institute" 
                value={formData.institute} 
                onChange={handleChange} 
                placeholder="University Name" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
              <input 
                type="text" 
                name="field" 
                value={formData.field} 
                onChange={handleChange} 
                placeholder="Computer Science" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation Format</label>
              <select
                name="evaluation_format"
                value={formData.evaluation_format}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select format</option>
                <option value="Percentage">Percentage</option>
                <option value="CGPA">CGPA</option>
                <option value="GPA">GPA</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks / Grade</label>
              <input 
                type="text" 
                name="marks" 
                value={formData.marks} 
                onChange={handleChange} 
                placeholder="85% or 3.8" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Year</label>
              <input 
                type="number" 
                name="start_year" 
                value={formData.start_year} 
                onChange={handleChange} 
                placeholder="2020" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Year</label>
              <input 
                type="number" 
                name="end_year" 
                value={formData.end_year} 
                onChange={handleChange} 
                placeholder="2024" 
                disabled={formData.is_current} 
                className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  formData.is_current ? 'bg-gray-100 cursor-not-allowed' : ''
                }`} 
              />
            </div>
            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  name="is_current" 
                  checked={formData.is_current} 
                  onChange={handleChange} 
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" 
                />
                <span className="text-sm text-gray-700">Currently studying</span>
              </label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Degree Certificate</label>
              <input 
                type="file" 
                name="degree_image" 
                onChange={handleImageChange} 
                accept="image/*" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 mt-1">Upload degree certificate or diploma (max 5MB)</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Describe your academic achievements, relevant coursework, or any special recognition..." 
                rows="3" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            {editingId && (
              <button 
                onClick={resetForm} 
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
            <button 
              onClick={handleSubmit} 
              disabled={saving} 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                editingId ? 'Update' : 'Add'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};