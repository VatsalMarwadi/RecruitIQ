import React, { useState, useEffect } from "react";
import {
  FaAward,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaExternalLinkAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import api, { authHeader } from "../../configuration/api";
import { confirmDelete } from "../../components/ToastConfirmation";

const Certifications = () => {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    issuer: "",
    date: "",
    link: "",
  });

  const currentYear = new Date().getFullYear();

  // Load certifications data
  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        "/candidate/get-certificate/",
        authHeader(),
      );

      if (response.data.success) {
        setCertifications(response.data.data);
      } else {
        toast.error(response.data.message || "Failed to load certifications");
      }
    } catch (error) {
      console.error("Error fetching certifications:", error);
      toast.error(
        error.response?.data?.message || "Failed to load certifications",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim() || !formData.issuer.trim()) {
      toast.error("Please fill in certification name and issuer");
      return;
    }

    setSaving(true);

    try {
      const method = "post";
      const url = "/candidate/add-update-certificate/";

      const payload = {
        id: formData.id,
        name: formData.name.trim(),
        issue_org: formData.issuer.trim(),
        issue_month_year: formData.date ? `${formData.date}-01` : null,
        link: formData.link.trim() ? formData.link.trim() : "",
      };

      const response = await api[method](url, payload, authHeader());

      if (response.data.success) {
        toast.success(response.data.message);
        await fetchCertifications(); // Refresh the list
        resetForm();
      } else {
        toast.error(response.data.message || "Failed to save certification");
      }
    } catch (error) {
      console.error("Error saving certification:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save certification";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (certificationItem) => {
    setFormData({
      id: certificationItem.id,
      name: certificationItem.name || "",
      issuer: certificationItem.issue_org || "",
      date: certificationItem.issue_month_year
        ? certificationItem.issue_month_year.slice(0, 7)
        : "" || "",
      link: certificationItem.link || "",
    });
    setEditingId(certificationItem.id);
  };

  const handleDelete = async (id) => {
    confirmDelete("Certification", async () => {
      try {
        const response = await api.delete(
          `/candidate/delete-certificate/${id}/`,
          authHeader(),
        );

        if (response.data.success) {
          toast.success("Certification deleted successfully");
          await fetchCertifications();
          if (editingId === id) {
            resetForm();
          }
        } else {
          toast.error(
            response.data.message || "Failed to delete certification",
          );
        }
      } catch (error) {
        console.error("Error deleting certification:", error);
        toast.error(
          error.response?.data?.message || "Failed to delete certification",
        );
      }
    });
  };

  const resetForm = () => {
    setFormData({
      id: null,
      name: "",
      issuer: "",
      date: "",
      link: "",
    });
    setEditingId(null);
  };

  const cancelEdit = () => {
    resetForm();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";

    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-3 text-slate-600 text-sm">
            Loading certifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <FaAward className="text-orange-500" />
          Certifications
        </h2>
        <span className="text-sm text-slate-500">
          {certifications.length}{" "}
          {certifications.length === 1 ? "certification" : "certifications"}
        </span>
      </div>

      {/* Certifications List */}
      {certifications.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
          <FaAward className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No certifications added yet</p>
          <p className="text-sm text-slate-400">
            Add your certifications above
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {certifications.map((cert) => (
            <div
              key={cert.id}
              className={`flex items-center justify-between p-4 bg-white rounded-xl border transition-colors ${
                editingId === cert.id
                  ? "border-orange-400 bg-orange-50"
                  : "border-slate-200 hover:border-orange-200"
              }`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h4 className="font-semibold text-slate-900">{cert.name}</h4>
                  <span className="text-xs text-slate-400">•</span>
                  <p className="text-sm text-slate-600">{cert.issue_org}</p>
                </div>
                <div className="flex items-center gap-4 mt-1 flex-wrap">
                  {cert.issue_month_year && (
                    <p className="text-xs text-slate-500">
                      <span className="font-medium">Obtained:</span>{" "}
                      {formatDate(cert.issue_month_year)}
                    </p>
                  )}
                  {cert.link && (
                    <a
                      href={cert.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                    >
                      <FaExternalLinkAlt size={10} />
                      Verify Credential
                    </a>
                  )}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(cert)}
                  className="p-2 text-slate-600 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(cert.id)}
                  className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certification Form */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Certification Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="AWS Certified Developer"
            className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Issuing Organization *
            </label>
            <input
              type="text"
              name="issuer"
              value={formData.issuer}
              onChange={handleInputChange}
              placeholder="Amazon Web Services"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Date Obtained
            </label>
            <input
              type="month"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Credential Link (Optional)
            </label>
            <input
              type="url"
              name="link"
              value={formData.link}
              onChange={handleInputChange}
              placeholder="https://credential.net/..."
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          {editingId && (
            <button
              onClick={cancelEdit}
              className="flex items-center gap-2 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded-lg transition-colors"
            >
              <FaTimes />
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Saving...
              </>
            ) : (
              <>
                {editingId ? <FaSave /> : <FaPlus />}
                {editingId ? "Update Certification" : "Add Certification"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Certifications;