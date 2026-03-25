const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isMongo } = require('../db');

router.get('/', auth, async (req, res) => {
  try {
    const { category, type, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    if (isMongo()) {
      const Expense = require('../models/mongo/Expense');
      const query = { user: req.user.id };
      if (category) query.category = category;
      if (type) query.type = type;
      if (startDate || endDate) { query.date = {}; if (startDate) query.date.$gte = new Date(startDate); if (endDate) query.date.$lte = new Date(endDate); }
      if (search) query.title = { $regex: search, $options: 'i' };
      const total = await Expense.countDocuments(query);
      const expenses = await Expense.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(Number(limit));
      return res.json({ expenses, total, page: Number(page), pages: Math.ceil(total / limit) });
    } else {
      const { Op } = require('sequelize');
      const Expense = require('../models/Expense');
      const where = { userId: req.user.id };
      if (category) where.category = category;
      if (type) where.type = type;
      if (startDate || endDate) { where.date = {}; if (startDate) where.date[Op.gte] = new Date(startDate); if (endDate) where.date[Op.lte] = new Date(endDate); }
      if (search) where.title = { [Op.like]: `%${search}%` };
      const { count, rows } = await Expense.findAndCountAll({ where, order: [['date', 'DESC']], limit: Number(limit), offset: (page - 1) * limit });
      return res.json({ expenses: rows, total: count, page: Number(page), pages: Math.ceil(count / limit) });
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    if (isMongo()) {
      const Expense = require('../models/mongo/Expense');
      const expense = await Expense.create({ ...req.body, user: req.user.id });
      return res.status(201).json(expense);
    } else {
      const Expense = require('../models/Expense');
      const expense = await Expense.create({ ...req.body, userId: req.user.id });
      return res.status(201).json(expense);
    }
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/:id', auth, async (req, res) => {
  try {
    if (isMongo()) {
      const Expense = require('../models/mongo/Expense');
      const expense = await Expense.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true });
      if (!expense) return res.status(404).json({ message: 'Not found' });
      return res.json(expense);
    } else {
      const Expense = require('../models/Expense');
      const expense = await Expense.findOne({ where: { id: req.params.id, userId: req.user.id } });
      if (!expense) return res.status(404).json({ message: 'Not found' });
      await expense.update(req.body);
      return res.json(expense);
    }
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (isMongo()) {
      const Expense = require('../models/mongo/Expense');
      const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });
      if (!expense) return res.status(404).json({ message: 'Not found' });
    } else {
      const Expense = require('../models/Expense');
      const deleted = await Expense.destroy({ where: { id: req.params.id, userId: req.user.id } });
      if (!deleted) return res.status(404).json({ message: 'Not found' });
    }
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
