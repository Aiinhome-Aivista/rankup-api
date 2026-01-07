// const User = require('../users/user.model');
// const admin = require('../../config/firebase');

// const NotificationController = {

//     // 1. SAVE TOKEN
//     saveDeviceToken: async (req, res) => {
//         try {
//             const { userId, token } = req.body;

//             if (!userId || !token) {
//                 return res.status(400).json({ isSuccess: false, message: "User ID and Token required" });
//             }

//             await User.update({ fcm_token: token }, { where: { user_id: userId } });

//             return res.json({ isSuccess: true, message: "Device token saved successfully" });

//         } catch (error) {
//             console.error("Token Save Error:", error);
//             return res.status(500).json({ isSuccess: false, message: "Failed to save token" });
//         }
//     },

//     // 2. SEND NOTIFICATION (Fixed for newer Firebase SDKs)
//     sendToUsers: async (userIds, title, body, data = {}) => {
//         try {
//             const users = await User.findAll({
//                 where: { user_id: userIds },
//                 attributes: ['fcm_token']
//             });

//             const tokens = users.map(u => u.fcm_token).filter(t => t);

//             if (tokens.length === 0) {
//                 console.log("No devices to notify.");
//                 return;
//             }

//             const message = {
//                 notification: { title, body },
//                 data: data,
//                 tokens: tokens // Array of device tokens
//             };

//             console.log(`Sending notification to ${tokens.length} devices...`);

//             // --- FIX: Use 'sendEachForMulticast' instead of 'sendMulticast' ---
//             const response = await admin.messaging().sendEachForMulticast(message);

//             console.log(`✅ Notification Sent! Success: ${response.successCount}, Failed: ${response.failureCount}`);

//             if (response.failureCount > 0) {
//                 console.log("Failed tokens:", response.responses.filter(r => !r.success));
//             }

//         } catch (error) {
//             console.error("Notification Send Error:", error);
//         }
//     }
// };

// module.exports = NotificationController;
const UserDevice = require('../../modules/users/userDevice.model');
const Notification = require('../../modules/notifications/notification.model');

const NotificationController = {

    // --- SAVE TOKEN (Fixes Duplicates) ---
    saveDeviceToken: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { fcm_token, device_type } = req.body;

            if (!fcm_token) {
                return res.status(400).json({ isSuccess: false, message: 'Token is required' });
            }

            // 1. Check if this token exists ANYWHERE in the table
            const existingDevice = await UserDevice.findOne({
                where: { fcm_token: fcm_token }
            });

            if (existingDevice) {
                // Token exists! Update it to point to the CURRENT user
                // This handles the case where a user logs out and a new user logs in on the same device.
                await existingDevice.update({
                    user_id: userId,
                    device_type: device_type || 'web',
                    is_active: true
                });
                console.log(`Token updated for User ${userId}`);
            } else {
                // Token is brand new. Create it.
                await UserDevice.create({
                    user_id: userId,
                    fcm_token: fcm_token,
                    device_type: device_type || 'web',
                    is_active: true
                });
                console.log(`New token created for User ${userId}`);
            }

            return res.status(200).json({ isSuccess: true, message: 'Device registered' });

        } catch (error) {
            console.error("Save Token Error:", error);
            return res.status(500).json({ isSuccess: false, message: 'Failed to save token' });
        }
    },

    // --- GET NOTIFICATIONS ---
    getNotifications: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { page = 1, limit = 20 } = req.query;
            const offset = (page - 1) * limit;

            const { count, rows } = await Notification.findAndCountAll({
                where: { user_id: userId },
                order: [['created_at', 'DESC']],
                limit: parseInt(limit),
                offset: parseInt(offset)
            });

            return res.status(200).json({
                isSuccess: true,
                data: {
                    total: count,
                    notifications: rows
                }
            });

        } catch (error) {
            return res.status(500).json({ isSuccess: false, message: 'Failed to fetch notifications' });
        }
    },

    // --- MARK READ ---
    markAsRead: async (req, res) => {
        try {
            const userId = req.user.user_id;
            const { notification_id } = req.body;

            let whereCondition = { user_id: userId, is_read: false };
            if (notification_id && notification_id !== 'all') {
                whereCondition.id = notification_id;
            }

            await Notification.update({ is_read: true }, { where: whereCondition });

            return res.status(200).json({ isSuccess: true, message: 'Marked as read' });

        } catch (error) {
            return res.status(500).json({ isSuccess: false, message: 'Update failed' });
        }
    }
};

module.exports = NotificationController;