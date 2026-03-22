const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// PUT /api/users/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, currency, budget, darkMode } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, currency, budget, darkMode },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/users/password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!(await user.matchPassword(currentPassword)))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/search?email=
router.get('/search', auth, async (req, res) => {
  try {
    const { email } = req.query;
    const users = await User.find({
      email: { $regex: email, $options: 'i' },
      _id: { $ne: req.user.id }
    }).select('name email').limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
