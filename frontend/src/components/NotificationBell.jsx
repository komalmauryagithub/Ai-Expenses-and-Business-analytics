import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Bell, Check, CheckCheck, Trash2, AlertTriangle, Info, AlertCircle, ExternalLink } from 'lucide-react';

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data.success) {
        setUnreadCount(res.data.data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notification unread count:', err);
    }
  };

  const fetchRecentNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications?per_page=5');
      if (res.data.success) {
        const rawData = res.data.data;
        const items = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.items || []);
        setNotifications(items);
        setUnreadCount(res.data.unread_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch recent notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchRecentNotifications();
    }
  }, [isOpen]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.post('/notifications/mark-read', { ids: [id] });
      if (res.data.success) {
        setNotifications(prev => Array.isArray(prev) ? prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n) : []);
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.post('/notifications/mark-all-read');
      if (res.data.success) {
        setNotifications(prev => Array.isArray(prev) ? prev.map(n => ({ ...n, read_at: new Date().toISOString() })) : []);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'info':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const notifList = Array.isArray(notifications) ? notifications : [];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center justify-center"
        aria-label="Notifications"
        title="Notification Center"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl z-50 overflow-hidden backdrop-blur-lg">
          {/* Dropdown Header */}
          <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-white text-xs">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-semibold">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading notifications...</div>
            ) : notifList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                <Bell className="w-6 h-6 mx-auto text-slate-600 mb-1" />
                <p>No notifications right now.</p>
              </div>
            ) : (
              notifList.map((item) => {
                const isUnread = !item.read_at;
                return (
                  <div
                    key={item.id}
                    className={`p-3 text-xs transition ${isUnread ? 'bg-slate-800/40 hover:bg-slate-800/70' : 'hover:bg-slate-800/30'}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {getPriorityIcon(item.priority || item.type)}
                        <span className="font-semibold text-white truncate max-w-[180px]">{item.title}</span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${getPriorityBadge(item.priority || 'info')}`}>
                        {item.priority || 'info'}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-snug mb-2 pl-5">{item.message}</p>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pl-5">
                      <span>{new Date(item.created_at).toLocaleString()}</span>
                      {isUnread && (
                        <button
                          onClick={(e) => handleMarkAsRead(item.id, e)}
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
                        >
                          <Check className="w-3 h-3" /> Mark read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-2.5 bg-slate-950/90 border-t border-slate-800 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition py-1"
            >
              <span>View All Notifications</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
