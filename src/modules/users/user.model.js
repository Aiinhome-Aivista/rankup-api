// const { DataTypes } = require('sequelize');
// const sequelize = require('../../config/database');


// const User = sequelize.define('User', {
//     user_id: {
//         type: DataTypes.INTEGER,
//         autoIncrement: true,
//         primaryKey: true
//     },
//     keycloak_id: {
//         type: DataTypes.STRING(255),
//         unique: true,
//         allowNull: true
//     },
//     full_name: {
//         type: DataTypes.STRING(100),
//         allowNull: false
//     },
//     email: {
//         type: DataTypes.STRING(100),
//         allowNull: false,
//         unique: true,
//         validate: { isEmail: true }
//     },
//     phone_number: {
//         type: DataTypes.STRING(14),
//         allowNull: true,
//         unique: true
//     },
//     password_hash: {
//         type: DataTypes.STRING(255),
//         allowNull: true
//     },
//     // --- UPDATED ROLE FIELD ---
//     role: {
//         type: DataTypes.ENUM('parent', 'student', 'admin', 'teacher'),
//         allowNull: false,
//         set(value) {
//             // Automatically converts 'Student' -> 'student' before validation
//             if (value && typeof value === 'string') {
//                 this.setDataValue('role', value.toLowerCase());
//             } else {
//                 this.setDataValue('role', value);
//             }
//         }
//     },
//     // --------------------------
//     is_active: {
//         type: DataTypes.INTEGER,
//         defaultValue: 1
//     },
//     subscription_plan: {
//         type: DataTypes.ENUM('free', 'premium', 'basic'),
//         defaultValue: 'free'
//     },
//     otp_code: {
//         type: DataTypes.STRING(10),
//         allowNull: true
//     },
//     otp_expiry: {
//         type: DataTypes.DATE,
//         allowNull: true
//     },
//     gender: {
//         type: DataTypes.STRING(100),
//         allowNull: true
//     },
//     refresh_token: {
//         type: DataTypes.TEXT,
//         allowNull: true
//     },
//     institute_id: {
//         type: DataTypes.INTEGER,
//         allowNull: true
//     },
//     auth_provider: {
//         type: DataTypes.STRING(50),
//         defaultValue: 'local'
//     }
// }, {
//     tableName: 'users',
//     timestamps: true,
//     createdAt: 'created_at',
//     updatedAt: false,
//     defaultScope: { attributes: { exclude: ['password_hash'] } },
//     scopes: { withPassword: { attributes: {} } }
// });


// module.exports = User;







const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');


const User = sequelize.define('User', {
    user_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    full_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { isEmail: true }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    // --- CRITICAL FIX: Match DB Capitalization (Admin, Teacher, etc.) ---
    role: {
        type: DataTypes.ENUM('Parent', 'Student', 'Admin', 'Teacher'),
        allowNull: false,
        set(value) {
            // Converts "student" -> "Student" to match DB Enum
            if (value && typeof value === 'string') {
                const titleCase = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
                this.setDataValue('role', titleCase);
            } else {
                this.setDataValue('role', value);
            }
        }
    },
    // ---------------------------------------------------------------------
    phone_number: { type: DataTypes.STRING(14), allowNull: true },
    is_active: { type: DataTypes.INTEGER, defaultValue: 1 },
    subscription_plan: {
        type: DataTypes.ENUM('free', 'premium', 'basic'),
        defaultValue: 'free'
    },
    otp_code: { type: DataTypes.STRING(10), allowNull: true },
    otp_expiry: { type: DataTypes.DATE, allowNull: true },
    institute_id: { type: DataTypes.INTEGER, allowNull: true },
    auth_provider: { type: DataTypes.STRING(50), defaultValue: 'local' }
}, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    defaultScope: { attributes: { exclude: ['password_hash'] } },
    scopes: { withPassword: { attributes: {} } }
});


module.exports = User;





