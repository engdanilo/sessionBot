const Session = require('../models/sessionModel');
const { buyPhoneNumber } = require('../utils/smsActivateUtils');
const { createTelegramAccount } = require('../utils/telegramUtils');
const crypto = require('crypto');
const { decryptApiKey } = require('../utils/encryptApiKeyUtils');

const createSession = async (req, res) => {
    try {
        const { countryCode } = req.body;
        const encryptedApiKey = req.user.smsActivateApiKey;

        const apiKey = decryptApiKey(encryptedApiKey);
        const { phoneNumber, country } = await buyPhoneNumber(countryCode, apiKey);

        const sessionData = await createTelegramAccount(phoneNumber, country);

        const newSession = new Session({ phoneNumber, country, sessionData });
        await newSession.save();

        res.status(201).json({ message: 'Session created successfully', session: newSession });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ message: 'Failed to create session', error: error.message });
    }
};

module.exports = { createSession };