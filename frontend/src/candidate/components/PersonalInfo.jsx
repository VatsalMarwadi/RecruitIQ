import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaUpload, FaUserCircle, FaFileAlt, FaTimes, FaCamera, FaTrash, FaEye } from "react-icons/fa";
import toast from "react-hot-toast";
import api, { authHeader, authMultipartHeader } from "../../configuration/api";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

const PersonalInfo = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [resumeUrl, setResumeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [saveStatus, setSaveStatus] = useState("");
  
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

  // Personal Details State
  const [personalDetails, setPersonalDetails] = useState({
    name: "",
    email: "",
    dateOfBirth: "",
    phone: "",
    gender: "",
    nationality: "",
    address: "",
    city: "",
    state: "",
    country: "",
    zipCode: "",
    about: "",
  });

  // Load user data from database
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await api.get(
          "/candidate/get-candidate-profile/",
          authHeader()
        );

        const userData = response.data.data;

        setPersonalDetails({
          name: userData.name || "",
          email: userData.email || "",
          dateOfBirth: userData.date_of_birth || "",
          phone: userData.phone || "",
          gender: userData.gender || "",
          nationality: userData.nationality || "",
          address: userData.address || "",
          city: userData.city || "",
          state: userData.state || "",
          country: userData.country || "",
          zipCode: userData.zip_code || "",
          about: userData.about || "",
        });

        if (userData.resume) {
          setResumeUrl(userData.resume);
        }

        if (userData.profile_picture) {
          setProfileImagePreview(userData.profile_picture);
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        toast.error("Failed to load profile data");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadUserData();
  }, []);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (profileImagePreview && profileImagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(profileImagePreview);
      }
    };
  }, [profileImagePreview]);

  const updateProfile = async () => {
    setSaveStatus("saving");
    
    try {
      const formData = new FormData();

      // Append all personal details
      Object.keys(personalDetails).forEach(key => {
        if (personalDetails[key]) {
          const apiKey = key === 'zipCode' ? 'zip_code' : 
                        key === 'dateOfBirth' ? 'date_of_birth' : key;
          formData.append(apiKey, personalDetails[key]);
        }
      });

      if (profileImage) {
        formData.append("profile_picture", profileImage);
      }

      if (resumeFile) {
        formData.append("resume", resumeFile);
      }

      const response = await api.put(
        "/candidate/update-candidate-profile/",
        formData,
        authMultipartHeader()
      );

      const updatedData = response.data.data;
      
      setProfileImagePreview(updatedData.profile_picture);
      setResumeUrl(updatedData.resume);
      setResumeFile(null);
      
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 3000);
      
      toast.success("Profile updated successfully!");
      return response.data;
    } catch (error) {
      console.error("Update error:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus(""), 3000);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (loading) return;
    
    setLoading(true);

    try {
      await updateProfile();
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      e.target.value = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Resume should be less than 5MB.");
      e.target.value = null;
      return;
    }

    setResumeFile(file);
    toast.success("Resume uploaded successfully!");
  };

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size should be less than 5MB");
      e.target.value = null;
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
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
        toast.success("Profile image cropped successfully!");
      }
    }, 'image/jpeg', 0.9);
  };

  const handleRemoveProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success("Profile image removed");
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeUrl("");
    toast.success("Resume removed");
  };

  const handleCancelCrop = () => {
    setShowCropModal(false);
    setCropImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-3 text-slate-600 text-sm">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <FaUser className="text-orange-500" />
          Personal Information
        </h2>
        
        {/* Save Status Indicator */}
        {saveStatus === "saving" && (
          <span className="text-sm text-slate-500 flex items-center gap-2">
            <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-orange-500"></span>
            Saving...
          </span>
        )}
        {saveStatus === "saved" && (
          <span className="text-sm text-green-600">✓ Saved</span>
        )}
        {saveStatus === "error" && (
          <span className="text-sm text-red-600">✗ Error saving</span>
        )}
      </div>

      {/* Profile Image Upload with Crop */}
      <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full bg-slate-200 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden">
            {profileImagePreview ? (
              <img
                src={profileImagePreview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <FaUserCircle className="w-16 h-16 text-slate-400" />
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
          <p className="text-sm text-slate-700 font-medium">Profile Picture</p>
          <p className="text-xs text-slate-500">
            Click on the image to upload or remove
          </p>
          <p className="text-xs text-slate-400 mt-1">
            JPG, PNG, max 5MB • Square image recommended
          </p>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && cropImage && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Crop Profile Image</h3>
              <button
                onClick={handleCancelCrop}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <FaTimes className="text-slate-500" />
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
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={getCroppedImage}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Apply Crop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Personal Details Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={personalDetails.name}
            readOnly
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-100 cursor-not-allowed text-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email *
          </label>
          <input
            type="email"
            name="email"
            readOnly
            value={personalDetails.email}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 bg-slate-100 cursor-not-allowed text-slate-700"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Phone *
          </label>
          <input
            type="tel"
            name="phone"
            value={personalDetails.phone}
            onChange={handlePersonalChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Date of Birth
          </label>
          <input
            type="date"
            name="dateOfBirth"
            value={personalDetails.dateOfBirth}
            onChange={handlePersonalChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Gender
          </label>
          <select
            name="gender"
            value={personalDetails.gender}
            onChange={handlePersonalChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Non-binary">Others</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Nationality
          </label>
          <input
            type="text"
            name="nationality"
            value={personalDetails.nationality}
            onChange={handlePersonalChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            placeholder="Enter nationality"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Address
          </label>
          <input
            type="text"
            name="address"
            value={personalDetails.address}
            onChange={handlePersonalChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            placeholder="Enter address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            City
          </label>
          <input
            type="text"
            name="city"
            value={personalDetails.city}
            onChange={handlePersonalChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            placeholder="Enter city"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            State
          </label>
          <input
            type="text"
            name="state"
            value={personalDetails.state}
            onChange={handlePersonalChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            placeholder="Enter state"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Country
          </label>
          <input
            type="text"
            name="country"
            value={personalDetails.country}
            onChange={handlePersonalChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            placeholder="Enter country"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Zip Code
          </label>
          <input
            type="text"
            name="zipCode"
            value={personalDetails.zipCode}
            onChange={handlePersonalChange}
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            placeholder="Enter zip code"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            About Me
          </label>
          <textarea
            name="about"
            rows="4"
            value={personalDetails.about}
            onChange={handlePersonalChange}
            placeholder="Tell us about yourself, your career goals, and what makes you unique..."
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100 resize-none"
          />
        </div>
      </div>

      {/* Resume Upload Section - Compact Version */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <FaFileAlt className="text-orange-500" />
            Resume
          </h3>
        </div>

        <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 hover:border-orange-500 transition-colors">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex items-center justify-center w-16 h-16 bg-orange-50 rounded-xl flex-shrink-0">
              <FaFileAlt className="w-8 h-8 text-orange-500" />
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <h4 className="text-sm font-medium text-slate-900">
                {resumeFile || resumeUrl ? "Resume Uploaded" : "Upload Your Resume"}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                PDF format • Max 5MB
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(resumeFile || resumeUrl) && (
                <>
                  {resumeUrl && !resumeFile && (
                    <a
                      href={resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Resume"
                    >
                      <FaEye className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={handleRemoveResume}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Resume"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </>
              )}
              
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors">
                  <FaUpload className="w-3.5 h-3.5" />
                  {resumeFile || resumeUrl ? "Replace" : "Upload"}
                </span>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleResumeUpload}
                />
              </label>
            </div>
          </div>

          {resumeFile && (
            <div className="mt-3 flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-lg">
              <span className="font-medium">{resumeFile.name}</span>
              <span className="text-xs text-green-500">
                ({(resumeFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              Saving...
            </>
          ) : (
            "Save Personal Info"
          )}
        </button>
      </div>
    </div>
  );
};

export default PersonalInfo;