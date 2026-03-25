const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  type: { type: DataTypes.ENUM('expense', 'income'), defaultValue: 'expense' },
  category: {
    type: DataTypes.ENUM('Food','Travel','Bills','Shopping','Entertainment','Health','Education','Other'),
    defaultValue: 'Other'
  },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'expenses' });

module.exports = Expense;
