const bcrypt = require('bcryptjs');
const sequelize = require('../../config/database');
const Institute = require('./institute.model');
const User = require('../users/user.model');
const sendEmail = require('../../shared/utils/email');


const InstituteController = {


    registerInstitute: async (req, res) => {
        const t = await sequelize.transaction();


        try {
            const {
                // Institute Details
                instituteName, website, instituteType, studentRange, institutePhone, // <--- New Field
                // Admin Details
                adminName, adminEmail, adminPhone, adminPassword // <--- New Field
            } = req.body;


            // 1. Check if Admin Email exists
            const existingUser = await User.findOne({ where: { email: adminEmail } });
            if (existingUser) {
                await t.rollback();
                return res.status(400).json({ isSuccess: false, message: "Admin email already exists" });
            }


            // 2. Create Institute
            const newInstitute = await Institute.create({
                name: instituteName,
                website: website,
                phone: institutePhone, // <--- Saving Institute Phone
                institute_type: instituteType,
                student_range: studentRange
            }, { transaction: t });


            // 3. Create Admin User
            const passwordToHash = adminPassword || "Admin@123";
            const hashedPassword = await bcrypt.hash(passwordToHash, 10);


            const newAdmin = await User.create({
                full_name: adminName,
                email: adminEmail,
                phone_number: adminPhone, // <--- Saving to EXISTING column in Users table
                password_hash: hashedPassword,
                role: 'admin',
                institute_id: newInstitute.institute_id,
                is_active: 1
            }, { transaction: t });


            // 4. Send Email
            const emailBody = `
        Welcome to EduAdapt!
        Your Institute "${instituteName}" is registered.
       
        Login: ${adminEmail}
        Pass: ${passwordToHash}
      `;
            sendEmail(adminEmail, 'Institute Registration Successful', emailBody);


            await t.commit();


            return res.status(201).json({
                statusCode: 201,
                isSuccess: true,
                message: "Institute registered successfully",
                data: {
                    instituteId: newInstitute.institute_id,
                    adminId: newAdmin.user_id
                }
            });


        } catch (error) {
            await t.rollback();
            console.error("Institute Reg Error:", error);
            res.status(500).json({ isSuccess: false, message: error.message });
        }
    }
};


module.exports = InstituteController;


