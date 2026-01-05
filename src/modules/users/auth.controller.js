// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const sequelize = require('../../config/database');
// const User = require('./user.model');

// const AuthController = {

//     // --- REGISTER ---
//     register: async (req, res) => {
//         try {
//             const { full_name, email, password, phone_number, gender, role } = req.body;

//             const salt = await bcrypt.genSalt(10);
//             const hashedPassword = await bcrypt.hash(password, salt);
//             const userRole = role || 'student';

//             await sequelize.query(
//                 'CALL register_user(:name, :email, :pass, :phone, :gender, :role)',
//                 {
//                     replacements: {
//                         name: full_name,
//                         email,
//                         pass: hashedPassword,
//                         phone: phone_number || null,
//                         gender,
//                         role: userRole
//                     }
//                 }
//             );


//             const newUser = await User.findOne({ where: { email } });

//             const token = jwt.sign(
//                 { id: newUser.user_id, role: newUser.role },
//                 process.env.JWT_SECRET,
//                 { expiresIn: process.env.JWT_EXPIRES_IN }
//             );

//             return res.status(201).json({
//                 isSuccess: true,
//                 statusCode: 201,
//                 message: 'User registered successfully',
//                 data: {
//                     user: {
//                         id: newUser.user_id,
//                         email: newUser.email,
//                         phone: newUser.phone_number,
//                         role: newUser.role,
//                         gender: newUser.gender
//                     },
//                     token
//                 }
//             });

//         } catch (error) {
//             console.error('Registration Error:', error);

//             if (error.original && error.original.toString().includes('already exists')) {
//                 return res.status(400).json({
//                     isSuccess: true,
//                     statusCode: 201,
//                     message: 'Email already registered',
//                     data: null
//                 });
//             }

//             return res.status(500).json({
//                 isSuccess: false,
//                 statusCode: 500,
//                 message: 'Registration failed',
//                 data: null
//             });
//         }
//     },

//     // --- LOGIN ---
//     login: async (req, res) => {
//         try {
//             const { email, password } = req.body;

//             // 1. Find User by Email
//             // Note: Ensure your User model scope handles password selection, 
//             // or use attributes: ['user_id', 'full_name', 'email', 'password_hash', 'role']
//             const user = await User.scope('withPassword').findOne({
//                 where: { email: email }
//             });

//             if (!user) {
//                 return res.status(401).json({
//                     isSuccess: false,
//                     statusCode: 401,
//                     message: 'Invalid credentials',
//                     data: null
//                 });
//             }

//             // 2. Validate Password
//             const isMatch = await bcrypt.compare(password, user.password_hash);
//             if (!isMatch) {
//                 return res.status(401).json({
//                     isSuccess: false,
//                     statusCode: 401,
//                     message: 'Invalid credentials',
//                     data: null
//                 });
//             }

//             // 3. FETCH PERMISSIONS based on Role
//             // This joins RolePermission with Feature to get the feature name
//             const rolePermissions = await RolePermission.findAll({
//                 where: { role: user.role }, // e.g., 'Student', 'Admin'
//                 include: [{
//                     model: Feature,
//                     attributes: ['name'], // We only need the feature name
//                     required: true
//                 }]
//             });

//             // 4. Format Permissions for the Token/Frontend
//             // Output format: [{ page: "Dashboard", access: "read" }, ...]
//             const permissionsList = rolePermissions.map(perm => ({
//                 page_name: perm.Feature.name,
//                 access_type: perm.access_type
//             }));

//             // 5. Generate JWT Token
//             // We embed the permissions directly into the token payload
//             const tokenPayload = {
//                 id: user.user_id,
//                 email: user.email,
//                 role: user.role,
//                 permissions: permissionsList
//             };

//             const token = jwt.sign(
//                 tokenPayload,
//                 process.env.JWT_SECRET,
//                 { expiresIn: process.env.JWT_EXPIRES_IN }
//             );

//             // 6. Send Response
//             return res.status(200).json({
//                 isSuccess: true,
//                 statusCode: 200,
//                 message: 'Login successful',
//                 data: {
//                     user: {
//                         id: user.user_id,
//                         full_name: user.full_name,
//                         email: user.email,
//                         role: user.role,
//                         phone_number: user.phone_number
//                     },
//                     permissions: permissionsList, // Sent specifically for frontend routing
//                     token: token
//                 }
//             });

//         } catch (error) {
//             console.error('Login Error:', error);
//             return res.status(500).json({
//                 isSuccess: false,
//                 statusCode: 500,
//                 message: 'An error occurred during login',
//                 data: null
//             });
//         }
//     }
// };

// module.exports = AuthController;




// const bcrypt = require('bcryptjs');
// // const jwt = require('jsonwebtoken'); // <-- Remove this
// const TokenService = require('../../utils/tokenService'); // <--- ADD THIS IMPORT
// const sequelize = require('../../config/database');
// const User = require('./user.model');
// const RolePermission = require('./rolePermission.model');
// const Feature = require('./feature.model');
// const sendEmail = require('../../shared/utils/email'); 

