import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { User, Lock, Moon, Sun, DollarSign } from 'lucide-react';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD', 'CHF'];

export default function Settings() {
  const { user, updateUser, darkMode, setDarkMode } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || '', currency: user?.currency || 'USD', budget: user?.budget || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.put('/users/profile', { ...profile, budget: Number(profile.budget) || 0 });
      updateUser(res.data);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally { setSavingProfile(false); }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) return toast.error('Passwords do not match');
    if (passwords.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setSavingPw(true);
    try {
      await api.put('/users/password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      toast.success('Password updated');
      setPasswords({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update password');
    } finally { setSavingPw(false); }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>

      {/* Profile */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <User size={16} className="text-primary-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Profile</h2>
        </div>
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Full Name</label>
            <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
            <input value={user?.email} disabled
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-sm text-gray-400 cursor-not-allowed" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Currency</label>
              <select value={profile.currency} onChange={e => setProfile(p => ({ ...p, currency: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Monthly Budget</label>
              <input type="number" min="0" placeholder="0 = no limit" value={profile.budget}
                onChange={e => setProfile(p => ({ ...p, budget: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          </div>
          <button type="submit" disabled={savingProfile}
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60">
            {savingProfile ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Appearance */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          {darkMode ? <Moon size={16} className="text-primary-500" /> : <Sun size={16} className="text-primary-500" />}
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Dark Mode</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark theme</p>
          </div>
          <button onClick={() => setDarkMode(!darkMode)}
            className={`relative w-11 h-6 rounded-full transition-all ${darkMode ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${darkMode ? 'left-5.5 translate-x-0.5' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={16} className="text-primary-500" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordSave} className="space-y-4">
          {['currentPassword', 'newPassword', 'confirm'].map((field, i) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
              </label>
              <input type="password" value={passwords[field]}
                onChange={e => setPasswords(p => ({ ...p, [field]: e.target.value }))}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
          ))}
          <button type="submit" disabled={savingPw}
            className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-all disabled:opacity-60">
            {savingPw ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
