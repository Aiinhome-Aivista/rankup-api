const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');


const TestAttempt = sequelize.define('TestAttempt', {
    attempt_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    test_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    student_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    start_time: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    completed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    score_obtained: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    }
}, {
    tableName: 'test_attempts',
    timestamps: false
});


module.exports = TestAttempt;


 

