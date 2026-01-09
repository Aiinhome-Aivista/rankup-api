const sequelize = require('../../config/database');
const { QueryTypes } = require('sequelize');

const StudentController = {

    // POST: Get Students by Subject and Grade (Based on Tests)
    getStudentsBySubjectAndGrade: async (req, res) => {
        try {
            const { subject_id, class_grade } = req.body;

            // Basic Validation
            if (!subject_id || !class_grade) {
                return res.status(400).json({
                    isSuccess: false,
                    message: "subject_id and class_grade are required"
                });
            }

            // Execute the Custom SQL Query
            // This query joins Tests -> StudentProfiles -> Users to get names
            const students = await sequelize.query(
                `SELECT DISTINCT
                    t.student_id,
                    u.full_name
                FROM tests t
                JOIN student_profiles sp
                    ON sp.student_id = t.student_id
                JOIN users u
                    ON u.user_id = sp.student_id
                WHERE t.subject_id = :subject_id
                  AND t.class_grade = :class_grade`,
                {
                    replacements: { subject_id, class_grade }, 
                    type: QueryTypes.SELECT
                }
            );

            if (students.length === 0) {
                return res.status(404).json({
                    isSuccess: false,
                    message: "No students found for this subject and grade."
                });
            }

            return res.status(200).json({
                isSuccess: true,
                message: "Students fetched successfully",
                count: students.length,
                data: students
            });

        } catch (error) {
            console.error("Error fetching students:", error);
            return res.status(500).json({
                isSuccess: false,
                message: "Internal Server Error",
                error: error.message
            });
        }
    }
};

module.exports = StudentController;
