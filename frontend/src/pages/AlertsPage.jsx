import { useState, useEffect } from 'react';
import { Bell, BellOff, AlertTriangle, Clock, CheckCheck, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const alertIcon = (type) =>
  type === 'low_stock'
    ? <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
    : <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />;

const alertBadge = (type) =>
  type === 'low_stock'
    ? <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-red-50 text-red-600">Low Stock</span>
    : <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700">Expiry</span>;

const fmtTime = (ts) =>
  new Date(ts).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

export default function AlertsPage() {
  const [alerts, setAlerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [marking, setMarking] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/alerts');
      setAlerts(data.data);
    } catch {
      toast.error('Failed to load alerts.');
    }
    setLoading(false);
  };

  useEffect(() => {
    const loadAlerts = async () => {
      await fetchAlerts();
      setIsLoading(false);
    };
    loadAlerts();
  }, []);

  const markOne = async (id) => {
    try {
      await api.patch(`/alerts/${id}/read`);
      setAlerts((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a));
    } catch {
      toast.error('Failed to mark alert.');
    }
  };

  const markAll = async () => {
    setMarking(true);
    try {
      await api.patch('/alerts/mark-all-read');
      setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
      toast.success('All alerts marked as read.');
    } catch {
      toast.error('Failed to mark all alerts.');
    }
    setMarking(false);
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'unread')    return !a.is_read;
    if (filter === 'low_stock') return a.alert_type === 'low_stock';
    if (filter === 'expiry')    return a.alert_type === 'expiry';
    return true;
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const filters = [
    { key: 'all',       label: 'All' },
    { key: 'unread',    label: `Unread (${unreadCount})` },
    { key: 'low_stock', label: 'Low Stock' },
    { key: 'expiry',    label: 'Expiry' },
  ];

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-50">
        <img
          src="https://images.unsplash.com/photo-1631549916768-4119b295f78b?auto=format&fit=crop&w=300&q=80"
          alt="Pharmacy"
          className="w-32 h-32 object-cover rounded-2xl shadow-md mb-4 animate-pulse"
        />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" />
        <p className="text-gray-500 font-medium text-sm tracking-wide animate-fade-in">
          Loading Pharmacy System...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Alerts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAlerts} className="btn-secondary px-2.5 py-2">
            <RefreshCw className="w-4 h-4" />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAll} disabled={marking} className="btn-secondary gap-2">
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">{marking ? 'Marking…' : 'Mark all read'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-1 w-fit">
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

      {/* Alert list */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-600">No alerts here</p>
            <p className="text-xs text-slate-400 mt-1">Everything is in order.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((a) => (
              <div
                key={a.id}
                className={`flex items-center gap-4 rounded-xl bg-white border border-slate-200 ${
                  a.alert_type === 'low_stock'
                    ? 'border-l-4 border-l-red-500'
                    : 'border-l-4 border-l-amber-500'
                } px-5 py-4 shadow-sm transition-all hover:shadow-md hover:translate-x-1`}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                  a.alert_type === 'low_stock'
                    ? 'bg-red-50 text-red-500'
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  {alertIcon(a.alert_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {alertBadge(a.alert_type)}
                    <span className="text-xs text-gray-400 font-mono">{a.batch_number}</span>
                    {!a.is_read && (
                      <span className="inline-flex h-2 w-2 rounded-full bg-slate-400" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 leading-6">{a.message}</p>
                  <p className="mt-2 text-xs text-gray-400">{fmtTime(a.created_at)}</p>
                </div>
                <div className="flex items-start justify-end">
                  {!a.is_read ? (
                    <button
                      onClick={() => markOne(a.id)}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-slate-500">Read</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
