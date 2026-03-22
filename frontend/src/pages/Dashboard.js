import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, DollarSign, Plus, ArrowRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../components/StatCard';
import ExpenseCard from '../components/ExpenseCard';
import ExpenseModal from '../components/ExpenseModal';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';
import api from '../utils/api';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [trend, setTrend] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [s, e, t] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/expenses?limit=5'),
        api.get('/analytics/monthly-trend')
      ]);
      setSummary(s.data);
      setRecent(e.data.expenses);

      // Process trend data for chart
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const map = {};
      t.data.forEach(d => {
        const key = `${months[d._id.month - 1]} ${d._id.year}`;
        if (!map[key]) map[key] = { month: key, expense: 0, income: 0 };
        map[key][d._id.type] = d.total;
      });
      setTrend(Object.values(map));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const currency = user?.currency || 'USD';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Here's your financial overview</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-all">
          <Plus size={16} /> Add Expense
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Balance" value={formatCurrency(summary?.balance || 0, currency)}
          icon={Wallet} color="bg-primary-500"
          change={summary?.monthlyChange} changeLabel="vs last month" />
        <StatCard title="Total Income" value={formatCurrency(summary?.totalIncome || 0, currency)}
          icon={TrendingUp} color="bg-green-500" />
        <StatCard title="Total Expenses" value={formatCurrency(summary?.totalExpense || 0, currency)}
          icon={TrendingDown} color="bg-red-500" />
        <StatCard title="This Month" value={formatCurrency(summary?.thisMonthExpense || 0, currency)}
          icon={DollarSign} color="bg-orange-500" />
      </div>

      {/* Budget alert */}
      {user?.budget > 0 && summary?.thisMonthExpense > user.budget * 0.8 && (
        <div className={`p-4 rounded-xl border text-sm font-medium ${
          summary.thisMonthExpense >= user.budget
            ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400'
            : 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 text-yellow-600 dark:text-yellow-400'
        }`}>
          {summary.thisMonthExpense >= user.budget
            ? `⚠️ You've exceeded your monthly budget of ${formatCurrency(user.budget, currency)}`
            : `⚡ You've used ${Math.round((summary.thisMonthExpense / user.budget) * 100)}% of your monthly budget`}
        </div>
      )}

      {/* Smart insight */}
      {summary?.monthlyChange !== 0 && (
        <div className="p-4 bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 rounded-xl text-sm text-primary-700 dark:text-primary-300">
          💡 You spent {Math.abs(summary.monthlyChange)}% {summary.monthlyChange > 0 ? 'more' : 'less'} this month compared to last month.
          {summary.monthlyChange > 20 ? ' Consider reviewing your spending habits.' : ' Keep it up!'}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Spending Trend</h2>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} name="Expense" />
                <Area type="monotone" dataKey="income" stroke="#22c55e" fill="url(#incGrad)" strokeWidth={2} name="Income" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Recent */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Recent</h2>
            <Link to="/expenses" className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-600 font-medium">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recent.length > 0
              ? recent.map(e => <ExpenseCard key={e._id} expense={e} />)
              : <p className="text-sm text-gray-400 text-center py-8">No transactions yet</p>
            }
          </div>
        </div>
      </div>

      {showModal && <ExpenseModal onClose={() => setShowModal(false)} onSaved={load} />}
    </div>
  );
}
