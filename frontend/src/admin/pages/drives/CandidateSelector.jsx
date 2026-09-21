// admin/pages/drives/CandidateSelector.jsx

import React, { useEffect, useState } from "react";
import { FaSearch, FaCheck, FaTimes } from "react-icons/fa";
import api from "../../../configuration/api";
import toast from "react-hot-toast";

export default function CandidateSelector({
  instituteId,
  selectedIds = [],
  onChange,
  onClose,
}) {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [localSelected, setLocalSelected] = useState(new Set(selectedIds));

  useEffect(() => {
    if (instituteId) fetchCandidates();
  }, [instituteId]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await api.get(
        `/canadmin/get-institute-candidates/${instituteId}/`
      );
      if (res.data.success) setCandidates(res.data.data);
    } catch (err) {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id) => {
    const next = new Set(localSelected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setLocalSelected(next);
  };

  // ✅ FIXED: return full candidate objects (with name + email)
  // so that parent components can display them.
  const handleConfirm = () => {
    const selected = candidates.filter((c) => localSelected.has(c.id));
    onChange(selected);
    onClose();
  };

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            Select Candidates ({localSelected.size} selected)
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded"
            type="button"
          >
            <FaTimes />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No candidates found
            </div>
          ) : (
            filtered.map((c) => {
              const checked = localSelected.has(c.id);
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    checked ? "bg-blue-50" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.id)}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {c.name}
                    </div>
                    <div className="text-xs text-gray-500">{c.email}</div>
                  </div>
                  {checked && <FaCheck className="text-blue-600" />}
                </label>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onClose}
            type="button"
            className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            type="button"
            className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Confirm ({localSelected.size})
          </button>
        </div>
      </div>
    </div>
  );
}