const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const TestQuestionMap = sequelize.define('TestQuestionMap', {
    test_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    },
    question_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false
    }
}, {
    tableName: 'test_questions_map',
    timestamps: false // This table usually doesn't need created_at/updated_at
});

module.exports = TestQuestionMap;