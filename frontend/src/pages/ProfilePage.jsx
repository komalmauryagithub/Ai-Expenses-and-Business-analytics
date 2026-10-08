import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Shield, Key, Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();

  // Profile Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    setProfileErr('');

    if (!name.trim() || !email.trim()) {
      setProfileErr('Name and Email are required.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await updateProfile(name, email);
      setProfileMsg(res.message || 'Profile updated successfully.');
    } catch (err) {
      console.error('Update profile error:', err);
      if (err.response && err.response.data) {
        setProfileErr(err.response.data.message || 'Failed to update profile.');
      } else {
        setProfileErr('Unable to reach backend API.');
      }
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassMsg('');
    setPassErr('');

    if (!currentPassword) {
      setPassErr('Current password is required.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPassErr('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassErr('Password confirmation does not match.');
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changePassword(currentPassword, newPassword, confirmPassword);
      setPassMsg(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Change password error:', err);
      if (err.response && err.response.data) {
        setPassErr(err.response.data.message || 'Password change failed.');
      } else {
        setPassErr('Unable to reach backend API.');
      }
    } finally {
      setIsChangingPass(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans w-full overflow-x-hidden">
      <Navbar />

      <main className="flex-grow max-w-4xl w-full mx-auto py-4 sm:py-10 px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <Link to="/dashboard" className="inline-flex items-center text-xs font-semibold text-sky-400 hover:text-sky-300 transition mb-2">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Account Profile & Security</h1>
            <p className="text-sm text-slate-400 mt-1">Manage your identity and authentication security settings</p>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
            <Shield className={`w-5 h-5 ${user?.role === 'admin' ? 'text-amber-400' : 'text-sky-400'}`} />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Role: <span className={user?.role === 'admin' ? 'text-amber-400 font-bold' : 'text-sky-400 font-bold'}>{user?.role}</span>
            </span>
          </div>
        </div>

        {/* Profile Details Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white flex items-center mb-4">
            <User className="w-5 h-5 text-sky-400 mr-2" /> Personal Information
          </h2>

          {profileMsg && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>{profileMsg}</div>
            </div>
          )}

          {profileErr && (
            <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>{profileErr}</div>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm rounded-xl shadow-md transition flex items-center disabled:opacity-50"
              >
                {isUpdatingProfile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  'Save Profile Changes'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold text-white flex items-center mb-4">
            <Key className="w-5 h-5 text-indigo-400 mr-2" /> Change Password
          </h2>

          {passMsg && (
            <div className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-300 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <div>{passMsg}</div>
            </div>
          )}

          {passErr && (
            <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <div>{passErr}</div>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isChangingPass}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm rounded-xl shadow-md transition flex items-center disabled:opacity-50"
              >
                {isChangingPass ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>

      </main>
    </div>
  );
};

export default ProfilePage;