// const AuthController = {

//     // --- REGISTER ---
//     register: async (req, res) => {
//         try {
//             const { full_name, email, password, role } = req.body;
//             const salt = await bcrypt.genSalt(10);
//             const hashedPassword = await bcrypt.hash(password, salt);

//             let userRole = role || 'Student';
//             userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

//             await User.create({
//                 full_name, email, password_hash: hashedPassword, role: userRole
//             });

//             return res.status(201).json({ isSuccess: true, message: 'Registered successfully' });
//         } catch (error) {
//             console.error('Register Error:', error);
//             return res.status(500).json({ isSuccess: false, message: 'Registration failed' });
//         }
//     },

//     // --- STEP 1: INITIATE LOGIN (Send OTP) ---
//     initiateLogin: async (req, res) => {
//         try {
//             const { email, password } = req.body;
//             const user = await User.scope('withPassword').findOne({ where: { email } });

//             if (!user) return res.status(401).json({ isSuccess: false, message: 'Invalid credentials' });

//             const isMatch = await bcrypt.compare(password, user.password_hash);
//             if (!isMatch) return res.status(401).json({ isSuccess: false, message: 'Invalid credentials' });

//             const otp = Math.floor(100000 + Math.random() * 900000).toString();
//             const expiryTime = new Date(new Date().getTime() + 15 * 60000); 

//             await user.update({ otp_code: otp, otp_expiry: expiryTime });

//             try {
//                 await sendEmail(user.email, 'Your Login OTP', `Your OTP is: ${otp}`);
//             } catch (err) {
//                 console.error("Email failed:", err);
//                 return res.status(200).json({ isSuccess: true, message: 'OTP Generated (Email Failed)', data: { debug_otp: otp } });
//             }

//             return res.status(200).json({ isSuccess: true, message: 'OTP sent to email', data: { email: user.email } });

//         } catch (error) {
//             console.error('Initiate Error:', error);
//             return res.status(500).json({ isSuccess: false, message: 'Login failed' });
//         }
//     },

//     // --- STEP 2: VERIFY OTP (Encrypted Token) ---
//     verifyOTP: async (req, res) => {
//         try {
//             const { email, otp } = req.body;
//             const user = await User.findOne({ where: { email } });

//             if (!user) return res.status(404).json({ isSuccess: false, message: 'User not found' });

//             if (String(user.otp_code).trim() !== String(otp).trim()) {
//                 return res.status(400).json({ isSuccess: false, message: 'Invalid OTP' });
//             }
//             if (new Date() > new Date(user.otp_expiry)) {
//                 return res.status(400).json({ isSuccess: false, message: 'OTP Expired' });
//             }

//             // Fetch Permissions
//             const rolePermissions = await RolePermission.findAll({
//                 where: { role: user.role }, 
//                 include: [{
//                     model: Feature,
//                     attributes: ['name'], 
//                     required: true
//                 }]
//             });

//             const permissionsList = rolePermissions.map(perm => ({
//                 feature: perm.Feature.name,
//                 access_type: perm.access_type
//             }));

//             const tokenPayload = {
//                 user_id: user.user_id,
//                 full_name: user.full_name,
//                 email: user.email,
//                 role: user.role,
//                 subscription_plan: user.subscription_plan,
//                 permissions: permissionsList
//             };

//             // --- USE TOKEN SERVICE TO ENCRYPT ---
//             // This is where it was crashing before because TokenService wasn't imported
//             const encryptedToken = await TokenService.encryptToken(tokenPayload);

//             await user.update({ otp_code: null, otp_expiry: null });

//             return res.status(200).json({
//                 isSuccess: true,
//                 statusCode: 200,
//                 message: 'Login successful',
//                 data: {
//                     user: tokenPayload,
//                     token: encryptedToken 
//                 }
//             });

//         } catch (error) {
//             console.error('Verify Error:', error);
//             return res.status(500).json({ isSuccess: false, message: 'Verification failed' });
//         }
//     },
//     // -------------------------------------------------------------------------
//     // 4. DECRYPT TOKEN (Debug Endpoint)
//     // -------------------------------------------------------------------------
//     decryptTokenDebug: async (req, res) => {
//         try {
//             const { token } = req.body;

//             if (!token) {
//                 return res.status(400).json({ 
//                     isSuccess: false, 
//                     message: 'Token is required in body' 
//                 });
//             }

//             // Attempt to decrypt
//             const payload = await TokenService.decryptToken(token);

//             if (!payload) {
//                 return res.status(400).json({ 
//                     isSuccess: false, 
//                     message: 'Decryption failed: Invalid or Expired Token' 
//                 });
//             }

//             return res.status(200).json({
//                 isSuccess: true,
//                 statusCode: 200,
//                 message: 'Token Decrypted Successfully',
//                 data: payload // This will show the full JSON content
//             });

