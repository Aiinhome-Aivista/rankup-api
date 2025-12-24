const axios = require('axios');

module.exports = async function sendSMS(mobile, message) {
    try {
        const response = await axios.post(
            'https://www.fast2sms.com/dev/bulkV2',
            {
                route: 'otp',
                numbers: mobile,
                message: message
            },
            {
                headers: {
                    authorization: process.env.FAST2SMS_API_KEY,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log('SMS API Response:', response.data);
    } catch (error) {
        console.error('SMS sending failed:', error.response?.data || error.message);
    }
};
