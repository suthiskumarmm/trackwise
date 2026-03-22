import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate, CATEGORIES } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function GroupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', amount: '', category: 'Other', description: '' });
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    try {
      const [g, b] = await Promise.all([api.get(`/groups/${id}`), api.get(`/groups/${id}/balances`)]);
      setGroup(g.data);
      setBalances(b.data);
    } catch { toast.error('Failed to load group'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    setAdding(true);
    try {
      await api.post(`/groups/${id}/expenses`, form);
      toast.success('Expense added and split equally');
      setShowModal(false);
      setForm({ title: '', amount: '', category: 'Other', description: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add expense');
    } finally { setAdding(false); }
  };

  const handleSettle = async (expId) => {
    try {
      await api.put(`/groups/${id}/expenses/${expId}/settle`);
      toast.success('Marked as settled');
      load();
    } catch { toast.error('Failed to settle'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!group) return <div className="text-center py-16 text-gray-400">Group not found</div>;

  const currency = user?.currency || 'USD';
  const myBalance = balances.find(b => b.user._id === user?.id);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center gap-3">
        <Link to="/groups" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-all">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{group.name}</h1>
          {group.description && <p className="text-sm text-gray-500 dark:text-gray-400">{group.description}</p>}
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-all">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Members */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Members ({group.members.length})</h2>
          <div className="space-y-2">
            {group.members.map(m => (
              <div key={m._id} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold">
                  {m.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Balances */}
        <div className="md:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Balances</h2>
          <div className="space-y-2">
            {balances.map(b => (
              <div key={b.user._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary-500 flex items-center justify-center text-white text-xs font-semibold">
                    {b.user.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{b.user.name}</span>
                </div>
                <span className={`text-sm font-semibold ${b.net > 0 ? 'text-green-500' : b.net < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                  {b.net > 0 ? '+' : ''}{formatCurrency(b.net, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Expenses ({group.expenses.length})</h2>
        {group.expenses.length > 0 ? (
          <div className="space-y-3">
            {[...group.expenses].reverse().map(exp => {
              const mySplit = exp.splits.find(s => s.user._id === user?.id);
              return (
                <div key={exp._id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{exp.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Paid by {exp.paidBy?.name} · {formatDate(exp.date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(exp.amount, currency)}</p>
                      <p className="text-xs text-gray-400">Total</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {exp.splits.map(s => (
                      <div key={s.user._id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                        s.paid ? 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {s.paid ? <CheckCircle size={11} /> : null}
                        {s.user.name}: {formatCurrency(s.amount, currency)}
                      </div>
                    ))}
                  </div>
                  {mySplit && !mySplit.paid && exp.paidBy?._id !== user?.id && (
                    <button onClick={() => handleSettle(exp._id)}
                      className="mt-3 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-all">
                      Mark as settled
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-8">No expenses yet. Add one to split with the group.</p>
        )}
      </div>

      {/* Add expense modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Group Expense</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddExpense} className="p-5 space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3">
                💡 The expense will be split equally among all {group.members.length} members.
              </p>
              <input required placeholder="Title" value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <input required type="number" step="0.01" min="0" placeholder="Total amount"
                value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
              </select>
              <textarea placeholder="Description (optional)" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={adding}
                  className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-all disabled:opacity-60">
                  {adding ? 'Adding...' : 'Add & Split'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
