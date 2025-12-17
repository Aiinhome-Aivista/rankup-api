const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            isSuccess: false,
            message: 'Token missing'
        });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            isSuccess: false,
            message: 'Invalid token format'
        });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET);
        next(); 
    } catch (err) {
        return res.status(401).json({
            isSuccess: false,
            message: 'Invalid or expired token'
        });
    }
};
