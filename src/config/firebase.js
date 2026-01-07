const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Check if already initialized to prevent "App already exists" error
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

// 🔥 CRITICAL: Export the 'admin' instance directly
module.exports = admin;