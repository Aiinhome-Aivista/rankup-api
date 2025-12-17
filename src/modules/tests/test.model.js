const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Test = sequelize.define('Test', {
    test_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    student_id: { type: DataTypes.INTEGER, allowNull: false },
    created_by: { type: DataTypes.INTEGER, allowNull: false },
    subject_id: { type: DataTypes.INTEGER, allowNull: false },

    test_title: { type: DataTypes.STRING, allowNull: false },
    instructions: { type: DataTypes.TEXT, allowNull: true },
    class_grade: { type: DataTypes.INTEGER, allowNull: false },
    topic_id: { type: DataTypes.INTEGER, allowNull: true }, // Nullable

    test_type: { type: DataTypes.STRING, defaultValue: 'admin_assigned' },
    difficulty_level: { type: DataTypes.STRING, defaultValue: 'medium' },
    total_questions: { type: DataTypes.INTEGER, defaultValue: 0 },
    duration_minutes: { type: DataTypes.INTEGER, defaultValue: 60 },

    start_date: { type: DataTypes.DATE, allowNull: true },
    end_date: { type: DataTypes.DATE, allowNull: true },

    is_randomized: { type: DataTypes.BOOLEAN, defaultValue: false },
    anti_cheat_mode: { type: DataTypes.BOOLEAN, defaultValue: false },
    allowed_attempts: { type: DataTypes.INTEGER, defaultValue: 1 },

    status: { type: DataTypes.STRING, defaultValue: 'published' },

    // Stores the list of Question IDs: [101, 55, 23]
    question_ids: { type: DataTypes.JSONB, allowNull: true },

    score_obtained: { type: DataTypes.DECIMAL(5, 2), allowNull: true }
}, {
    tableName: 'tests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = Test;