const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  currency: { type: DataTypes.STRING, defaultValue: 'USD' },
  budget: { type: DataTypes.FLOAT, defaultValue: 0 },
  darkMode: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'users' });

User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.prototype.matchPassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = User;
