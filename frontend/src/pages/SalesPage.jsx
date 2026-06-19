import { useState, useEffect, useMemo } from 'react';
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Receipt, X, CheckCircle2,
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function SalesPage() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState([]); // { medicine_id, name, price, stock, qty }
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastInvoice, setLastInvoice] = useState(null);

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
    return medicines.filter(
      (m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.batch_number.toLowerCase().includes(search.toLowerCase())
    );
  }, [medicines, search]);

  const addToCart = (m) => {
    if (m.stock_quantity <= 0) return toast.error(`"${m.name}" is out of stock.`);
    setCart((prev) => {
      const existing = prev.find((c) => c.medicine_id === m.id);
      if (existing) {
        if (existing.qty >= m.stock_quantity) {
          toast.error(`Only ${m.stock_quantity} unit(s) of "${m.name}" available.`);
          return prev;
        }
        return prev.map((c) => (c.medicine_id === m.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { medicine_id: m.id, name: m.name, price: Number(m.price), stock: m.stock_quantity, qty: 1 }];
    });
  };

  const changeQty = (medicine_id, delta) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.medicine_id !== medicine_id) return c;
          const next = c.qty + delta;
          if (next > c.stock) {
            toast.error(`Only ${c.stock} unit(s) available.`);
            return c;
          }
          return { ...c, qty: next };
        })
        .filter((c) => c.qty > 0)
    );
  };

  const removeFromCart = (medicine_id) => setCart((prev) => prev.filter((c) => c.medicine_id !== medicine_id));

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error('Add at least one medicine to the cart first.');
    if (customerPhone.trim() !== '' && customerPhone.trim().length !== 10) {
      setPhoneError('Phone number must be exactly 10 digits.');
      return;
    }
    setPhoneError('');
    setSubmitting(true);
    try {
      const items = cart.map((c) => ({ medicine_id: c.medicine_id, quantity: c.qty }));
      const { data } = await api.post('/sales', {
        customer_name: customerName.trim() || null,
        customer_phone: customerPhone.trim() || null,
        items,
      });
      toast.success(`Sale completed — Invoice ${data.data.invoice_number}`);
      setLastInvoice(data.data);
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      fetchMedicines();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Checkout failed.');
    }
    setSubmitting(false);
  };

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Billing</h1>
        <p className="text-sm text-slate-500 mt-0.5">Build a sale and generate an invoice</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Medicine picker */}
        <div className="lg:col-span-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search medicine by name or batch…"
              className="input-field pl-9"
            />
          </div>

          <div className="card overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-16 text-center text-sm text-slate-500">No medicines found.</div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-[560px] overflow-y-auto">
                {filtered.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{m.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{m.batch_number}</p>
                    </div>
                    <span className={`text-xs font-medium ${m.stock_quantity <= 0 ? 'text-red-500' : 'text-slate-500'}`}>
                      {m.stock_quantity} in stock
                    </span>
                    <span className="text-sm font-semibold text-slate-700 w-20 text-right">₹{Number(m.price).toFixed(2)}</span>
                    <button
                      onClick={() => addToCart(m)}
                      disabled={m.stock_quantity <= 0}
                      className="btn-primary px-2.5 py-1.5 disabled:opacity-40"
                      title="Add to cart"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cart / checkout panel */}
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
              <ShoppingCart className="w-4 h-4 text-brand-600" />
              <h2 className="text-sm font-semibold text-slate-700">Cart ({cart.length})</h2>
            </div>

            {cart.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">Cart is empty</p>
            ) : (
              <div className="divide-y divide-slate-50 max-h-64 overflow-y-auto">
                {cart.map((c) => (
                  <div key={c.medicine_id} className="px-4 py-2.5 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{c.name}</p>
                      <p className="text-[11px] text-slate-400">₹{c.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => changeQty(c.medicine_id, -1)} className="p-1 rounded hover:bg-slate-100 text-slate-500">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-semibold w-6 text-center">{c.qty}</span>
                      <button onClick={() => changeQty(c.medicine_id, 1)} className="p-1 rounded hover:bg-slate-100 text-slate-500">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    <span className="text-xs font-semibold text-slate-700 w-16 text-right">₹{(c.price * c.qty).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(c.medicine_id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 py-3 border-t border-slate-100 space-y-3">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer name"
                className="input-field"
              />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Customer phone"
                className="input-field"
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1">{phoneError}</p>
              )}
              <div className="flex items-center justify-between text-sm font-semibold text-slate-800 pt-1">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={submitting || cart.length === 0}
                className="btn-primary w-full justify-center"
              >
                {submitting ? 'Processing…' : 'Complete Sale'}
              </button>
            </div>
          </div>

          {/* Last invoice */}
          {lastInvoice && (
            <div className="card p-4 relative">
              <button onClick={() => setLastInvoice(null)} className="absolute top-3 right-3 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h3 className="text-sm font-semibold text-slate-700">Invoice generated</h3>
              </div>
              <p className="text-xs text-slate-500 font-mono mb-1">{lastInvoice.invoice_number}</p>
              <div className="space-y-1 mb-2">
                {lastInvoice.items?.map((it) => (
                  <div key={it.medicine_id} className="flex justify-between text-xs text-slate-600">
                    <span>{it.medicine_name} × {it.quantity}</span>
                    <span>₹{Number(it.subtotal).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-semibold text-slate-800 pt-2 border-t border-slate-100">
                <span className="flex items-center gap-1"><Receipt className="w-3.5 h-3.5" /> Total</span>
                <span>₹{Number(lastInvoice.total_amount).toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
