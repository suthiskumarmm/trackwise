import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, getCategoryMeta } from '../utils/helpers';
import { useAuth } from '../context/AuthContext';

export default function ExpenseCard({ expense, onEdit, onDelete }) {
  const { user } = useAuth();
  const meta = getCategoryMeta(expense.category);
  const isIncome = expense.type === 'income';

  return (
    <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 hover:shadow-sm transition-all animate-fadeIn">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ backgroundColor: meta.color + '20' }}>
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{expense.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{expense.category} · {formatDate(expense.date)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={`text-sm font-semibold ${isIncome ? 'text-green-500' : 'text-red-500'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(expense.amount, user?.currency)}
        </p>
      </div>
      {(onEdit || onDelete) && (
        <div className="flex items-center gap-1 flex-shrink-0">
          {onEdit && (
            <button onClick={() => onEdit(expense)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-all">
              <Pencil size={14} />
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(expense._id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
