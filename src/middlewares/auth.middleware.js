// const jwt = require('jsonwebtoken');

// module.exports = (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader) {
//         return res.status(401).json({
//             isSuccess: false,
//             message: 'Token missing'
//         });
//     }

//     const token = authHeader.split(' ')[1];

//     if (!token) {
//         return res.status(401).json({
//             isSuccess: false,
//             message: 'Invalid token format'
//         });
//     } 

//     try {
//         jwt.verify(token, process.env.JWT_SECRET);
//         next(); 
//     } catch (err) {
//         return res.status(401).json({
//             isSuccess: false,
//             message: 'Invalid or expired token'
//         });
//     }
// };






const TokenService = require('../utils/tokenService'); // Import the helper for JWE


module.exports = async (req, res, next) => { // <--- Changed to 'async'
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
        // --- NEW LOGIC START ---
        // Instead of jwt.verify (which only works for signed tokens),
        // we use our service to Decrypt the token.
        const decodedPayload = await TokenService.decryptToken(token);


        if (!decodedPayload) {
            // If decryption returns null, the token is invalid or tampered with
            throw new Error('Invalid token');
        }


        req.user = decodedPayload; // Attach user data to request
        next();
        // --- NEW LOGIC END ---


    } catch (err) {
        // Keeping your exact error response format
        return res.status(401).json({
            isSuccess: false,
            message: 'Invalid or expired token'
        });
    }
};



