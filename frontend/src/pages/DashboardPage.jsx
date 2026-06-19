import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Pill, AlertTriangle, Clock, Bell, TrendingUp, ArrowRight, Package,
  IndianRupee, Receipt, CalendarDays,
} from 'lucide-react';
import api from '../api/axios';

const StatCard = ({ icon: Icon, label, value, color, sub }) => {
  const colors = {
    blue:   'bg-brand-50 text-brand-600 border-brand-100',
    red:    'bg-red-50 text-red-600 border-red-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    green:  'bg-emerald-50 text-emerald-600 border-emerald-100',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-slate-800">{value ?? '—'}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
};

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, medsRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/medicines'),
        ]);
        setStats(statsRes.data.data);
        setMedicines(medsRes.data.data);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const criticalMeds = medicines
    .filter((m) => m.stock_quantity < 10 || (m.days_until_expiry >= 0 && m.days_until_expiry <= 30))
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Overview of your pharmacy inventory and sales</p>
      </div>

      {/* Revenue row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee}  label="Revenue Today"   value={`₹${(stats?.revenue_today ?? 0).toFixed(2)}`}  color="green"  sub={`${stats?.invoices_today ?? 0} invoice(s) today`} />
        <StatCard icon={CalendarDays} label="Revenue This Month" value={`₹${(stats?.revenue_month ?? 0).toFixed(2)}`} color="blue"  sub="Current calendar month" />
        <StatCard icon={Receipt}      label="Total Invoices"  value={stats?.invoices_total}        color="purple" sub={`₹${(stats?.revenue_total ?? 0).toFixed(2)} all-time revenue`} />
        <StatCard icon={Bell}         label="Unread Alerts"   value={stats?.total_unread_alerts}   color="red"    sub="Needs attention" />
      </div>

      {/* Inventory row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package}       label="Total Medicines"  value={stats?.total_medicines}          color="blue"  sub="All registered items" />
        <StatCard icon={AlertTriangle} label="Low Stock"        value={stats?.low_stock_medicines}      color="red"   sub="Below 10 units" />
        <StatCard icon={Clock}         label="Expiring Soon"    value={stats?.expiring_soon_medicines}  color="amber" sub="Within 30 days" />
        <StatCard icon={TrendingUp}    label="Top Seller"       value={stats?.top_selling?.[0]?.medicine_name ?? '—'} color="green" sub={stats?.top_selling?.[0] ? `${stats.top_selling[0].units_sold} units sold` : 'No sales yet'} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Critical medicines */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Medicines Needing Attention</h2>
              <p className="text-xs text-slate-400">Low stock or expiring within 30 days</p>
            </div>
            <Link to="/medicines" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {criticalMeds.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <TrendingUp className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">All clear!</p>
              <p className="text-xs text-slate-400 mt-1">No medicines need immediate attention.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {criticalMeds.map((m) => (
                <div key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Pill className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{m.batch_number}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {m.stock_quantity < 10 && (
                      <span className="badge-red">
                        <AlertTriangle className="w-3 h-3" /> {m.stock_quantity} left
                      </span>
                    )}
                    {m.days_until_expiry >= 0 && m.days_until_expiry <= 30 && (
                      <span className="badge-amber">
                        <Clock className="w-3 h-3" />
                        {m.days_until_expiry === 0 ? 'Today' : `${m.days_until_expiry}d`}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent sales */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-700">Recent Sales</h2>
              <p className="text-xs text-slate-400">Latest completed invoices</p>
            </div>
            <Link to="/sales" className="text-xs text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1">
              New sale <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {!stats?.recent_sales?.length ? (
            <div className="px-5 py-10 text-center">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No sales yet</p>
              <p className="text-xs text-slate-400 mt-1">Completed sales will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {stats.recent_sales.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{s.customer_name || 'Walk-in Customer'}</p>
                    <p className="text-xs text-slate-400 font-mono">{s.invoice_number}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 flex-shrink-0">₹{Number(s.total_amount).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
