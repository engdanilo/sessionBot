const User = require('../models/UserModel');
const { createSessionFile } = require('../utils/sessionUtils');
const { sendDocument, sendMessage } = require('../utils/telegramUtils');
const { buyNumber } = require('../utils/smsActivateUtils');

const createSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { country, quantity } = req.body;

    // Obter o usuário
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Comprar números e criar sessões
    const sessionPromises = [];
    for (let i = 0; i < quantity; i++) {
      sessionPromises.push(
        buyNumber(userId, country)
        .then(async (number) => {
          try {
            const sessionFile = await createSessionFile(userId, process.env.TELEGRAM_API_ID, process.env.TELEGRAM_API_HASH, country);
            await sendDocument(userId, sessionFile);
            await sendMessage(userId, `Session created successfully for number ${number.phone}!`);
          } catch (error) {
            console.error(`Error creating session for number ${number.phone}:`, error);
            await sendMessage(userId, `Error creating session for number ${number.phone}.`);
          }
        })
        .catch(error => {
          console.error(`Error buying number ${i + 1}:`, error);
        })
      );
    }

    await Promise.all(sessionPromises);
    res.json({ message: 'Sessions created successfully' });

  } catch (error) {
    console.error('Error creating sessions:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { createSessions };