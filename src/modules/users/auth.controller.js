const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('../../config/database');
const User = require('./user.model');

const AuthController = {

    // --- REGISTER ---
    register: async (req, res) => {
        try {
            const { full_name, email, password, phone_number, gender, role } = req.body;

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const userRole = role || 'student';

            await sequelize.query(
                'CALL register_user(:name, :email, :pass, :phone, :gender, :role)',
                {
                    replacements: {
                        name: full_name,
                        email,
                        pass: hashedPassword,
                        phone: phone_number || null,
                        gender,
                        role: userRole
                    }
                }
            );
            

            const newUser = await User.findOne({ where: { email } });

            const token = jwt.sign(
                { id: newUser.user_id, role: newUser.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            return res.status(201).json({
                isSuccess: true,
                statusCode: 201,
                message: 'User registered successfully',
                data: {
                    user: {
                        id: newUser.user_id,
                        email: newUser.email,
                        phone: newUser.phone_number,
                        role: newUser.role,
                        gender: newUser.gender
                    },
                    token
                }
            });

        } catch (error) {
            console.error('Registration Error:', error);

            if (error.original && error.original.toString().includes('already exists')) {
                return res.status(400).json({
                    isSuccess: false,
                    statusCode: 400,
                    message: 'Email already registered',
                    data: null
                });
            }

            return res.status(500).json({
                isSuccess: false,
                statusCode: 500,
                message: 'Registration failed',
                data: null
            });
        }
    },

    // --- LOGIN ---
    login: async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.scope('withPassword').findOne({ where: { email } });

            if (!user) {
                return res.status(401).json({
                    isSuccess: false,
                    statusCode: 401,
                    message: 'Invalid credentials',
                    data: null
                });
            }

            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({
                    isSuccess: false,
                    statusCode: 401,
                    message: 'Invalid credentials',
                    data: null
                });
            }

            const token = jwt.sign(
                { id: user.user_id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            return res.status(200).json({
                isSuccess: true,
                statusCode: 200,
                message: 'Login successful',
                data: {
                    user: {
                        id: user.user_id,
                        full_name: user.full_name,
                        role: user.role
                    },
                    token
                }
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                isSuccess: false,
                statusCode: 500,
                message: 'Login failed',
                data: null
            });
        }
    }
};

module.exports = AuthController;
