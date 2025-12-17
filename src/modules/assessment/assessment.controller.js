const { Subject, Topic, Question, Test } = require('./models');

const AssessmentController = {
    // 1. Create Subject
    createSubject: async (req, res) => {
        try {
            const subject = await Subject.create(req.body);
            res.status(201).json(subject);
        } catch (e) { res.status(500).json({ error: e.message }); }
    },

    // 2. Create Topic
    createTopic: async (req, res) => {
        try {
            const topic = await Topic.create(req.body);
            res.status(201).json(topic);
        } catch (e) { res.status(500).json({ error: e.message }); }
    },

    // 3. Create Question
    createQuestion: async (req, res) => {
        try {
            const question = await Question.create(req.body);
            res.status(201).json(question);
        } catch (e) { res.status(500).json({ error: e.message }); }
    },

    // 4. Create Test Header
    createTest: async (req, res) => {
        try {
            const test = await Test.create({
                ...req.body,
                status: 'pending',
                created_at: new Date()
            });
            res.status(201).json(test);
        } catch (e) { res.status(500).json({ error: e.message }); }
    },

    // 5. Link Questions to Test
    addQuestionsToTest: async (req, res) => {
        try {
            const { testId } = req.params;
            const { question_ids } = req.body; // Array [1, 2, 3]

            const test = await Test.findByPk(testId);
            if (!test) return res.status(404).json({ error: 'Test not found' });

            await test.addQuestions(question_ids);

            // Update question count
            const count = await test.countQuestions();
            await test.update({ total_questions: count });

            res.json({ message: 'Questions added', total_questions: count });
        } catch (e) { res.status(500).json({ error: e.message }); }
    },

    // 6. Get Full Test Details
    getTest: async (req, res) => {
        try {
            const test = await Test.findByPk(req.params.testId, {
                include: [
                    { model: Question, through: { attributes: [] } },
                    { model: Subject }
                ]
            });
            res.json(test);
        } catch (e) { res.status(500).json({ error: e.message }); }
    }
};

module.exports = AssessmentController;