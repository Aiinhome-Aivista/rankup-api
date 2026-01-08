
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

            // 1. Check if user already exists
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(409).json({ // 409 Conflict
                    isSuccess: false,
                    message: 'User with this email already exists.'
                });
            }

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            let userRole = role || 'Student';
            userRole = userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase();

            await User.create({
                full_name,
                email,
                password_hash: hashedPassword,
                role: userRole
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