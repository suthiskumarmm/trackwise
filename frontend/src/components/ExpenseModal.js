import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CATEGORIES } from '../utils/helpers';
import api from '../utils/api';
import toast from 'react-hot-toast';

const defaultForm = {
  title: '', amount: '', type: 'expense', category: 'Other',
  description: '', date: new Date().toISOString().split('T')[0]
};

export default function ExpenseModal({ expense, onClose, onSaved }) {
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (expense) {
      setForm({
        title: expense.title,
        amount: expense.amount,
        type: expense.type,
        category: expense.category,
        description: expense.description || '',
        date: new Date(expense.date).toISOString().split('T')[0]
      });
    }
  }, [expense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (expense) {
        await api.put(`/expenses/${expense._id}`, form);
        toast.success('Expense updated');
      } else {
        await api.post('/expenses', form);
        toast.success('Expense added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-xl animate-fadeIn">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {expense ? 'Edit Expense' : 'Add Expense'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {['expense', 'income'].map(t => (
              <button key={t} type="button"
                onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2 text-sm font-medium capitalize transition-all ${
                  form.type === t
                    ? t === 'expense' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}>
                {t}
              </button>
            ))}
          </div>

          <input required placeholder="Title" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />

          <input required type="number" step="0.01" min="0" placeholder="Amount"
            value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />

          <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
            {CATEGORIES.map(c => (
              <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
            ))}
          </select>

          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />

          <textarea placeholder="Description (optional)" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-all disabled:opacity-60">
              {loading ? 'Saving...' : expense ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
