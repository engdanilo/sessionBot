const smsActivate = require('sms-activate-client');
const ApiKey = require('../models/ApiKeyModel');

const getBalance = async (userId) => {
    try {
        const apiKey = await ApiKey.findOne({ userId });
        if(!apiKey) {
            throw new Error('API Key not found');
        }

        const api = new smsActivate(apiKey.key);
        const balance = await api.getBalance();
        return balance;
    } catch (error) {
        console.error('Error getting balance:', error);
        throw error;
    }
};

const buyNumber = async (userId, country, service = 'tg') => {
    try {
        const apiKey = await ApiKey.findOne({ userId });
        if(!apiKey) {
            throw new Error('API Key not found');
        }

        const api = new smsActivate(apiKey.key);
        const number = await api.getNumber(country, service);
        return number;
    } catch (error) {
        console.error('Error buying number:', error);
        throw error;
    }
};

module.exports = { getBalance, buyNumber };