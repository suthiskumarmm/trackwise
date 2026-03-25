const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isMongo } = require('../db');

// ---- MONGO HANDLERS ----
const mongoHandlers = {
  list: async (req, res) => {
    const Group = require('../models/mongo/Group');
    const User = require('../models/mongo/User');
    const groups = await Group.find({ members: req.user.id }).populate('members', 'name email').populate('createdBy', 'name email');
    res.json(groups);
  },
  create: async (req, res) => {
    const Group = require('../models/mongo/Group');
    const User = require('../models/mongo/User');
    const { name, description, memberEmails } = req.body;
    const memberIds = [req.user.id];
    if (memberEmails?.length) {
      const users = await User.find({ email: { $in: memberEmails } });
      users.forEach(u => { if (u._id.toString() !== req.user.id) memberIds.push(u._id); });
    }
    const group = await Group.create({ name, description, createdBy: req.user.id, members: memberIds });
    await group.populate('members', 'name email');
    res.status(201).json(group);
  },
  detail: async (req, res) => {
    const Group = require('../models/mongo/Group');
    const group = await Group.findOne({ _id: req.params.id, members: req.user.id })
      .populate('members', 'name email').populate('expenses.paidBy', 'name email').populate('expenses.splits.user', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    res.json(group);
  },
  addExpense: async (req, res) => {
    const Group = require('../models/mongo/Group');
    const group = await Group.findOne({ _id: req.params.id, members: req.user.id });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const { title, amount, category, description } = req.body;
    const splitAmount = parseFloat((amount / group.members.length).toFixed(2));
    const splits = group.members.map(m => ({ user: m, amount: splitAmount, paid: m.toString() === req.user.id }));
    group.expenses.push({ title, amount, category, description, paidBy: req.user.id, splits });
    await group.save();
    res.status(201).json(group.expenses[group.expenses.length - 1]);
  },
  settle: async (req, res) => {
    const Group = require('../models/mongo/Group');
    const group = await Group.findOne({ _id: req.params.id, members: req.user.id });
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const expense = group.expenses.id(req.params.expId);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    const split = expense.splits.find(s => s.user.toString() === req.user.id);
    if (split) split.paid = true;
    await group.save();
    res.json({ message: 'Settled' });
  },
  balances: async (req, res) => {
    const Group = require('../models/mongo/Group');
    const group = await Group.findOne({ _id: req.params.id, members: req.user.id })
      .populate('members', 'name email').populate('expenses.paidBy', 'name email').populate('expenses.splits.user', 'name email');
    if (!group) return res.status(404).json({ message: 'Group not found' });
    const balances = {};
    group.members.forEach(m => { balances[m._id.toString()] = { user: m, net: 0 }; });
    group.expenses.forEach(exp => {
      const payerId = exp.paidBy._id.toString();
      exp.splits.forEach(s => {
        if (!s.paid && s.user._id.toString() !== payerId) {
          balances[payerId].net += s.amount;
          balances[s.user._id.toString()].net -= s.amount;
        }
      });
    });
    res.json(Object.values(balances));
  }
};

// ---- MYSQL HANDLERS ----
const mysqlHandlers = {
  list: async (req, res) => {
    const { Group, GroupMember } = require('../models/Group');
    const User = require('../models/User');
    const memberships = await GroupMember.findAll({ where: { userId: req.user.id } });
    const groups = await Group.findAll({ where: { id: memberships.map(m => m.groupId) } });
    res.json(groups);
  },
  create: async (req, res) => {
    const { Group, GroupMember } = require('../models/Group');
    const User = require('../models/User');
    const { name, description, memberEmails } = req.body;
    const group = await Group.create({ name, description, createdBy: req.user.id });
    await GroupMember.create({ groupId: group.id, userId: req.user.id });
    if (memberEmails?.length) {
      const users = await User.findAll({ where: { email: memberEmails } });
      for (const u of users) if (u.id !== req.user.id) await GroupMember.create({ groupId: group.id, userId: u.id });
    }
    res.status(201).json(group);
  },
  detail: async (req, res) => {
    const { Group, GroupMember, GroupExpense, GroupSplit } = require('../models/Group');
    const User = require('../models/User');
    const member = await GroupMember.findOne({ where: { groupId: req.params.id, userId: req.user.id } });
    if (!member) return res.status(404).json({ message: 'Group not found' });
    const group = await Group.findByPk(req.params.id);
    const members = await GroupMember.findAll({ where: { groupId: req.params.id } });
    const memberUsers = await User.findAll({ where: { id: members.map(m => m.userId) }, attributes: ['id', 'name', 'email'] });
    const expenses = await GroupExpense.findAll({ where: { groupId: req.params.id }, order: [['date', 'DESC']] });
    const expensesWithSplits = await Promise.all(expenses.map(async exp => {
      const splits = await GroupSplit.findAll({ where: { groupExpenseId: exp.id } });
      const splitsWithUsers = await Promise.all(splits.map(async s => {
        const u = await User.findByPk(s.userId, { attributes: ['id', 'name', 'email'] });
        return { ...s.toJSON(), user: u };
      }));
      const paidByUser = await User.findByPk(exp.paidBy, { attributes: ['id', 'name', 'email'] });
      return { ...exp.toJSON(), paidBy: paidByUser, splits: splitsWithUsers };
    }));
    res.json({ ...group.toJSON(), members: memberUsers, expenses: expensesWithSplits });
  },
  addExpense: async (req, res) => {
    const { GroupMember, GroupExpense, GroupSplit } = require('../models/Group');
    const member = await GroupMember.findOne({ where: { groupId: req.params.id, userId: req.user.id } });
    if (!member) return res.status(404).json({ message: 'Group not found' });
    const { title, amount, category, description } = req.body;
    const members = await GroupMember.findAll({ where: { groupId: req.params.id } });
    const splitAmount = parseFloat((amount / members.length).toFixed(2));
    const expense = await GroupExpense.create({ groupId: req.params.id, title, amount, category, description, paidBy: req.user.id });
    for (const m of members) await GroupSplit.create({ groupExpenseId: expense.id, userId: m.userId, amount: splitAmount, paid: m.userId === req.user.id });
    res.status(201).json(expense);
  },
  settle: async (req, res) => {
    const { GroupSplit } = require('../models/Group');
    await GroupSplit.update({ paid: true }, { where: { groupExpenseId: req.params.expId, userId: req.user.id } });
    res.json({ message: 'Settled' });
  },
  balances: async (req, res) => {
    const { GroupMember, GroupExpense, GroupSplit } = require('../models/Group');
    const User = require('../models/User');
    const members = await GroupMember.findAll({ where: { groupId: req.params.id } });
    const memberUsers = await User.findAll({ where: { id: members.map(m => m.userId) }, attributes: ['id', 'name', 'email'] });
    const expenses = await GroupExpense.findAll({ where: { groupId: req.params.id } });
    const balances = {};
    memberUsers.forEach(u => { balances[u.id] = { user: u, net: 0 }; });
    for (const exp of expenses) {
      const splits = await GroupSplit.findAll({ where: { groupExpenseId: exp.id } });
      splits.forEach(s => { if (!s.paid && s.userId !== exp.paidBy) { balances[exp.paidBy].net += s.amount; balances[s.userId].net -= s.amount; } });
    }
    res.json(Object.values(balances));
  }
};

const h = (name) => async (req, res) => {
  try {
    if (isMongo()) await mongoHandlers[name](req, res);
    else await mysqlHandlers[name](req, res);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

router.get('/', auth, h('list'));
router.post('/', auth, h('create'));
router.get('/:id', auth, h('detail'));
router.post('/:id/expenses', auth, h('addExpense'));
router.put('/:id/expenses/:expId/settle', auth, h('settle'));
router.get('/:id/balances', auth, h('balances'));

module.exports = router;
