import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Users, ArrowRight, X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatCurrency } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', memberEmails: '' });
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/groups');
      setGroups(res.data);
    } catch { toast.error('Failed to load groups'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const memberEmails = form.memberEmails.split(',').map(e => e.trim()).filter(Boolean);
      await api.post('/groups', { name: form.name, description: form.description, memberEmails });
      toast.success('Group created');
      setShowModal(false);
      setForm({ name: '', description: '', memberEmails: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Split expenses with friends and family</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-all">
          <Plus size={16} /> New Group
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : groups.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <Link key={g._id} to={`/groups/${g._id}`}
              className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-500/20 rounded-xl flex items-center justify-center">
                  <Users size={18} className="text-primary-500" />
                </div>
                <ArrowRight size={16} className="text-gray-400 group-hover:text-primary-500 transition-colors" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{g.name}</h3>
              {g.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{g.description}</p>}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{g.members.length} members</span>
                <span>{g.expenses?.length || 0} expenses</span>
              </div>
              <div className="flex -space-x-2 mt-3">
                {g.members.slice(0, 4).map(m => (
                  <div key={m._id} className="w-7 h-7 rounded-full bg-primary-500 border-2 border-white dark:border-gray-900 flex items-center justify-center text-white text-xs font-semibold">
                    {m.name?.[0]?.toUpperCase()}
                  </div>
                ))}
                {g.members.length > 4 && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-semibold">
                    +{g.members.length - 4}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">No groups yet. Create one to start splitting expenses.</p>
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Group</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <input required placeholder="Group name" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <textarea placeholder="Description (optional)" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              <div>
                <input placeholder="Member emails (comma separated)" value={form.memberEmails}
                  onChange={e => setForm(f => ({ ...f, memberEmails: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <p className="text-xs text-gray-400 mt-1">Members must already have a TrackWise account</p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-all disabled:opacity-60">
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
