const smsActivate = require('sms-activate-org');
const ApiKey = require('../models/ApiKeyModel');
const Session = require('../models/SessionModel');
const { createSessionFile } = require('../utils/sessionUtils');
const { sendMessage, sendDocument } = require('../utils/telegramUtils');
const dotenv = require('dotenv');
dotenv.config();

const createSessions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { country, quantity } = req.body;

    // Obter a API Key do usuário
    const apiKey = await ApiKey.findOne({ userId });
    if (!apiKey) {
      return res.status(400).json({ message: 'API Key não encontrada' });
    }

    const api = new smsActivate(apiKey.key);

    // Obter o saldo do usuário em rublos
    const balanceRub = await api.getBalance();

    // Obter o preço do número em rublos
    const priceRub = await api.getPrice(country, 'tg');

    // Calcular o custo total em rublos
    const totalCostRub = priceRub * quantity;

    // Verificar se o saldo é suficiente
    if (balanceRub < totalCostRub) {
      const message = `Saldo insuficiente. Você precisa de ${totalCostRub} rublos, mas tem apenas ${balanceRub} rublos.`;
      await sendMessage(userId, message);
      return res.status(402).json({ message }); // 402 Payment Required
    }

    // Comprar os números e criar as sessões
    const sessions = [];
    for (let i = 0; i < quantity; i++) {
      try {
        // Tentar comprar número até 3 vezes
        let number;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            number = await api.getNumber({
              service: 'tg',
              country: country,
            });
            break; // Sai do loop se a compra for bem-sucedida
          } catch (error) {
            console.error(`Tentativa ${attempt} de comprar número falhou:`, error);
            if (attempt === 3) {
              throw error; // Lança o erro após 3 tentativas
            }
            // Aguarda um tempo antes da próxima tentativa (opcional)
            await new Promise(resolve => setTimeout(resolve, 1000)); 
          }
        }

        // Criar arquivo .session
        const sessionFile = await createSessionFile(
          number.phone,
          process.env.TELEGRAM_API_ID,
          process.env.TELEGRAM_API_HASH
        );

        // Salvar a sessão no banco de dados
        const newSession = new Session({
          userId,
          phone: number.phone,
          file: sessionFile
        });
        await newSession.save();

        sessions.push({
          phone: number.phone,
          file: sessionFile
        });

        // Enviar arquivo .session para o usuário
        await sendDocument(userId, sessionFile);

      } catch (error) {
        console.error(`Erro ao criar sessão ${i + 1}:`, error);
        await sendMessage(userId, `Erro ao criar a sessão ${i + 1}.`);
      }
    }

    // Informar ao usuário que as sessões foram criadas
    await sendMessage(userId, `${sessions.length} sessões criadas com sucesso!`);

    res.json({ message: 'Sessões criadas com sucesso', sessions });

  } catch (error) {
    console.error('Erro ao criar sessões:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

module.exports = { createSessions };