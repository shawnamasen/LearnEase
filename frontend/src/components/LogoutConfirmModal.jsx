import React from 'react';
import ReactDOM from 'react-dom';
import { LogOut, X } from 'lucide-react';

function LogoutConfirmModal({ isOpen, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 text-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/15 text-red-400">
              <LogOut className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-semibold">Confirm Logout</h2>
          </div>

          <button
            onClick={onCancel}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-gray-300">
            Are you sure you want to log out of your account?
          </p>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-700 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-600 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default LogoutConfirmModal;