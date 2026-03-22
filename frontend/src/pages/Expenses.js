import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Filter, Download, X } from 'lucide-react';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseModal from '../components/ExpenseModal';
import { CATEGORIES } from '../utils/helpers';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ search: '', category: '', type: '', startDate: '', endDate: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) };
      const res = await api.get('/expenses', { params });
      setExpenses(res.data.expenses);
      setTotal(res.data.total);
      setPages(res.data.pages);
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleEdit = (expense) => { setEditing(expense); setShowModal(true); };

  const exportCSV = () => {
    const headers = ['Title', 'Amount', 'Type', 'Category', 'Date', 'Description'];
    const rows = expenses.map(e => [e.title, e.amount, e.type, e.category, new Date(e.date).toLocaleDateString(), e.description || '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'expenses.csv'; a.click();
  };

  const clearFilters = () => setFilters({ search: '', category: '', type: '', startDate: '', endDate: '' });
  const hasFilters = Object.values(filters).some(v => v);

  return (
    <div className="space-y-5 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
            <Download size={15} /> Export
          </button>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-all">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input placeholder="Search transactions..." value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all">
              <X size={14} /> Clear
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
          <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value }))}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500">
            <option value="">All Types</option>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
          <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
            className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500" />
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : expenses.length > 0 ? (
        <div className="space-y-2">
          {expenses.map(e => (
            <ExpenseCard key={e._id} expense={e} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Filter size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No expenses found</p>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                p === page ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {showModal && <ExpenseModal expense={editing} onClose={() => { setShowModal(false); setEditing(null); }} onSaved={load} />}
    </div>
  );
}
