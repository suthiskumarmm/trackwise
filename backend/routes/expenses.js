const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');

// GET /api/expenses - list with filters
router.get('/', auth, async (req, res) => {
  try {
    const { category, type, startDate, endDate, search, page = 1, limit = 20 } = req.query;
    const query = { user: req.user.id };

    if (category) query.category = category;
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (search) query.title = { $regex: search, $options: 'i' };

    const total = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ expenses, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/expenses
router.post('/', auth, async (req, res) => {
  try {
    const expense = await Expense.create({ ...req.body, user: req.user.id });
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/expenses/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
