const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: ['https://trackwise-sage.vercel.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users', require('./routes/users'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

const startServer = () => app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Use MongoDB if MONGO_URI is set, otherwise use MySQL
if (process.env.MONGO_URI) {
  const mongoose = require('mongoose');
  mongoose.connect(process.env.MONGO_URI)
    .then(() => { console.log('MongoDB connected'); startServer(); })
    .catch(err => { console.error('MongoDB error:', err.message); process.exit(1); });
} else {
  const sequelize = require('./config/database');
  const User = require('./models/User');
  const { Group, GroupMember, GroupExpense, GroupSplit } = require('./models/Group');
  Group.belongsToMany(User, { through: GroupMember, as: 'members', foreignKey: 'groupId' });
  User.belongsToMany(Group, { through: GroupMember, as: 'groups', foreignKey: 'userId' });
  sequelize.sync({ alter: true })
    .then(() => { console.log('MySQL connected and tables synced'); startServer(); })
    .catch(err => { console.error('MySQL error:', err.message); process.exit(1); });
}
