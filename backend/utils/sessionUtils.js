const { StringSession } = require('telegram/sessions');
const { TelegramClient } = require('telegram');
const { Api } = require('telegram');
const fs = require('node:fs/promises');
const Chance = require('chance');
const chance = new Chance();
const { buyNumber } = require('./smsActivateUtils');
const { sleep } = require('./helpers');
const { bot } = require('../server'); // Importe o bot

const createSessionFile = async (userId, apiId, apiHash, country) => {
  try {
    // Criar uma nova StringSession
    const stringSession = new StringSession('');

    // Gerar nome, sobrenome, username e about
    const firstName = chance.first();
    const lastName = chance.last();
    let aboutText = chance.sentence({ words: 10 });
    if (aboutText.length > 70) {
      aboutText = aboutText.substring(0, 70);
    }
    const username = `${chance.word()}${chance.integer({ min: 0, max: 9999 })}`;

    // Criar um novo cliente Telegram
    const client = new TelegramClient(
      stringSession,
      apiId,
      apiHash,
      {
        connectionRetries: 5,
      }
    );

    // Comprar número de telefone com o país especificado
    const { phone, id } = await buyNumber(userId, country);

    // Conectar o cliente
    await client.connect();

    // Fazer login com o número de telefone
    await client.start({
      phoneNumber: phone,
      password: async () => {
        // Lógica para obter a senha (código SMS) do SMS Activate
        const api = new smsActivate(apiKey); // Certifique-se de ter a API Key aqui
        let status = await api.getStatus(id);
        while (status !== 'STATUS_OK') {
          await sleep(5000); // Aguardar 5 segundos
          status = await api.getStatus(id);
        }
        const code = await api.getCode(id);
        return code;
      },
      phoneCode: async () => {
        // Obter o código de verificação do Telegram (solicitar ao usuário)
        bot.sendMessage(userId, `Digite o código de verificação do Telegram para o número ${phone}:`);
        const code = await new Promise((resolve) => {
          bot.once('message', (msg) => {
            resolve(msg.text);
          });
        });
        return code;
      },
      onError: (err) => console.log(err),
    });

    // Atualizar o perfil do usuário com os dados gerados
    await client.invoke(
      new Api.account.UpdateProfile({
        firstName: firstName,
        lastName: lastName,
        about: aboutText,
      })
    );
    await client.invoke(
      new Api.account.UpdateUsername({
        username: username,
      })
    );

    // Salvar a StringSession em um arquivo
    const sessionFileName = `${phone}.session`;
    await fs.writeFile(sessionFileName, stringSession.save());

    return sessionFileName;
  } catch (error) {
    console.error('Erro ao criar arquivo .session:', error);
    throw error;
  }
};

// Função auxiliar para aguardar (sleep)
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { createSessionFile, sleep };