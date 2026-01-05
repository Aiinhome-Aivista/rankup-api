const User = require('../users/user.model');
const admin = require('../../config/firebase');

const NotificationController = {

    // 1. SAVE TOKEN
    saveDeviceToken: async (req, res) => {
        try {
            const { userId, token } = req.body;

            if (!userId || !token) {
                return res.status(400).json({ isSuccess: false, message: "User ID and Token required" });
            }

            await User.update({ fcm_token: token }, { where: { user_id: userId } });

            return res.json({ isSuccess: true, message: "Device token saved successfully" });

        } catch (error) {
            console.error("Token Save Error:", error);
            return res.status(500).json({ isSuccess: false, message: "Failed to save token" });
        }
    },

    // 2. SEND NOTIFICATION (Fixed for newer Firebase SDKs)
    sendToUsers: async (userIds, title, body, data = {}) => {
        try {
            const users = await User.findAll({
                where: { user_id: userIds },
                attributes: ['fcm_token']
            });

            const tokens = users.map(u => u.fcm_token).filter(t => t);

            if (tokens.length === 0) {
                console.log("No devices to notify.");
                return;
            }

            const message = {
                notification: { title, body },
                data: data,
                tokens: tokens // Array of device tokens
            };

            console.log(`Sending notification to ${tokens.length} devices...`);

            // --- FIX: Use 'sendEachForMulticast' instead of 'sendMulticast' ---
            const response = await admin.messaging().sendEachForMulticast(message);

            console.log(`✅ Notification Sent! Success: ${response.successCount}, Failed: ${response.failureCount}`);

            if (response.failureCount > 0) {
                console.log("Failed tokens:", response.responses.filter(r => !r.success));
            }

        } catch (error) {
            console.error("Notification Send Error:", error);
        }
    }
};

module.exports = NotificationController;