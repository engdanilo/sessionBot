const crypto = require('crypto');

const encryptApiKey = (apiKey) => {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

const decryptApiKey = (encryptedApiKey) => {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedApiKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

module.exports = { encryptApiKey, decryptApiKey };