const sequelize = require('../../config/database');
const { QueryTypes } = require('sequelize');


const StudentTestsController = {


    // --- FETCH TESTS ASSIGNED TO STUDENT ---
    getTestsByStudent: async (req, res) => {
        try {
            // 1. Determine Student ID
            let studentId;


            // If the logged-in user is a Student, use their ID from the token (Secure)
            if (req.user.role === 'Student') {
                studentId = req.user.user_id;
            }
            // If Parent/Teacher, allow them to pass the student_id in the body
            else {
                studentId = req.body.student_id;
            }


            if (!studentId) {
                return res.status(400).json({
                    isSuccess: false,
                    message: "Student ID is required."
                });
            }


            // 2. Call the Existing Stored Procedure
            // Postgres uses 'SELECT * FROM function_name(...)'
            const tests = await sequelize.query(
                'SELECT * FROM sp_get_tests_by_student(:id)',
                {
                    replacements: { id: studentId },
                    type: QueryTypes.SELECT
                }
            );


            return res.status(200).json({
                statusCode: 200,
                isSuccess: true,
                message: "Tests fetched successfully",
                data: tests
            });


        } catch (error) {
            console.error("Fetch Student Tests Error:", error);
            return res.status(500).json({
                isSuccess: false,
                message: `Error fetching tests: ${error.message}`
            });
        }
    }
};


module.exports = StudentTestsController;







