const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Group = sequelize.define('Group', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  createdBy: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'groups' });

const GroupMember = sequelize.define('GroupMember', {
  groupId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'group_members', timestamps: false });

const GroupExpense = sequelize.define('GroupExpense', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  groupId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  paidBy: { type: DataTypes.INTEGER, allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'Other' },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { tableName: 'group_expenses' });

const GroupSplit = sequelize.define('GroupSplit', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  groupExpenseId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  paid: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'group_splits', timestamps: false });

module.exports = { Group, GroupMember, GroupExpense, GroupSplit };
