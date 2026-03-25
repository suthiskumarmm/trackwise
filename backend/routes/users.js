const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isMongo } = require('../db');

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, currency, budget, darkMode } = req.body;
    if (isMongo()) {
      const User = require('../models/mongo/User');
      const user = await User.findByIdAndUpdate(req.user.id, { name, currency, budget, darkMode }, { new: true }).select('-password');
      return res.json(user);
    } else {
      const User = require('../models/User');
      await User.update({ name, currency, budget, darkMode }, { where: { id: req.user.id } });
      const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password'] } });
      return res.json(user);
    }
  } catch (err) { res.status(400).json({ message: err.message }); }
});

router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const User = isMongo() ? require('../models/mongo/User') : require('../models/User');
    const user = isMongo() ? await User.findById(req.user.id) : await User.findByPk(req.user.id);
    if (!(await user.matchPassword(currentPassword))) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/search', auth, async (req, res) => {
  try {
    const { email } = req.query;
    if (isMongo()) {
      const User = require('../models/mongo/User');
      const users = await User.find({ email: { $regex: email, $options: 'i' }, _id: { $ne: req.user.id } }).select('name email').limit(10);
      return res.json(users);
    } else {
      const { Op } = require('sequelize');
      const User = require('../models/User');
      const users = await User.findAll({ where: { email: { [Op.like]: `%${email}%` }, id: { [Op.ne]: req.user.id } }, attributes: ['id', 'name', 'email'], limit: 10 });
      return res.json(users);
    }
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
