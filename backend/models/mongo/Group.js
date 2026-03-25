const mongoose = require('mongoose');

const splitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount: Number,
  paid: { type: Boolean, default: false }
});

const groupExpenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  amount: { type: Number, required: true },
  paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  splits: [splitSchema],
  date: { type: Date, default: Date.now },
  category: { type: String, default: 'Other' },
  description: { type: String, default: '' }
});

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expenses: [groupExpenseSchema]
}, { timestamps: true });

module.exports = mongoose.models.Group || mongoose.model('Group', groupSchema);
