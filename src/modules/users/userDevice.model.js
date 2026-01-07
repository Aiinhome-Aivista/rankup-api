const { DataTypes } = require('sequelize');
// 🔥 FIX: Go up 2 levels (users -> modules -> src -> config)
const sequelize = require('../../config/database');
// 🔥 FIX: user.model is in the same folder now
const User = require('./user.model');

const UserDevice = sequelize.define('UserDevice', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'user_id'
        }
    },
    fcm_token: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    device_type: {
        type: DataTypes.STRING(50),
        defaultValue: 'web'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'user_devices',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

// Setup Association
User.hasMany(UserDevice, { foreignKey: 'user_id' });
UserDevice.belongsTo(User, { foreignKey: 'user_id' });

module.exports = UserDevice;