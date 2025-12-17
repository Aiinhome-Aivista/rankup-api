const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');
const User = require('./user.model');


const StudentProfile = sequelize.define('StudentProfile', {
    profile_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'user_id'
        }
    },
    parent_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    class_grade: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    school_name: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'student_profiles',
    timestamps: false // Assuming you don't have created_at in this specific table
});


// Define Association
StudentProfile.belongsTo(User, { foreignKey: 'student_id', targetKey: 'user_id' });


module.exports = StudentProfile;