//         } catch (error) {
//             console.error('Decryption Debug Error:', error);
//             return res.status(500).json({ 
//                 isSuccess: false, 
//                 message: 'Internal Server Error' 
//             });
//         }
//     }
// };

// module.exports = AuthController;

const bcrypt = require('bcryptjs');
const TokenService = require('../../utils/tokenService');
const sequelize = require('../../config/database');
const User = require('./user.model');
const RolePermission = require('./rolePermission.model');
const Feature = require('./feature.model');
const sendEmail = require('../../shared/utils/email');

const AuthController = {

    // --- REGISTER ---
    register: async (req, res) => {
        try {
            const { full_name, email, password, role } = req.body;
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            let userRole = role || 'Student';
            userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

            await User.create({
                full_name, email, password_hash: hashedPassword, role: userRole
            });

            return res.status(201).json({ isSuccess: true, message: 'Registered successfully' });
        } catch (error) {
            console.error('Register Error:', error);
            return res.status(500).json({ isSuccess: false, message: 'Registration failed' });
        }
    },

    // --- STEP 1: INITIATE LOGIN (Send Professional OTP Email) ---
    initiateLogin: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.scope('withPassword').findOne({ where: { email } });

            if (!user) return res.status(401).json({ isSuccess: false, message: 'Invalid credentials' });

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) return res.status(401).json({ isSuccess: false, message: 'Invalid credentials' });

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const expiryTime = new Date(new Date().getTime() + 15 * 60000);

            await user.update({ otp_code: otp, otp_expiry: expiryTime });

            // 🔥 UPDATED: Professional Email Template
            const emailSubject = 'Your Login Verification Code';
            const emailBody = `
Hello ${user.full_name},

We received a request to log in to your EduAdapt account.

Your One-Time Password (OTP) is:
👉 ${otp}

This code is valid for the next 15 minutes. For your security, please do not share this code with anyone.

If you did not request this login, you can safely ignore this email.

Thanks and regards,
EduAdapt Team
`;

            try {
                await sendEmail(user.email, emailSubject, emailBody);
            } catch (err) {
                console.error("Email failed:", err);
                // Return success even if email fails (for development/debugging)
                return res.status(200).json({ isSuccess: true, message: 'OTP Generated (Email Failed)', data: { debug_otp: otp } });
            }

            return res.status(200).json({ isSuccess: true, message: 'OTP sent to email', data: { email: user.email } });

        } catch (error) {
            console.error('Initiate Error:', error);
            return res.status(500).json({ isSuccess: false, message: 'Login failed' });
        }
    },

    // --- STEP 2: VERIFY OTP (Encrypted Token) ---
    verifyOTP: async (req, res) => {
        try {
            const { email, otp } = req.body;
            const user = await User.findOne({ where: { email } });

            if (!user) return res.status(404).json({ isSuccess: false, message: 'User not found' });

            if (String(user.otp_code).trim() !== String(otp).trim()) {
                return res.status(400).json({ isSuccess: false, message: 'Invalid OTP' });
            }
            if (new Date() > new Date(user.otp_expiry)) {
                return res.status(400).json({ isSuccess: false, message: 'OTP Expired' });
            }

            // Fetch Permissions
            const rolePermissions = await RolePermission.findAll({
                where: { role: user.role },
                include: [{
                    model: Feature,
                    attributes: ['name'],
                    required: true
                }]
            });

            const permissionsList = rolePermissions.map(perm => ({
                feature: perm.Feature.name,
                access_type: perm.access_type
            }));

            const tokenPayload = {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                subscription_plan: user.subscription_plan,
                permissions: permissionsList
            };

            // Encrypt the token using your TokenService
            const encryptedToken = await TokenService.encryptToken(tokenPayload);

            await user.update({ otp_code: null, otp_expiry: null });

            return res.status(200).json({
                isSuccess: true,
                statusCode: 200,
                message: 'Login successful',
                data: {
                    user: tokenPayload,
                    token: encryptedToken
                }
            });

        } catch (error) {
            console.error('Verify Error:', error);
            return res.status(500).json({ isSuccess: false, message: 'Verification failed' });
        }
    },

    // --- DECRYPT TOKEN (Debug Endpoint) ---
    decryptTokenDebug: async (req, res) => {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    isSuccess: false,
                    message: 'Token is required in body'
                });
            }

            // Attempt to decrypt
            const payload = await TokenService.decryptToken(token);

            if (!payload) {
                return res.status(400).json({
                    isSuccess: false,
                    message: 'Decryption failed: Invalid or Expired Token'
                });
            }

            return res.status(200).json({
                isSuccess: true,
                statusCode: 200,
                message: 'Token Decrypted Successfully',
                data: payload // This will show the full JSON content
            });

        } catch (error) {
            console.error('Decryption Debug Error:', error);
            return res.status(500).json({
                isSuccess: false,
                message: 'Internal Server Error'
            });
        }
    }
};

module.exports = AuthController;