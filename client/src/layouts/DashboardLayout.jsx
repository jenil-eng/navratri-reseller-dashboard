import React, { useState } from 'react';
import { NavLink as RouterNavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  PlusCircle,
  History,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  Database,
  UserCheck
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Add Sale', path: '/add-sale', icon: PlusCircle },
    { label: 'Sales History', path: '/sales', icon: History },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Desktop Sidebar - Sticky Left Nav */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 h-screen sticky top-0 z-40">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-600/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-sm leading-snug tracking-tight">Navratri Reseller</h1>
              <p className="text-[11px] text-brand-400 font-medium">Internal Admin UI</p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <RouterNavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/25'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </RouterNavLink>
            );
          })}
        </nav>

        {/* Quick Add CTA */}
        <div className="px-4 py-3">
          <RouterNavLink
            to="/add-sale"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-brand-600 text-white rounded-xl text-xs font-semibold shadow-md hover:brightness-110 transition duration-200"
          >
            <PlusCircle className="w-4 h-4" />
            New Pass Sale
          </RouterNavLink>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs shrink-0">
                <UserCheck className="w-4 h-4 text-brand-400" />
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-slate-200 truncate">{user?.email || 'admin@navratri.com'}</p>
                <p className="text-[10px] text-slate-500">Authorized Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Slide Drawer */}
      <header className="md:hidden bg-slate-900 text-slate-200 px-4 py-3 border-b border-slate-800 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-semibold text-sm text-slate-100">Navratri Reseller</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Navigation Overlay Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[57px] bg-slate-900/95 backdrop-blur-md z-40 p-5 flex flex-col justify-between">
          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <RouterNavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </RouterNavLink>
              );
            })}
          </nav>
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs text-slate-400">{user?.email}</span>
              <span className="text-xs text-brand-400 font-medium">Admin</span>
            </div>
            <button
              onClick={() => {
                setMobileOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-rose-600/20 text-rose-300 border border-rose-800/50 rounded-xl font-medium"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar - Sticky Pinned to Top of Webpage */}
        <header className="hidden md:flex h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-8 items-center justify-between sticky top-0 z-30 shadow-xs transition-all">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Section</span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-800">
              {navItems.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-100 text-slate-600 text-xs px-3 py-1.5 rounded-full border border-slate-200">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheets Sync Active</span>
            </div>
            <div className="w-px h-5 bg-slate-200"></div>
            <div className="text-right">
              <span className="block text-xs font-semibold text-slate-800">Private Management Admin</span>
              <span className="block text-[10px] text-slate-400">B2C Reseller Sales Only</span>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
