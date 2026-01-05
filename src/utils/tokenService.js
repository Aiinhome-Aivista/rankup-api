const jose = require('jose');
const crypto = require('crypto');


// 1. Prepare the Secret Key
// JWE requires a specific key length (e.g., 32 bytes for A256GCM).
// We hash your existing JWT_SECRET to ensure it's always the correct length (32 bytes).
const secretKey = crypto.createHash('sha256').update(process.env.JWT_SECRET || 'default_secret').digest();


const TokenService = {
   
    // --- ENCRYPT (Create Token) ---
    encryptToken: async (payload) => {
        const jwt = await new jose.EncryptJWT(payload)
            .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }) // 'dir' means direct use of shared secret
            .setIssuedAt()
            .setExpirationTime(process.env.JWT_EXPIRES_IN || '10h')
            .encrypt(secretKey);
       
        return jwt;
    },


    // --- DECRYPT (Verify Token) ---
    decryptToken: async (token) => {
        try {
            const { payload } = await jose.jwtDecrypt(token, secretKey);
            return payload;
        } catch (error) {
            console.error("Token Decryption Failed:", error.message);
            return null; // Invalid token
        }
    }
};


module.exports = TokenService;



