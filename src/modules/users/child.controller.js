const bcrypt = require('bcryptjs');
const sequelize = require('../../config/database'); // DB Connection
const sendEmail = require('../../shared/utils/email'); // Your Email Utility


const ChildController = {
    addChild: async (req, res) => {
        try {
            const { parentId, childName, childEmail, childPassword, grade, school } = req.body;


            // 1. Hash the Password
            const hashedPassword = await bcrypt.hash(childPassword, 10);


            // 2. Call PostgreSQL Stored Procedure
            // We use a replacement variable for the INOUT parameter
            const result = await sequelize.query(
                'CALL sp_add_child(:parent_id, :name, :email, :password, :grade, :school, :result)',
                {
                    replacements: {
                        parent_id: parentId,
                        name: childName,
                        email: childEmail,
                        password: hashedPassword,
                        grade: grade,
                        school: school,
                        result: null // Placeholder for output
                    },
                    type: sequelize.QueryTypes.RAW
                }
            );


            // 3. Extract Data from SP Result
            // Sequelize returns SP results differently depending on driver version.
            // Usually it's in the first element or mapped result.
            // For 'CALL', we often look at the bound parameters or raw result.
            // NOTE: With Sequelize & Postgres Procedures with INOUT, obtaining the value can be tricky.
            // A robust alternative is to run a SELECT query inside a transaction, but let's assume standard behavior:


            // FALLBACK: If SP return is complex, we can simply fetch parent info manually.
            // But let's rely on the SP logic. The logic below works if 'result' captures the INOUT.


            // Let's Simplify: Fetch Parent Info Manually to be 100% Safe and Easy in Node
            const [parentData] = await sequelize.query(
                "SELECT full_name, email FROM users WHERE user_id = :id",
                { replacements: { id: parentId }, type: sequelize.QueryTypes.SELECT }
            );


            const parentName = parentData.full_name;
            const parentEmail = parentData.email;


            // -------------------------------------------------------
            // EMAIL 1: Send to Child
            // -------------------------------------------------------
            const childSubject = "Your Learning Account is Ready!";
            const childBody = `
Hello ${childName},


A new learning account has been created for you.


Your login details:
-----------------------------------
Email: ${childEmail}
Password: ${childPassword}
-----------------------------------


You can now log in and start learning!


Best regards,
Edutech Ai Support Team
`;
            await sendEmail(childEmail, childSubject, childBody);


            // -------------------------------------------------------
            // EMAIL 2: Notification to Parent
            // -------------------------------------------------------
            const parentSubject = "Child Account Added Successfully";
            const parentBody = `
Hello ${parentName},


You have successfully added your child to the Edutech Ai Management System.


Child Information:
-----------------------------------
Name: ${childName}
Email: ${childEmail}
Password: ${childPassword}
-----------------------------------


If this was not done by you, please contact support immediately.


Best regards,
Edutech Ai Support Team
`;
            await sendEmail(parentEmail, parentSubject, parentBody);


            // 4. Send API Response
            res.status(200).json({
                statusCode: 200,
                isSuccess: true,
                message: "Child added successfully and email notifications sent!",
                data: {
                    childName,
                    childEmail,
                    parentEmail
                }
            });


        } catch (error) {
            console.error("Add Child Error:", error);
            res.status(400).json({
                statusCode: 400,
                isSuccess: false,
                message: "Failed to add child",
                error: error.message
            });
        }
    }
};


module.exports = ChildController;