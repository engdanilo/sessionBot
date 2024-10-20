const { Client } = require('telegram-mtproto');
const fs = require('fs');
const path = require('path');
const { buyPhoneNumber, getCodeFromSMSActivate } = require('./smsActivateUtils');

// Read the users.json file
const usersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../json/users.json'), 'utf8'));
const professions = ['eng.', 'eng', 'nursy.', 'nursy', 'doc.', 'doc', 'med.', 'med', 'dr.', 'msc.', 'msc', 'prof.', 'prof', 'mus.', 'mus'];

// Main function to create a Telegram account
const createTelegramAccount = async (countryCode, apiKey) => {
    try {
        const { activationId, phoneNumber } = await buyPhoneNumber(countryCode, apiKey);

        const api = {
            app_id: parseInt(process.env.TELEGRAM_API_ID),
            api_hash: process.env.TELEGRAM_API_HASH,
        };

        const client = new Client({ api });

        const { phone_code_hash } = await client('auth.sendCode', {
            phone_number: phoneNumber,
            current_number: false,
            api_id: parseInt(process.env.TELEGRAM_API_ID),
            api_hash: process.env.TELEGRAM_API_HASH,
        });

        const code = await getCodeFromSMSActivate(activationId, apiKey);

        const { user } = await client('auth.signIn', {
            phone_number: phoneNumber,
            phone_code_hash,
            phone_code: code,
        });

        // Select a random user
        const randomUser = usersData[Math.floor(Math.random() * usersData.length)];

        // Generate a random number to add to the username
        const randomNumber = Math.floor(Math.random() * 10000);
        let username = `${randomUser.username}${randomNumber}`;

        let attempts = 0;
        const maxAttempts = 5;
        while (attempts < maxAttempts) {
            try {
                await client('account.updateProfile', {
                    first_name: randomUser.first_name,
                    last_name: randomUser.last_name,
                    about: randomUser.about,
                });

                await client('account.updateUsername', {
                    username: username,
                });

                return JSON.stringify(user);
            } catch (error) {
                if (error.error_message === 'USERNAME_OCCUPIED' || error.error_message === 'USERNAME_INVALID') {
                    const randomProfession = professions[Math.floor(Math.random() * professions.length)];
                    username = `${randomProfession}_${randomUser.username}${randomNumber}`;
                } else {
                    console.error('Error creating account:', error);
                    throw error;
                }
            }
            attempts++;
        }

        throw new Error('Unable to create a valid username after several attempts.');

    } catch (error) {
        console.error('Error creating Telegram account:', error);
        throw error;
    }
};

module.exports = { createTelegramAccount };
