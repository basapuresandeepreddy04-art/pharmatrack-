import { useState, useEffect } from 'react';
import { X, Pill } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function MedicineModal({ medicine, onClose, onSaved }) {
  const isEdit = Boolean(medicine?.id);
  const [form, setForm] = useState({
    name: '',
    batch_number: '',
    stock_quantity: '',
    price: '',
    expiry_date: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setForm({
        name: medicine.name,
        batch_number: medicine.batch_number,
        stock_quantity: medicine.stock_quantity,
        price: medicine.price ?? '',
        expiry_date: medicine.expiry_date?.split('T')[0] ?? medicine.expiry_date,
      });
    }
  }, [medicine]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.batch_number.trim()) return toast.error('Name and batch number are required.');
    if (Number(form.stock_quantity) < 0) return toast.error('Stock quantity cannot be negative.');
    if (form.price === '' || Number(form.price) < 0) return toast.error('Please enter a valid price.');

    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/medicines/${medicine.id}`, form);
        toast.success('Medicine updated successfully!');
      } else {
        await api.post('/medicines', form);
        toast.success('Medicine added successfully!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="card w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-brand-50 rounded-lg flex items-center justify-center">
              <Pill className="w-4 h-4 text-brand-600" />
            </div>
            <h2 className="text-sm font-semibold text-slate-800">
              {isEdit ? 'Edit Medicine' : 'Add New Medicine'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Medicine Name *</label>
            <input
              name="name"
              type="text"
              required
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Paracetamol 500mg"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Batch Number *</label>
            <input
              name="batch_number"
              type="text"
              required
              value={form.batch_number}
              onChange={handleChange}
              placeholder="e.g. PCM-2024-001"
              className="input-field font-mono"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Stock Quantity *</label>
              <input
                name="stock_quantity"
                type="number"
                min="0"
                required
                value={form.stock_quantity}
                onChange={handleChange}
                placeholder="0"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Price (₹) *</label>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={handleChange}
                placeholder="0.00"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Expiry Date *</label>
              <input
                name="expiry_date"
                type="date"
                required
                value={form.expiry_date}
                onChange={handleChange}
                className="input-field"
              />
            </div>
          </div>

          {/* Warnings */}
          {form.stock_quantity !== '' && Number(form.stock_quantity) < 10 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
              <span className="text-xs text-red-600">⚠ Low stock alert will be triggered (below 10 units)</span>
            </div>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? 'Saving…' : isEdit ? 'Save changes' : 'Add medicine'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
