const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Institute = sequelize.define('Institute', {
  institute_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: { type: DataTypes.STRING, allowNull: false },
  website: { type: DataTypes.STRING, allowNull: true },
  
  // --- ADDED PHONE ---
  phone: { type: DataTypes.STRING, allowNull: true }, 
  
  institute_type: { type: DataTypes.STRING, allowNull: true },
  student_range: { type: DataTypes.STRING, allowNull: true }
}, {
  tableName: 'institutes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Institute;


