import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Pencil, Trash2, AlertTriangle,
  Clock, CheckCircle, RefreshCw, FileDown,
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import MedicineModal from '../components/MedicineModal';
import DeleteDialog from '../components/DeleteDialog';

const getStatusBadge = (m) => {
  const days = m.days_until_expiry;
  const isExpired  = days < 0;
  const isExpiring = days >= 0 && days <= 30;
  const isLowStock = m.stock_quantity < 10;
  if (isExpired)              return <span className="badge-red"><Clock className="w-3 h-3" /> Expired</span>;
  if (isLowStock && isExpiring) return <span className="badge-red"><AlertTriangle className="w-3 h-3" /> Critical</span>;
  if (isLowStock)             return <span className="badge-red"><AlertTriangle className="w-3 h-3" /> Low Stock</span>;
  if (isExpiring)             return <span className="badge-amber"><Clock className="w-3 h-3" /> Expiring Soon</span>;
  return <span className="badge-green"><CheckCircle className="w-3 h-3" /> Good</span>;
};

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MedicinesPage() {
  const [medicines, setMedicines]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState('');
  const [filter, setFilter]                 = useState('all');
  const [showModal, setShowModal]           = useState(false);
  const [editMed, setEditMed]               = useState(null);
  const [deleteMed, setDeleteMed]           = useState(null);
  const [deleting, setDeleting]             = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/medicines');
      setMedicines(data.data);
    } catch {
      toast.error('Failed to load medicines.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchMedicines(); }, []);

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.batch_number.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filter === 'low_stock') return m.stock_quantity < 10;
      if (filter === 'expiring')  return m.days_until_expiry >= 0 && m.days_until_expiry <= 30;
      if (filter === 'expired')   return m.days_until_expiry < 0;
      return true;
    });
  }, [medicines, search, filter]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/medicines/${deleteMed.id}`);
      toast.success(`"${deleteMed.name}" deleted.`);
      setDeleteMed(null);
      fetchMedicines();
    } catch {
      toast.error('Delete failed.');
    }
    setDeleting(false);
  };

 const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      toast.success('Report feature coming soon!');
    } finally {
      setGeneratingReport(false);
    }
  };

  const filters = [
    { key: 'all',       label: 'All' },
    { key: 'low_stock', label: 'Low Stock' },
    { key: 'expiring',  label: 'Expiring Soon' },
    { key: 'expired',   label: 'Expired' },
  ];

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Medicines</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your pharmacy inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchMedicines} className="btn-secondary px-2.5 py-2">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleGenerateReport}
            disabled={generatingReport || medicines.length === 0}
            className="btn-secondary flex items-center gap-1.5 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {generatingReport ? 'Generating…' : 'Download Report PPT'}
          </button>
          <button
            onClick={() => { setEditMed(null); setShowModal(true); }}
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or batch…"
            className="input-field pl-9"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === f.key
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-slate-600">No medicines found</p>
            <p className="text-xs text-slate-400 mt-1">
              {search ? 'Try a different search term.' : 'Add your first medicine to get started.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Medicine</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Batch</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Stock</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Expiry</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{m.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{m.batch_number}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${m.stock_quantity < 10 ? 'text-red-600' : 'text-slate-700'}`}>
                        {m.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">₹{Number(m.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{fmt(m.expiry_date)}</div>
                      {m.days_until_expiry >= 0 && m.days_until_expiry <= 30 && (
                        <div className="text-[10px] text-amber-500 font-medium">
                          {m.days_until_expiry === 0 ? 'Expires today' : `${m.days_until_expiry}d left`}
                        </div>
                      )}
                      {m.days_until_expiry < 0 && (
                        <div className="text-[10px] text-red-500 font-medium">Expired</div>
                      )}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(m)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => { setEditMed(m); setShowModal(true); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteMed(m)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <MedicineModal
          medicine={editMed}
          onClose={() => { setShowModal(false); setEditMed(null); }}
          onSaved={fetchMedicines}
        />
      )}

      {deleteMed && (
        <DeleteDialog
          medicine={deleteMed}
          onClose={() => setDeleteMed(null)}
          onConfirm={handleDelete}
          loading={deleting}
        />
      )}
    </div>
  );
}