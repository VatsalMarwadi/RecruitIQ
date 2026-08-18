import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { FaUserCircle, FaUpload, FaTrash, FaEye, FaCamera } from 'react-icons/fa';
import { Loader } from '../components/Loader';
import api from '../../configuration/api';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

export const PersonalInfo = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [profileExists, setProfileExists] = useState(false);
  
  // Crop states
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [crop, setCrop] = useState({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10,
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);
  const resumeInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', dateOfBirth: '', gender: '',
    address: '', city: '', state: '', country: '', nationality: '', zipCode: '', about: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const res = await api.get('/candidate/get-candidate-profile/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const data = res.data.data;
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          dateOfBirth: data.date_of_birth || '',
          gender: data.gender || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          country: data.country || '',
          nationality: data.nationality || '',
          zipCode: data.zip_code || '',
          about: data.about || ''
        });
        
        if (data.resume) {
          setResumeUrl(data.resume);
        }
        if (data.profile_picture) {
          setProfileImagePreview(data.profile_picture);
        }
        setProfileExists(true);
      }
    } catch (error) {
      // If profile doesn't exist (404), use localStorage data
      if (error.response?.status === 404) {
        console.log('Profile not found, user can create one');
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        setFormData(prev => ({
          ...prev,
          name: userData.name || '',
          email: userData.email || ''
        }));
        setProfileExists(false);
      } else {
        toast.error('Failed to load profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Handle Profile Image Upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      e.target.value = null;
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropImage(reader.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // Handle Crop
  const getCroppedImage = () => {
    if (!completedCrop || !imageRef.current) return;

    const canvas = document.createElement('canvas');
    const image = imageRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;
    
    const ctx = canvas.getContext('2d');
    
    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'profile-image.jpg', { type: 'image/jpeg' });
        setProfileImage(file);
        const previewUrl = URL.createObjectURL(blob);
        setProfileImagePreview(previewUrl);
        setShowCropModal(false);
        toast.success('Profile image cropped successfully');
      }
    }, 'image/jpeg', 0.9);
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setCropImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Profile image removed');
  };

  // Handle Resume Upload
  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      e.target.value = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Resume should be less than 5MB');
      e.target.value = null;
      return;
    }

    setResumeFile(file);
    toast.success('Resume uploaded successfully');
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeUrl('');
    if (resumeInputRef.current) {
      resumeInputRef.current.value = '';
    }
    toast.success('Resume removed');
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();

      if (formData.phone) formDataToSend.append('phone', formData.phone);
      if (formData.gender) formDataToSend.append('gender', formData.gender);
      if (formData.nationality) formDataToSend.append('nationality', formData.nationality);
      if (formData.address) formDataToSend.append('address', formData.address);
      if (formData.city) formDataToSend.append('city', formData.city);
      if (formData.state) formDataToSend.append('state', formData.state);
      if (formData.country) formDataToSend.append('country', formData.country);
      if (formData.zipCode) formDataToSend.append('zip_code', formData.zipCode);
      if (formData.about) formDataToSend.append('about', formData.about);

      if (profileImage) {
        formDataToSend.append('profile_picture', profileImage);
      }

      if (resumeFile) {
        formDataToSend.append('resume', resumeFile);
      }

      const res = await api.put('/candidate/update-candidate-profile/', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.success) {
        const data = res.data.data;
        if (data.resume) setResumeUrl(data.resume);
        if (data.profile_picture) setProfileImagePreview(data.profile_picture);
        setResumeFile(null);
        setProfileExists(true);
        toast.success('Profile updated successfully');
        
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        if (formData.name && userData.name !== formData.name) {
          userData.name = formData.name;
          localStorage.setItem('user', JSON.stringify(userData));
        }
      }
    } catch (error) {
      console.error('Profile update error:', error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to update profile');
      }
    } finally {
      setSaving(false);
    }
  };

  // Get user initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) return <Loader />;

  return (
    <div className="w-full">
      {/* Crop Modal */}
      {showCropModal && cropImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Crop Profile Image</h3>
              <button
                onClick={handleCancelCrop}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                onComplete={c => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-h-[50vh]"
              >
                <img
                  ref={imageRef}
                  src={cropImage}
                  alt="Crop preview"
                  className="max-w-full"
                />
              </ReactCrop>
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelCrop}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={getCroppedImage}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
          <span className="text-sm text-gray-500">
            {profileExists ? 'Manage your personal details' : 'Complete your profile'}
          </span>
        </div>

        {/* Profile Image Section */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FaUserCircle className="w-16 h-16 text-gray-400" />
                )}
              </div>
              
              {/* Hover overlay for actions */}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <label className="p-2 bg-white/20 hover:bg-white/30 rounded-full cursor-pointer transition-colors">
                  <FaCamera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                {profileImagePreview && (
                  <button
                    onClick={handleRemoveProfileImage}
                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
                  >
                    <FaTrash className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-gray-700">Profile Picture</p>
              <p className="text-xs text-gray-500 mt-1">
                Click on the image to upload or remove
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG • Max 5MB • Square image recommended
              </p>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              readOnly
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              readOnly 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg cursor-not-allowed" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input 
              type="tel" 
              name="phone" 
              value={formData.phone} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="Enter 10-digit mobile number"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
            <input 
              type="date" 
              name="dateOfBirth" 
              value={formData.dateOfBirth} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select 
              name="gender" 
              value={formData.gender} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Others">Others</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
            <input 
              type="text" 
              name="nationality" 
              value={formData.nationality || ''} 
              onChange={(e) => setFormData(prev => ({ ...prev, nationality: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
              placeholder="e.g., Indian"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <input 
              type="text" 
              name="country" 
              value={formData.country} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input 
              type="text" 
              name="state" 
              value={formData.state} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <input 
              type="text" 
              name="city" 
              value={formData.city} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Zip Code</label>
            <input 
              type="text" 
              name="zipCode" 
              value={formData.zipCode} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input 
              type="text" 
              name="address" 
              value={formData.address} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
            />
          </div>
          
          <div className="lg:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">About Me</label>
            <textarea 
              name="about" 
              rows="4" 
              value={formData.about} 
              onChange={handleChange} 
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
              placeholder="Tell us about yourself..." 
            />
          </div>
        </div>

        {/* Resume Upload Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Resume / CV</h3>
            <span className="text-xs text-gray-400">PDF format • Max 5MB</span>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-50 rounded-xl flex-shrink-0">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h4 className="text-sm font-medium text-gray-900">
                  {resumeFile || resumeUrl ? 'Resume Uploaded' : 'Upload Your Resume'}
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {resumeFile ? resumeFile.name : resumeUrl ? 'Click to replace' : 'Drag and drop or click to upload'}
                </p>
                {resumeFile && (
                  <p className="text-xs text-green-600 mt-1">
                    {(resumeFile.size / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {(resumeFile || resumeUrl) && (
                  <>
                    {resumeUrl && !resumeFile && (
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Resume"
                      >
                        <FaEye className="w-4 h-4" />
                      </a>
                    )}
                    <button
                      onClick={handleRemoveResume}
                      className="p-2.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove Resume"
                    >
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </>
                )}
                
                <label className="cursor-pointer">
                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                    <FaUpload className="w-3.5 h-3.5" />
                    {resumeFile || resumeUrl ? 'Replace' : 'Upload'}
                  </span>
                  <input
                    type="file"
                    ref={resumeInputRef}
                    accept=".pdf"
                    className="hidden"
                    onChange={handleResumeUpload}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Resume file details when uploaded */}
          {resumeFile && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">{resumeFile.name}</span>
              <span className="text-xs text-green-600">({(resumeFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
          {resumeUrl && !resumeFile && (
            <div className="mt-3 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-3 rounded-lg">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Resume uploaded</span>
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline ml-2">
                View PDF
              </a>
            </div>
          )}
        </div>
        
        {/* Save Button */}
        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button 
            onClick={handleSubmit} 
            disabled={saving} 
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};