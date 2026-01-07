const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('./user.model');
const sendEmail = require('../../shared/utils/email');

const LoginController = {

    // --- STEP 1: INITIATE LOGIN ---
    initiateLogin: async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.scope('withPassword').findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({
                    isSuccess: false,
                    statusCode: 404,
                    message: 'User not found',
                    data: null
                });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({
                    isSuccess: false,
                    statusCode: 401,
                    message: 'Invalid password',
                    data: null
                });
            }

            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            const now = new Date();
            const expiryTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);

            user.otp_code = otp;
            user.otp_expiry = expiryTime;
            await user.save();


            await sendEmail(
                user.email,
                'Verify Your Login',
                `Hello ${user.full_name},
            
            We received a request to sign in to your account.
            
            Your One-Time Password (OTP) is:
            ${otp}
            
            This code is valid for the next 15 minutes.
            
            For your security, please do not share this OTP with anyone.
            If you did not request this login, you can safely ignore this email.
            
            Best regards,
            Edutech Ai Support Team`
            );
            

            return res.status(200).json({
                isSuccess: true,
                statusCode: 200,
                message: 'Password verified. OTP sent to email.',
                data: null
            });

        } catch (error) {
            console.error('Login Init Error:', error);
            return res.status(500).json({
                isSuccess: false,
                statusCode: 500,
                message: 'Login process failed',
                data: null
            });
        }
    },

    // --- STEP 2: VERIFY OTP ---
    completeLogin: async (req, res) => {
        try {
            const { email, otp } = req.body;

            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(400).json({
                    isSuccess: false,
                    statusCode: 400,
                    message: 'User not found',
                    data: null
                });
            }

            const inputOtp = String(otp).trim();
            const dbOtp = user.otp_code ? String(user.otp_code).trim() : "NULL";

            if (inputOtp !== dbOtp) {
                console.log(`Mismatch: Input '${inputOtp}' vs DB '${dbOtp}'`);
                return res.status(400).json({
                    isSuccess: false,
                    statusCode: 400,
                    message: 'Invalid OTP',
                    data: null
                });
            }

            if (new Date(user.otp_expiry) < new Date()) {
                console.log("OTP Expired");
                return res.status(400).json({
                    isSuccess: false,
                    statusCode: 400,
                    message: 'OTP has expired',
                    data: null
                });
            }

            const token = jwt.sign(
                { id: user.user_id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            user.otp_code = null;
            user.otp_expiry = null;
            await user.save();

            return res.status(200).json({
                isSuccess: true,
                statusCode: 200,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.user_id,
                        role: user.role,
                        full_name: user.full_name
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Login Verify Error:', error);
            return res.status(500).json({
                isSuccess: false,
                statusCode: 500,
                message: 'Verification failed',
                error: error.message
            });
        }
    }
};

module.exports = LoginController;
