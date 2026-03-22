const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['expense', 'income'], default: 'expense' },
  category: {
    type: String,
    enum: ['Food', 'Travel', 'Bills', 'Shopping', 'Entertainment', 'Health', 'Education', 'Other'],
    default: 'Other'
  },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  tags: [String],
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
