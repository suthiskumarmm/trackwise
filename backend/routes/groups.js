const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Group = require('../models/Group');
const User = require('../models/User');

// GET /api/groups
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user.id })
      .populate('members', 'name email')
      .populate('createdBy', 'name email');
    res.json(groups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, memberEmails } = req.body;
    const memberIds = [req.user.id];

    if (memberEmails?.length) {
      const users = await User.find({ email: { $in: memberEmails } });
      users.forEach(u => {
        if (u._id.toString() !== req.user.id) memberIds.push(u._id);
      });
    }

    const group = await Group.create({
      name, description, createdBy: req.user.id, members: memberIds
    });
    await group.populate('members', 'name email');
    res.status(201).json(group);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/groups/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, members: req.user.id })
      .populate('members', 'name email')
      .populate('expenses.paidBy', 'name email')
      .populate('expenses.splits.user', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/groups/:id/expenses
router.post('/:id/expenses', auth, async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, members: req.user.id });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const { title, amount, category, description, splitType } = req.body;
    const memberCount = group.members.length;
    const splitAmount = parseFloat((amount / memberCount).toFixed(2));

    const splits = group.members.map(memberId => ({
      user: memberId,
      amount: splitAmount,
      paid: memberId.toString() === req.user.id
    }));

    group.expenses.push({ title, amount, category, description, paidBy: req.user.id, splits });
    await group.save();
    await group.populate('expenses.paidBy', 'name email');
    await group.populate('expenses.splits.user', 'name email');

    res.status(201).json(group.expenses[group.expenses.length - 1]);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/groups/:id/expenses/:expId/settle
router.put('/:id/expenses/:expId/settle', auth, async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, members: req.user.id });
    if (!group) return res.status(404).json({ message: 'Group not found' });

    const expense = group.expenses.id(req.params.expId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    const split = expense.splits.find(s => s.user.toString() === req.user.id);
    if (split) split.paid = true;

    await group.save();
    res.json({ message: 'Settled' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/groups/:id/balances
router.get('/:id/balances', auth, async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, members: req.user.id })
      .populate('members', 'name email')
      .populate('expenses.paidBy', 'name email')
      .populate('expenses.splits.user', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });

    // Calculate net balances
    const balances = {};
    group.members.forEach(m => { balances[m._id.toString()] = { user: m, net: 0 }; });

    group.expenses.forEach(exp => {
      const payerId = exp.paidBy._id.toString();
      exp.splits.forEach(split => {
        const splitUserId = split.user._id.toString();
        if (!split.paid && splitUserId !== payerId) {
          balances[payerId].net += split.amount;
          balances[splitUserId].net -= split.amount;
        }
      });
    });

    res.json(Object.values(balances));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
