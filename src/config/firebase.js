const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Check if firebase is already initialized to prevent errors during hot-reloads
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

module.exports = admin;