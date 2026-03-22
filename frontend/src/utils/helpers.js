export const formatCurrency = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);

export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#f97316' },
  { name: 'Travel', icon: '✈️', color: '#3b82f6' },
  { name: 'Bills', icon: '📄', color: '#ef4444' },
  { name: 'Shopping', icon: '🛍️', color: '#a855f7' },
  { name: 'Entertainment', icon: '🎬', color: '#ec4899' },
  { name: 'Health', icon: '💊', color: '#22c55e' },
  { name: 'Education', icon: '📚', color: '#06b6d4' },
  { name: 'Other', icon: '📦', color: '#6b7280' }
];

export const getCategoryMeta = (name) =>
  CATEGORIES.find(c => c.name === name) || CATEGORIES[CATEGORIES.length - 1];

export const CHART_COLORS = ['#6366f1', '#f97316', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#ef4444', '#06b6d4'];
