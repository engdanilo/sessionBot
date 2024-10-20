const axios = require('axios');

// Function to buy a phone number and get the activationId
const buyPhoneNumber = async (countryCode, apiKey) => {
    try {
        const response = await axios.get('https://sms-activate.org/stubs/handler_api.php', {
            params: {
                api_key: apiKey,
                action: 'getNumber',
                service: 'tg',
                country: countryCode,
            },
        });

        if (response.data.includes('ACCESS_NUMBER')) {
            const [_, activationId, phoneNumber] = response.data.split(':');
            return { activationId, phoneNumber };
        } else {
            throw new Error(`Error buying number: ${response.data}`);
        }
    } catch (error) {
        console.error('Error buying number:', error);
        throw error;
    }
};

// Function to get the verification code from SMS-Activate
const getCodeFromSMSActivate = async (activationId, apiKey) => {
    try {
        while (true) {
            const response = await axios.get('https://sms-activate.org/stubs/handler_api.php', {
                params: {
                    api_key: apiKey,
                    action: 'getStatus',
                    id: activationId,
                },
            });

            if (response.data.includes('STATUS_OK')) {
                const code = response.data.split(':')[1].trim();
                return code;
            } else if (response.data.includes('STATUS_WAIT_CODE')) {
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                throw new Error(`Error getting code: ${response.data}`);
            }
        }
    } catch (error) {
        console.error('Error getting verification code:', error);
        throw error;
    }
};

module.exports = { buyPhoneNumber, getCodeFromSMSActivate };
