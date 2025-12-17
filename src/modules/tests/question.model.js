const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Question = sequelize.define('Question', {
    question_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    subject_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    // If you use topics
    topic_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    question_text: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    option_a: { type: DataTypes.STRING, allowNull: false },
    option_b: { type: DataTypes.STRING, allowNull: false },
    option_c: { type: DataTypes.STRING, allowNull: false },
    option_d: { type: DataTypes.STRING, allowNull: false },
    correct_option: {
        type: DataTypes.CHAR(1),
        allowNull: false
    },
    difficulty_level: {
        type: DataTypes.ENUM('easy', 'medium', 'hard'),
        defaultValue: 'medium'
    },
    class_grade: {
        type: DataTypes.INTEGER,
        defaultValue: 10
    }
}, {
    tableName: 'questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Question;