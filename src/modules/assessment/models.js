const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database'); // Adjust path if config is elsewhere
const User = require('../users/user.model'); // Import User for associations

// --- SUBJECTS ---
const Subject = sequelize.define('Subject', {
    subject_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    subject_name: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'subjects', timestamps: false });

// --- TOPICS ---
const Topic = sequelize.define('Topic', {
    topic_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    topic_name: { type: DataTypes.STRING, allowNull: false }
}, { tableName: 'topics', timestamps: false });

Subject.hasMany(Topic, { foreignKey: 'subject_id' });
Topic.belongsTo(Subject, { foreignKey: 'subject_id' });

// --- QUESTIONS ---
const Question = sequelize.define('Question', {
    question_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    question_text: { type: DataTypes.TEXT, allowNull: false },
    option_a: { type: DataTypes.STRING, allowNull: false },
    option_b: { type: DataTypes.STRING, allowNull: false },
    option_c: { type: DataTypes.STRING, allowNull: false },
    option_d: { type: DataTypes.STRING, allowNull: false },
    correct_option: { type: DataTypes.CHAR(1), allowNull: false },
    difficulty_level: { type: DataTypes.ENUM('easy', 'medium', 'hard'), allowNull: false },
    class_grade: { type: DataTypes.INTEGER, defaultValue: 7 },
    has_image: { type: DataTypes.BOOLEAN, defaultValue: false },
    diagram_url: { type: DataTypes.STRING },
    answer_url: { type: DataTypes.STRING }
}, { tableName: 'questions', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

Question.belongsTo(Subject, { foreignKey: 'subject_id' });
Question.belongsTo(Topic, { foreignKey: 'topic_id' });

// --- TESTS ---
const Test = sequelize.define('Test', {
    test_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    test_title: { type: DataTypes.STRING },
    instructions: { type: DataTypes.TEXT },
    test_type: { type: DataTypes.ENUM('assigned', 'self_practice', 'admin_assigned'), allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'completed', 'overdue'), defaultValue: 'pending' },
    total_questions: { type: DataTypes.INTEGER, defaultValue: 0 },
    duration_minutes: { type: DataTypes.INTEGER, defaultValue: 60 },
    start_date: { type: DataTypes.DATE },
    end_date: { type: DataTypes.DATE },
    settings_json: { type: DataTypes.JSONB },
    created_by: { type: DataTypes.INTEGER } // References User ID
}, { tableName: 'tests', timestamps: true, createdAt: 'created_at', updatedAt: false });

Test.belongsTo(User, { foreignKey: 'created_by' });
Test.belongsTo(Subject, { foreignKey: 'subject_id' });

// --- TEST-QUESTION MAP (Many-to-Many) ---
const TestQuestionMap = sequelize.define('TestQuestionMap', {
    // Junction table
}, { tableName: 'test_questions_map', timestamps: false });

Test.belongsToMany(Question, { through: TestQuestionMap, foreignKey: 'test_id', otherKey: 'question_id' });
Question.belongsToMany(Test, { through: TestQuestionMap, foreignKey: 'question_id', otherKey: 'test_id' });

module.exports = { Subject, Topic, Question, Test, TestQuestionMap };