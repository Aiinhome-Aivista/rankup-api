const bcrypt = require('bcryptjs');
const sequelize = require('../../config/database');
const sendEmail = require('../../shared/utils/email');

const ChildController = {
    addChild: async (req, res) => {
        try {
            // 1. GET PARENT ID FROM TOKEN
            const parentId = req.user.user_id;

            // Destructure existing + NEW fields
            const { 
                childName, 
                childEmail, 
                childPassword, 
                grade, 
                school,
                dob, 
                enrollment_date, 
                gender, 
                preferred_language, 
                emergency_contact_name, 
                emergency_contact_number 
            } = req.body;

            if (!parentId) {
                return res.status(401).json({
                    isSuccess: false,
                    message: "Unauthorized: Parent ID missing from token"
                });
            }

            // 2. Hash the Password
            const hashedPassword = await bcrypt.hash(childPassword, 10);

            // 3. Call PostgreSQL Stored Procedure (Updated Arguments)
            const result = await sequelize.query(
                'CALL sp_add_child(:parent_id, :name, :email, :password, :grade, :school, :dob, :enrollment_date, :gender, :preferred_language, :emergency_contact_name, :emergency_contact_number, :result)',
                {
                    replacements: {
                        parent_id: parentId,
                        name: childName,
                        email: childEmail,
                        password: hashedPassword,
                        grade: grade,
                        school: school,
                        // New Fields Mapped Here
                        dob: dob,
                        enrollment_date: enrollment_date,
                        gender: gender,
                        preferred_language: preferred_language,
                        emergency_contact_name: emergency_contact_name,
                        emergency_contact_number: emergency_contact_number,
                        
                        result: null
                    },
                    type: sequelize.QueryTypes.RAW
                }
            );

            // 4. Fetch Parent Info
            const [parentData] = await sequelize.query(
                "SELECT full_name, email FROM users WHERE user_id = :id",
                { replacements: { id: parentId }, type: sequelize.QueryTypes.SELECT }
            );

            if (!parentData) {
                return res.status(404).json({
                    isSuccess: false,
                    message: "Parent account not found"
                });
            }

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

            // 5. Send API Response
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

            if (error.name === 'SequelizeUniqueConstraintError') {
                return res.status(400).json({
                    statusCode: 400,
                    isSuccess: false,
                    message: "This email address is already registered. Please use a different email.",
                    error: "Duplicate Email"
                });
            }

            res.status(500).json({
                statusCode: 500,
                isSuccess: false,
                message: "Failed to add child",
                error: error.message
            });
        }
    }
};

module.exports = ChildController;

