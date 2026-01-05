const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const Feature = require('./feature.model');


const RolePermission = sequelize.define('RolePermission', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    role: { type: DataTypes.STRING, allowNull: false },
    feature_id: {
        type: DataTypes.INTEGER,
        references: { model: Feature, key: 'id' }
    },
    access_type: { type: DataTypes.STRING, defaultValue: 'read' }
}, {
    tableName: 'role_permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});


RolePermission.belongsTo(Feature, { foreignKey: 'feature_id' });
Feature.hasMany(RolePermission, { foreignKey: 'feature_id' });


module.exports = RolePermission;



