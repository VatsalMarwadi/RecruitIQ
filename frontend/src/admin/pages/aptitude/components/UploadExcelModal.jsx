// admin/pages/aptitude/components/UploadExcelModal.jsx

import React, { useState } from "react";
import { X, Upload, Download, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../../../configuration/api";

export default function UploadExcelModal({ isOpen, onClose, roundId, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".xlsx") && !selectedFile.name.endsWith(".xls")) {
        toast.error("Please upload an Excel file (.xlsx or .xls)");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File size should not exceed 5 MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("round_id", roundId);
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const response = await api.post("/canadmin/upload-aptitude-question/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success(response.data.message || "Questions uploaded successfully");
        onSuccess();
        onClose();
        setFile(null);
      } else {
        toast.error(response.data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error(error.response?.data?.message || "Failed to upload questions");
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ["Question", "Option 1", "Option 2", "Option 3", "Option 4", "Correct Option", "Marks"];
    const sampleRow = ["Sample Question", "Option A", "Option B", "Option C", "Option D", "option_1", "1"];
    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aptitude_questions_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded successfully");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/20" onClick={onClose} />

        <div className="relative bg-white rounded-lg border border-gray-200 max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-gray-600" />
              Upload Excel
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                file ? "border-green-400 bg-green-50" : "border-gray-300 hover:border-blue-400"
              }`}
            >
              {file ? (
                <div className="space-y-2">
                  <FileSpreadsheet className="w-10 h-10 text-green-600 mx-auto" />
                  <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                  <button onClick={() => setFile(null)} className="text-xs text-red-600 hover:text-red-700">
                    Remove
                  </button>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600">Drag and drop or</p>
                  <label className="inline-block mt-2">
                    <span className="px-4 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer transition-colors">
                      Browse Files
                    </span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept=".xlsx,.xls" />
                  </label>
                  <p className="text-xs text-gray-400 mt-3">.xlsx, .xls (Max 5 MB)</p>
                </div>
              )}
            </div>

            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>

            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="font-medium text-gray-700">Headers:</p>
              <p>Question, Option 1-4, Correct Option (option_1/2/3/4), Marks</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className={`flex-1 px-4 py-2 text-sm text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  !file || uploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}