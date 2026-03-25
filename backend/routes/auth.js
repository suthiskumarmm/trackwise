const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const { isMongo } = require('../db');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'secret', { expiresIn: process.env.JWT_EXPIRE || '7d' });

const getUser = () => isMongo() ? require('../models/mongo/User') : require('../models/User');

router.post('/register', async (req, res) => {
  try {
    const User = getUser();
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });

    let exists;
    if (isMongo()) exists = await User.findOne({ email });
    else exists = await User.findOne({ where: { email } });
    if (exists) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password });
    const token = signToken(isMongo() ? user._id : user.id);
    res.status(201).json({ token, user: { id: isMongo() ? user._id : user.id, name: user.name, email: user.email, currency: user.currency, budget: user.budget } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const User = getUser();
    const { email, password } = req.body;
    let user;
    if (isMongo()) user = await User.findOne({ email });
    else user = await User.findOne({ where: { email } });
    if (!user || !(await user.matchPassword(password))) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(isMongo() ? user._id : user.id);
    res.json({ token, user: { id: isMongo() ? user._id : user.id, name: user.name, email: user.email, currency: user.currency, budget: user.budget } });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/me', auth, async (req, res) => {
  try {
    const User = getUser();
    let user;
    if (isMongo()) user = await User.findById(req.user.id).select('-password');
    else user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
    res.json(user);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
