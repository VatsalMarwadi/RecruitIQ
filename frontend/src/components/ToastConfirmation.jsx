// components/ToastConfirmation.jsx
import React from "react";
import toast from "react-hot-toast";
import { FaSignOutAlt, FaTrash, FaSave, FaTimes, FaExclamationTriangle } from "react-icons/fa";

export const showConfirmation = ({
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "red",
  onConfirm,
  onCancel,
  icon = <FaExclamationTriangle className="text-xl" />,
  duration = 5000,
  position = "top-center",
}) => {
  toast.custom(
    (t) => (
      <div 
        className={`transform transition-all duration-300 ${
          t.visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          padding: '24px',
          minWidth: '340px',
          maxWidth: '440px',
          width: '100%',
          border: 'none',
          outline: 'none',
        }}
      >
        <div className="flex items-start gap-4 mb-5">
          <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
            confirmColor === "red" ? "bg-red-100 text-red-500" :
            confirmColor === "green" ? "bg-green-100 text-green-500" :
            confirmColor === "blue" ? "bg-blue-100 text-blue-500" :
            "bg-orange-100 text-orange-500"
          }`}>
            {icon}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-slate-900 text-base">{title}</h4>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              if (onCancel) onCancel();
            }}
            className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              if (onConfirm) onConfirm();
            }}
            className={`px-5 py-2 text-sm font-medium text-white rounded-xl transition-all duration-200 shadow-sm hover:shadow-md ${
              confirmColor === "red" ? "bg-red-500 hover:bg-red-600" :
              confirmColor === "green" ? "bg-green-500 hover:bg-green-600" :
              confirmColor === "blue" ? "bg-blue-500 hover:bg-blue-600" :
              "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    ),
    {
      duration,
      position,
      id: 'custom-confirmation',
    }
  );
};

// Pre-defined confirmation types
export const confirmLogout = (onConfirm) => {
  showConfirmation({
    title: "Confirm Logout",
    message: "Are you sure you want to logout?",
    confirmText: "Logout",
    cancelText: "Cancel",
    confirmColor: "red",
    icon: <FaSignOutAlt className="text-xl" />,
    onConfirm,
  });
};

// Fixed confirmDelete to accept title, message, and return a Promise
export const confirmDelete = (title, message) => {
  return new Promise((resolve) => {
    showConfirmation({
      title: title || "Delete Item",
      message: message || "Are you sure you want to delete this item? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      confirmColor: "red",
      icon: <FaTrash className="text-xl" />,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
};

// Alternative: confirmDelete with callback
export const confirmDeleteWithCallback = (itemName, onConfirm) => {
  const name = itemName || "Item";
  showConfirmation({
    title: `Delete ${name}`,
    message: `Are you sure you want to delete this ${name.toLowerCase()}? This action cannot be undone.`,
    confirmText: "Delete",
    cancelText: "Cancel",
    confirmColor: "red",
    icon: <FaTrash className="text-xl" />,
    onConfirm,
  });
};

export const confirmSave = (itemName, onConfirm) => {
  const name = itemName || "Item";
  showConfirmation({
    title: `Save ${name}`,
    message: `Are you sure you want to save this ${name.toLowerCase()}?`,
    confirmText: "Save",
    cancelText: "Cancel",
    confirmColor: "green",
    icon: <FaSave className="text-xl" />,
    onConfirm,
  });
};

export const confirmDiscard = (onConfirm) => {
  showConfirmation({
    title: "Discard Changes",
    message: "Are you sure you want to discard your changes? Any unsaved work will be lost.",
    confirmText: "Discard",
    cancelText: "Keep Editing",
    confirmColor: "orange",
    icon: <FaTimes className="text-xl" />,
    onConfirm,
  });
};