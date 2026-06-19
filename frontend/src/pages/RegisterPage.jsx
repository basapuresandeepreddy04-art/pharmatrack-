import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FlaskConical } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-600 rounded-2xl mb-4 shadow-lg shadow-brand-200">
            <FlaskConical className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create Account</h1>
          <p className="text-sm text-slate-500 mt-1">Set up your pharmacy inventory</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
              <input name="name" type="text" required value={form.name} onChange={handleChange} placeholder="Dr. Ramesh Kumar" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email address</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="you@pharma.com" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Password</label>
              <input name="password" type="password" required value={form.password} onChange={handleChange} placeholder="Min. 6 characters" className="input-field" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
