import { Trash2, X } from 'lucide-react';

export default function DeleteDialog({ medicine, onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-sm">
        <div className="p-6 text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 mb-1">Delete Medicine</h3>
          <p className="text-sm text-slate-500 mb-1">
            Are you sure you want to delete
          </p>
          <p className="text-sm font-semibold text-slate-800 mb-4">"{medicine?.name}"?</p>
          <p className="text-xs text-red-500 mb-5">This will also delete all related alerts. This action cannot be undone.</p>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className="btn-danger flex-1 justify-center">
              {loading ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
