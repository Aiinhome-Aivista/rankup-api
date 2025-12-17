const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    full_name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password_hash: {
        type: DataTypes.STRING,
        allowNull: true
    },
    role: {
        type: DataTypes.ENUM('parent', 'student', 'admin', 'teacher'),
        defaultValue: 'student'
    },
    keycloak_id: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true
    },
    is_active: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    // --- ADD THESE TWO COLUMNS ---
    otp_code: {
        type: DataTypes.STRING(10),
        allowNull: true
    },
    otp_expiry: {
        type: DataTypes.DATE, // Use DATE for timestamps
        allowNull: true
    },
    // -----------------------------
    // --- ADD THIS Institute Registration---
    institute_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    }

}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false, // Ensure this matches your DB (if you don't have updated_at column, keep false)
    defaultScope: {
        attributes: { exclude: ['password_hash'] }
    },
    scopes: {
        withPassword: { attributes: {} }
    }
});

module.exports = User;