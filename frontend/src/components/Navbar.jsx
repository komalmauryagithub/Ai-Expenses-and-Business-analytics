import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, LayoutDashboard, Receipt, DollarSign, Tag,
  PiggyBank, Target, BarChart2, Bot, FileText, Bell,
  Shield, User, LogOut, Menu, X
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Income', path: '/income', icon: DollarSign },
    { name: 'Categories', path: '/categories', icon: Tag },
    { name: 'Budgets', path: '/budgets', icon: PiggyBank },
    { name: 'Goals', path: '/goals', icon: Target },
    { name: 'Analytics', path: '/analytics', icon: BarChart2 },
    { name: 'AI Assistant', path: '/ai-assistant', icon: Bot, highlight: true },
    { name: 'Reports', path: '/reports', icon: FileText },
    { name: 'Notifications', path: '/notifications', icon: Bell },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const isAdminActive = location.pathname.startsWith('/admin');

  return (
    <nav className="bg-slate-900/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md w-full">
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link to="/dashboard" className="flex items-center space-x-2.5 flex-shrink-0 group">
            <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-white text-base sm:text-lg tracking-tight block leading-tight">
                AI Expense
              </span>
              <span className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase block">
                Analytics SaaS
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (Visible on 2xl / xl screens) */}
          <div className="hidden xl:flex items-center space-x-1 lg:space-x-1.5">
            {navItems.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    active
                      ? item.highlight
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/10'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : item.highlight
                      ? 'text-purple-300 hover:text-purple-200 hover:bg-purple-950/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Right Header Utilities (Desktop & Mobile) */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <NotificationBell />
            <ThemeToggle />

            {/* Profile Link (Desktop) */}
            <Link
              to="/profile"
              className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition ${
                isActive('/profile')
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate max-w-[90px]">{user?.name?.split(' ')[0] || 'Profile'}</span>
            </Link>

            {/* Admin Portal Button */}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className={`hidden md:flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  isAdminActive
                    ? 'bg-amber-500/25 text-amber-200 border-amber-500/50'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border-amber-500/30'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Admin</span>
              </Link>
            )}

            {/* Sign Out Button (Desktop) */}
            <button
              onClick={logout}
              className="hidden md:flex items-center space-x-1 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2.5 py-1.5 rounded-xl transition"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            {/* Mobile Hamburger Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-slate-800/90 text-slate-300 hover:text-white border border-slate-700 hover:bg-slate-700 transition flex items-center justify-center focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-slate-900/98 border-b border-slate-800 shadow-2xl backdrop-blur-xl animate-in slide-in-from-top duration-200">
          <div className="max-w-7xl mx-auto px-4 pt-3 pb-6 space-y-3">
            {/* User Info Card in Mobile Menu */}
            <div className="p-3 rounded-2xl bg-slate-800/70 border border-slate-700/60 flex items-center justify-between">
              <div className="flex items-center space-x-3 truncate">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5 flex-shrink-0">
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white text-xs font-medium transition"
                  title="Profile Settings"
                >
                  <User className="w-4 h-4" />
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition"
                    title="Admin Panel"
                  >
                    <Shield className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>

            {/* Grid of Navigation Links for Mobile */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {navItems.map((item) => {
                const active = isActive(item.path);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-2.5 p-2.5 rounded-xl text-xs font-medium transition border ${
                      active
                        ? item.highlight
                          ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/20'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                        : item.highlight
                        ? 'bg-purple-950/20 text-purple-300/90 border-purple-800/30 hover:bg-purple-900/30'
                        : 'bg-slate-800/50 text-slate-300 hover:text-white border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    <Icon className={`w-4 h-4 flex-shrink-0 ${active ? (item.highlight ? 'text-purple-400' : 'text-emerald-400') : 'text-slate-400'}`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            {/* Admin Links section for Mobile if Admin */}
            {isAdmin && (
              <div className="pt-2 border-t border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase pl-1">Admin Controls</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Link
                    to="/admin/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 hover:bg-amber-500/20 transition"
                  >
                    <Shield className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                    <span className="truncate">Admin Dash</span>
                  </Link>
                  <Link
                    to="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 hover:bg-amber-500/20 transition"
                  >
                    <User className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                    <span className="truncate">Users</span>
                  </Link>
                  <Link
                    to="/admin/system-health"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 hover:bg-amber-500/20 transition"
                  >
                    <BarChart2 className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
                    <span className="truncate">System Health</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Sign Out on Mobile */}
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 font-semibold text-xs transition"
              >
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
