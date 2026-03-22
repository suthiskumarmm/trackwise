import React, { useEffect, useState, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, CHART_COLORS, getCategoryMeta } from '../utils/helpers';
import api from '../utils/api';

export default function Analytics() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [byCategory, setByCategory] = useState([]);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const currency = user?.currency || 'USD';

  const load = useCallback(async () => {
    try {
      const [s, c, t] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/by-category'),
        api.get('/analytics/monthly-trend')
      ]);
      setSummary(s.data);
      setByCategory(c.data);

      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const map = {};
      t.data.forEach(d => {
        const key = `${months[d._id.month - 1]}`;
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

  const totalCat = byCategory.reduce((s, c) => s + c.total, 0);

  // Smart insights
  const insights = [];
  if (summary?.monthlyChange > 20) insights.push({ type: 'warning', msg: `You spent ${summary.monthlyChange}% more this month than last month.` });
  if (summary?.monthlyChange < -10) insights.push({ type: 'success', msg: `Great job! You spent ${Math.abs(summary.monthlyChange)}% less this month.` });
  if (byCategory[0]) insights.push({ type: 'info', msg: `Your top spending category is ${byCategory[0].category} at ${formatCurrency(byCategory[0].total, currency)}.` });
  if (user?.budget > 0 && summary?.thisMonthExpense > user.budget) insights.push({ type: 'danger', msg: `You've exceeded your monthly budget of ${formatCurrency(user.budget, currency)}.` });

  return (
    <div className="space-y-6 animate-fadeIn">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2">
          {insights.map((ins, i) => (
            <div key={i} className={`p-3.5 rounded-xl text-sm font-medium border ${
              ins.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
              ins.type === 'success' ? 'bg-green-50 dark:bg-green-500/10 border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400' :
              ins.type === 'danger' ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400' :
              'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400'
            }`}>
              {ins.type === 'warning' ? '⚡' : ins.type === 'success' ? '✅' : ins.type === 'danger' ? '⚠️' : '💡'} {ins.msg}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly bar chart */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Monthly Overview</h2>
          {trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v, currency)} />
                <Bar dataKey="expense" fill="#ef4444" radius={[4,4,0,0]} name="Expense" />
                <Bar dataKey="income" fill="#22c55e" radius={[4,4,0,0]} name="Income" />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data yet</div>}
        </div>

        {/* Category pie */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">By Category</h2>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byCategory} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={80} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                  {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, currency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-52 flex items-center justify-center text-gray-400 text-sm">No data yet</div>}
        </div>
      </div>

      {/* Category breakdown table */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Category Breakdown</h2>
        {byCategory.length > 0 ? (
          <div className="space-y-3">
            {byCategory.map((c, i) => {
              const meta = getCategoryMeta(c.category);
              const pct = totalCat > 0 ? (c.total / totalCat) * 100 : 0;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span>{meta.icon}</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{c.category}</span>
                      <span className="text-gray-400 text-xs">({c.count} txns)</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(c.total, currency)}
                      <span className="text-xs text-gray-400 ml-1">{pct.toFixed(1)}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="text-sm text-gray-400 text-center py-8">No expense data yet</p>}
      </div>
    </div>
  );
}
