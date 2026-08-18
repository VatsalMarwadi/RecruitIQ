import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Loader } from '../components/Loader';
import api from '../../configuration/api';

export const Projects = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    technologies: '', 
    link: '', 
    start_month_year: '', 
    end_month_year: ''
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await api.get('/candidate/get-project/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (error) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        technologies: formData.technologies.split(',').map(t => t.trim()).filter(Boolean),
        link: formData.link.trim() || '',
        start_month_year: formData.start_month_year ? `${formData.start_month_year}-01` : null,
        end_month_year: formData.end_month_year ? `${formData.end_month_year}-01` : null,
      };

      if (editingId) {
        payload.id = editingId;
      }

      const res = await api.post('/candidate/add-update-project/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        toast.success(res.data.message || 'Project saved successfully');
        resetForm();
        fetchProjects();
      } else {
        if (res.data.errors) {
          const errors = res.data.errors;
          const errorMessages = Object.values(errors).flat();
          toast.error(errorMessages.join(', '));
        } else {
          toast.error(res.data.message || 'Failed to save project');
        }
      }
    } catch (error) {
      console.error('Error saving project:', error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorMessages = Object.values(errors).flat();
        toast.error(errorMessages.join(', '));
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to save project');
      }
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      technologies: '',
      link: '',
      start_month_year: '',
      end_month_year: ''
    });
    setEditingId(null);
  };

  const handleEdit = (item) => {
    const formatDateForInput = (dateStr) => {
      if (!dateStr) return '';
      return dateStr.substring(0, 7);
    };

    setFormData({
      title: item.title || '',
      description: item.description || '',
      technologies: item.technologies?.join(', ') || '',
      link: item.link || '',
      start_month_year: formatDateForInput(item.start_month_year),
      end_month_year: formatDateForInput(item.end_month_year),
    });
    setEditingId(item.id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await api.delete(`/candidate/delete-project/${id}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        toast.success('Deleted successfully');
        if (editingId === id) {
          resetForm();
        }
        fetchProjects();
      } else {
        toast.error(res.data.message || 'Failed to delete');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  if (loading) return <Loader />;

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Projects</h2>
          <span className="text-sm text-gray-500">{projects.length} projects</span>
        </div>

        {/* Projects List */}
        <div className="space-y-3 mb-6">
          {projects.map((proj) => (
            <div key={proj.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-semibold text-gray-900">{proj.title}</h4>
                  <span className="text-xs text-gray-400">•</span>
                  <p className="text-sm text-gray-600">{proj.technologies?.join(', ')}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  <p className="text-xs text-gray-500">
                    {formatDisplayDate(proj.start_month_year) || '?'} - {formatDisplayDate(proj.end_month_year) || 'Present'}
                  </p>
                  {proj.link && (
                    <a 
                      href={proj.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Project Link
                    </a>
                  )}
                </div>
                {proj.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{proj.description}</p>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button 
                  onClick={() => handleEdit(proj)} 
                  className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(proj.id)} 
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {projects.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No projects added</p>
              <p className="text-sm">Add your projects below</p>
            </div>
          )}
        </div>

        {/* Add/Edit Form */}
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-medium text-gray-900 mb-4">{editingId ? 'Edit' : 'Add'} Project</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
              <input 
                type="text" 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder="E-Commerce Website" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                placeholder="Describe your project, its purpose, and your role..." 
                rows="3" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technologies</label>
              <input 
                type="text" 
                name="technologies" 
                value={formData.technologies} 
                onChange={handleChange} 
                placeholder="React, Node.js, MongoDB" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Link</label>
              <input 
                type="url" 
                name="link" 
                value={formData.link} 
                onChange={handleChange} 
                placeholder="https://github.com/yourproject" 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input 
                type="month" 
                name="start_month_year" 
                value={formData.start_month_year} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input 
                type="month" 
                name="end_month_year" 
                value={formData.end_month_year} 
                onChange={handleChange} 
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
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