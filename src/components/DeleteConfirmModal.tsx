"use client";

import { Item } from "@/db/schema";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: Item | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  item,
  onClose,
  onConfirm,
  loading,
}: DeleteConfirmModalProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-4 border-red-300 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 mx-auto bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-4 border-2 border-red-200">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h3 className="text-xl font-black text-slate-800">Delete Activity?</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Are you sure you want to remove &quot;<strong>{item.title}</strong>&quot; from the classroom hub?
        </p>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? "Deleting..." : "Delete"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
