const admin = require('../../config/firebase');
const UserDevice = require('../../modules/users/userDevice.model');
const Notification = require('../../modules/notifications/notification.model');

const sendPushNotification = async (userId, title, body, dataPayload = {}) => {
    try {
        // 1. Save to Database (Inbox stores JSON, so numbers are fine here)
        await Notification.create({
            user_id: userId,
            title,
            body,
            data_payload: dataPayload,
            is_read: false
        });

        // 2. Fetch Active Tokens
        const devices = await UserDevice.findAll({
            where: { user_id: userId, is_active: true },
            attributes: ['fcm_token']
        });

        if (!devices.length) return;
        const tokens = devices.map(d => d.fcm_token);

        // 3. 🔥 CRITICAL FIX: Convert all Data Values to Strings
        // Firebase DROPS data if it contains Numbers/Booleans/Nulls
        const safeData = {};
        for (const key in dataPayload) {
            safeData[key] = String(dataPayload[key] || "");
        }

        // 4. Prepare Message
        const message = {
            notification: { title, body },
            data: safeData, // Send the safe string-only version
            tokens: tokens
        };

        // 5. Send via Firebase
        if (admin && admin.messaging) {
            console.log(`[Notification] Sending to ${tokens.length} devices...`);
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`[Notification] Success: ${response.successCount}, Fail: ${response.failureCount}`);

            // Cleanup Logic (Omitted for brevity, keep your existing cleanup code here)
        }

    } catch (error) {
        console.error("Notification Service Error:", error);
    }
};

module.exports = sendPushNotification;