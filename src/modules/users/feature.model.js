const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');


const Feature = sequelize.define('Feature', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.STRING }
}, {
    tableName: 'features',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


module.exports = Feature;



