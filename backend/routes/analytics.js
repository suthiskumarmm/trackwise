const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');

// GET /api/analytics/summary
router.get('/summary', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [totalExpense, totalIncome, monthExpense, lastMonthExpense] = await Promise.all([
      Expense.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), type: 'income' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), type: 'expense', date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Expense.aggregate([
        { $match: { user: require('mongoose').Types.ObjectId.createFromHexString(userId), type: 'expense', date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const thisMonth = monthExpense[0]?.total || 0;
    const lastMonth = lastMonthExpense[0]?.total || 0;
    const change = lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : 0;

    res.json({
      totalExpense: totalExpense[0]?.total || 0,
      totalIncome: totalIncome[0]?.total || 0,
      balance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
      thisMonthExpense: thisMonth,
      lastMonthExpense: lastMonth,
      monthlyChange: Number(change)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/by-category
router.get('/by-category', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const match = { user: require('mongoose').Types.ObjectId.createFromHexString(req.user.id), type: 'expense' };
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }

    const data = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);

    res.json(data.map(d => ({ category: d._id, total: d.total, count: d.count })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/analytics/monthly-trend
router.get('/monthly-trend', auth, async (req, res) => {
  try {
    const months = 6;
    const start = new Date();
    start.setMonth(start.getMonth() - months + 1);
    start.setDate(1);

    const data = await Expense.aggregate([
      {
        $match: {
          user: require('mongoose').Types.ObjectId.createFromHexString(req.user.id),
          date: { $gte: start }
        }
      },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
