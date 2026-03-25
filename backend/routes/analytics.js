const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isMongo } = require('../db');

router.get('/summary', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    if (isMongo()) {
      const Expense = require('../models/mongo/Expense');
      const mongoose = require('mongoose');
      const uid = mongoose.Types.ObjectId.createFromHexString(req.user.id);
      const [te, ti, tm, tlm] = await Promise.all([
        Expense.aggregate([{ $match: { user: uid, type: 'expense' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Expense.aggregate([{ $match: { user: uid, type: 'income' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Expense.aggregate([{ $match: { user: uid, type: 'expense', date: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Expense.aggregate([{ $match: { user: uid, type: 'expense', date: { $gte: startOfLastMonth, $lte: endOfLastMonth } } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
      ]);
      const thisMonth = tm[0]?.total || 0, lastMonth = tlm[0]?.total || 0;
      return res.json({ totalExpense: te[0]?.total || 0, totalIncome: ti[0]?.total || 0, balance: (ti[0]?.total || 0) - (te[0]?.total || 0), thisMonthExpense: thisMonth, lastMonthExpense: lastMonth, monthlyChange: Number(lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : 0) });
    } else {
      const { Op } = require('sequelize');
      const Expense = require('../models/Expense');
      const [te, ti, tm, tlm] = await Promise.all([
        Expense.sum('amount', { where: { userId: req.user.id, type: 'expense' } }),
        Expense.sum('amount', { where: { userId: req.user.id, type: 'income' } }),
        Expense.sum('amount', { where: { userId: req.user.id, type: 'expense', date: { [Op.gte]: startOfMonth } } }),
        Expense.sum('amount', { where: { userId: req.user.id, type: 'expense', date: { [Op.between]: [startOfLastMonth, endOfLastMonth] } } })
      ]);
      const thisMonth = tm || 0, lastMonth = tlm || 0;
      return res.json({ totalExpense: te || 0, totalIncome: ti || 0, balance: (ti || 0) - (te || 0), thisMonthExpense: thisMonth, lastMonthExpense: lastMonth, monthlyChange: Number(lastMonth > 0 ? (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1) : 0) });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/by-category', auth, async (req, res) => {
  try {
    if (isMongo()) {
      const Expense = require('../models/mongo/Expense');
      const mongoose = require('mongoose');
      const { startDate, endDate } = req.query;
      const match = { user: mongoose.Types.ObjectId.createFromHexString(req.user.id), type: 'expense' };
      if (startDate || endDate) { match.date = {}; if (startDate) match.date.$gte = new Date(startDate); if (endDate) match.date.$lte = new Date(endDate); }
      const data = await Expense.aggregate([{ $match: match }, { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } }, { $sort: { total: -1 } }]);
      return res.json(data.map(d => ({ category: d._id, total: d.total, count: d.count })));
    } else {
      const { Op, fn, col, literal } = require('sequelize');
      const Expense = require('../models/Expense');
      const { startDate, endDate } = req.query;
      const where = { userId: req.user.id, type: 'expense' };
      if (startDate || endDate) { where.date = {}; if (startDate) where.date[Op.gte] = new Date(startDate); if (endDate) where.date[Op.lte] = new Date(endDate); }
      const data = await Expense.findAll({ where, attributes: ['category', [fn('SUM', col('amount')), 'total'], [fn('COUNT', col('id')), 'count']], group: ['category'], order: [[literal('total'), 'DESC']] });
      return res.json(data.map(d => ({ category: d.category, total: parseFloat(d.dataValues.total), count: parseInt(d.dataValues.count) })));
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/monthly-trend', auth, async (req, res) => {
  try {
    const start = new Date(); start.setMonth(start.getMonth() - 5); start.setDate(1);
    if (isMongo()) {
      const Expense = require('../models/mongo/Expense');
      const mongoose = require('mongoose');
      const data = await Expense.aggregate([
        { $match: { user: mongoose.Types.ObjectId.createFromHexString(req.user.id), date: { $gte: start } } },
        { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' }, total: { $sum: '$amount' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);
      return res.json(data);
    } else {
      const { Op, fn, col } = require('sequelize');
      const Expense = require('../models/Expense');
      const data = await Expense.findAll({
        where: { userId: req.user.id, date: { [Op.gte]: start } },
        attributes: [[fn('YEAR', col('date')), 'year'], [fn('MONTH', col('date')), 'month'], 'type', [fn('SUM', col('amount')), 'total']],
        group: [fn('YEAR', col('date')), fn('MONTH', col('date')), 'type'],
        order: [[fn('YEAR', col('date')), 'ASC'], [fn('MONTH', col('date')), 'ASC']]
      });
      return res.json(data.map(d => ({ _id: { year: d.dataValues.year, month: d.dataValues.month, type: d.type }, total: parseFloat(d.dataValues.total) })));
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
