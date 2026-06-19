import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import {
  LayoutDashboard, Pill, Bell, LogOut, Menu, X, FlaskConical, ChevronRight, ShoppingCart
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import DnaLoader from './DnaLoader';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/medicines', icon: Pill,            label: 'Medicines' },
  { to: '/sales',     icon: ShoppingCart,    label: 'Billing'   },
  { to: '/alerts',    icon: Bell,            label: 'Alerts'    },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(false);
  const firstRouteRendered = useRef(true);

  useEffect(() => {
    if (firstRouteRendered.current) {
      firstRouteRendered.current = false;
      return;
    }
    setPageLoading(true);
    const timer = setTimeout(() => setPageLoading(false), 3000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/alerts/stats');
        setUnreadCount(data.data.total_unread_alerts || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  // Helper render function for sidebar contents
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-700/20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0 overflow-hidden transition-all duration-300 ease-in-out">
            <p className="text-sm font-semibold text-slate-100 opacity-0 group-hover:opacity-100 transition-opacity duration-250 delay-100">
              PharmaTrack
            </p>
            <p className="text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-250 delay-150">
              Inventory
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-2 overflow-hidden">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-250 ${
                isActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="whitespace-nowrap transition-all duration-300 ease-in-out inline-block group-hover:opacity-100 group-hover:translate-x-0 group-hover:max-w-xs max-w-0 opacity-0 overflow-hidden">
              {label}
            </span>
            {label === 'Alerts' && unreadCount > 0 && (
              <span className="ml-auto min-w-[20px] h-[20px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-250 delay-100">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Profile & Single Logout Section */}
      <div className="mt-auto px-3 py-4 border-t border-slate-700/20 flex flex-col gap-2 bg-[#050d1a]/50">
        {/* User Info (Adapts dynamically to hover state) */}
        <div className="flex items-center gap-3 px-2 overflow-hidden transition-all duration-300">
          <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold flex-shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 transition-opacity duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">
            <p className="text-sm font-medium text-slate-200 truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {user?.email || 'Logged in'}
            </p>
          </div>
        </div>

        {/* Unified Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent transition-all duration-250"
          title="Logout"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium whitespace-nowrap transition-opacity duration-300 opacity-0 group-hover:opacity-100">
            Logout
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex peer group flex-col w-20 hover:w-64 overflow-hidden transition-all duration-300 ease-in-out bg-[#081426] border-r border-slate-700/30 fixed inset-y-0 left-0 z-30">
        {renderSidebarContent()}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="relative flex flex-col w-56 bg-[#081426] border-r border-slate-700/30 z-50 h-full">
            <button className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-slate-700/30 transition-all duration-250 text-slate-400 hover:text-slate-200">
              <X className="w-5 h-5" onClick={() => setSidebarOpen(false)} />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-h-screen bg-slate-50 transition-all duration-300 ease-in-out overflow-y-auto lg:ml-20 peer-hover:lg:ml-64 flex flex-col">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-[#081426] border-b border-slate-700/30 sticky top-0 z-20">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-700/30 transition-all duration-250 text-slate-400 hover:text-slate-200">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <FlaskConical className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-100">PharmaTrack</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {pageLoading && <DnaLoader />}
    </div>
  );
}