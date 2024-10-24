const { register } = require('../controllers/authController');
const { getUserInfo, getApiKey } = require('../controllers/userController');
const { createPaymentIntent } = require('../controllers/paymentController');
const { validationResult } = require('express-validator');
const { apiKeyValidator } = require('../validators/userValidator');
const { termsOfUse } = require('../termsOfUse');
const { helpText } = require('./help');
const User = require('../models/UserModel');
const { getBalance: getSmsActivateBalance } = require('./smsActivateUtils');
const { createSessionFile } = require('./sessionUtils');
const { sendDocument } = require('./telegramUtils');
const { sleep } = require('./helpers');
const axios = require('axios');
const sms = require('node-sms-active');
const dotenv = require('dotenv');
dotenv.config();

// Variável global para controlar os processos de compra em andamento
const ongoingBuys = {};

//______________________________________Funções Auxiliares ______________________________________


// função booleana que verifica se o usuário é admin
// Verifica se o usuário é admin através do telegramId verificando em .env
// Se o usuário for admin, informa que é admin
// libera acesso irrestrito e sem necessidade de pagamento para uso do sessionBot (true)
// Se não for, segue o fluxo normal de acesso e de pagamento (false)
const isAdminUser = async (chatId) => {
    return chatId.toString() === process.env.ADMIN_TELEGRAM_ID;
};

// função booleana que verifica se a assinatura do usuário é válida
// Verifica a data de expiração no mongodb
// Se a data de expiração for maior que a data atual, informa que a assinatura é válida (true)
// Se a data de expiração for menor que a data atual, informa que a assinatura expirou (false)
const userSignature = async (chatId) => {
    const user = await User.findOne({ telegramId: chatId });
    return user && user.paid && user.paymentExpiration > new Date();
};

// 1 - Registrar usuário
// 1.1 Verifica se o usuário já tem registro no mongodb
// 1.1.1 Se sim, aciona userSignature para ver se o usuário tem assinatura válida, se sim para o processo e informa que a assinatura é válida
// 1.1.1.1 Se não tem assinatura válida e está registrado, aciona a função blockchainConfirmation com waitingTime igual a 60000 ms
// 1.1.1.2 Se blockchainConfirmation igual a true, Atualiza {paid, paymentExpiration} para {true, 180 dias a partir da data registrada na blockchain (Date)} e registra no mongodb
// 1.1.1.3 se false, aciona a função payment
// 1.1.2 Se o usuário não tem registro no mongodb
// 1.1.3 Usuário recebe mensagem de termos de uso para aceitar ou recusar
// 1.1.4 Se aceitar, Capta automaticamente telegramId, firstName, lastName, username 
// 1.1.5 Aciona a função registerApikey e capta o apiKey
// 1.1.6 Aciona a função registerWallet e capta o walletAddress
// 1.1.7 Aciona a função isAdminUser e capta se é admin ou não
// 1.1.7.1 Se usuário admin, assume paid = true, paymentExpiration = 2100-01-01T00:00:00.000Z e isAdmin = true e informa que registrou com sucesso o admin.
// 1.1.7.2 Se usuário comum, chama a função payment
// 1.1.7.3 Enquanto o pagamento não for confirmado, assume paid = false, paymentExpiration = null e isAdmin = false
// 1.1.7.4 Registra as informações do userModel {telegramId, firstName, lastName, username, isAdmin, walletAddress, apiKey, paid, paymentExpiration} e registra no mongodb
// 1.1.7.5 Aciona a função blockchainConfirmation
// 1.1.7.6 Após pagamento confirmado, o usuário é registrado como paid = true, paymentExpiration = 180 dias a partir da data atual (Date) e isAdmin = false
// 1.1.7.7 Atualiza as informações do userModel {paid, paymentExpiration} e registra no mongodb
const registerUser = async (bot, chatId) => {
  // Verifica se o usuário já tem registro no mongodb
  const user = await User.findOne({ telegramId: chatId });
  if (user) {
      // 1.1 Se sim, verifica se o usuário tem assinatura válida.
      if (await userSignature(chatId)) {
          return bot.sendMessage(chatId, "Hello! Your access to the bot is already granted.");
      } else {
          // 1.1.1 Se não tem assinatura válida e está registrado, aciona a função blockchainConfirmation com waitingTime igual a 60000 ms
          bot.sendMessage(chatId, "Verifying payment...");
          const confirmed = await blockchainConfirmation(chatId, 60000);
          if (confirmed) {
              // 1.1.1.1 Se blockchainConfirmation igual a true, Atualiza {paid, paymentExpiration} para {true, 180 dias a partir da data registrada na blockchain (Date)} e registra no mongodb
              const expirationDate = new Date(Date.now() + (180 * 24 * 60 * 60 * 1000));
              await User.findOneAndUpdate({ telegramId: chatId }, { paid: true, paymentExpiration: expirationDate });
              return bot.sendMessage(chatId, `Payment confirmed! Your access is granted until ${expirationDate.toLocaleDateString()}.`);
          } else {
              // 1.1.1.2 se false, aciona a função payment
              return payment(bot, chatId);
          }
      }
  } else {
      // 1.1.2 Se o usuário não tem registro no mongodb
      // 1.1.3 Usuário recebe mensagem de termos de uso para aceitar ou recusar
      bot.sendMessage(chatId, acceptTerms);

      bot.once('message', async (msg) => {
          const messageText = msg.text;
          if (messageText === 'Accept') {
              try {
                  // 1.1.4 Se aceitar, Capta automaticamente telegramId, firstName, lastName, username 
                  const { id, first_name, last_name, username } = msg.from;

                  // 1.1.5 Aciona a função registerApikey e capta o apiKey
                  const apiKey = await registerApiKey(bot, chatId);

                  // 1.1.6 Aciona a função registerWallet e capta o walletAddress
                  const walletAddress = await registerWallet(bot, chatId);

                  // 1.1.7 Aciona a função isAdminUser e capta se é admin ou não
                  const isAdmin = await isAdminUser(chatId);
                  let paid = false;
                  let paymentExpiration = null;

                  if (isAdmin) {
                      // 1.1.7.1 Se usuário admin, assume paid = true, paymentExpiration = 2100-01-01T00:00:00.000Z e isAdmin = true e informa que registrou com sucesso o admin.
                      paid = true;
                      paymentExpiration = new Date('2100-01-01T00:00:00.000Z');
                      bot.sendMessage(chatId, "Administrator successfully registered!");
                  } else {
                      // 1.1.7.2 Se usuário comum, chama a função payment
                      await payment(bot, chatId);
                  }

                  // 1.1.7.3 Enquanto o pagamento não for confirmado, assume paid = false, paymentExpiration = null e isAdmin = false
                  // 1.1.7.4 Registra as informações do userModel {telegramId, firstName, lastName, username, isAdmin, walletAddress, apiKey, paid, paymentExpiration} e registra no mongodb
                  await register({
                      body: {
                          telegramId: id,
                          firstName: first_name,
                          lastName: last_name,
                          username,
                          isAdmin,
                          walletAddress,
                          apiKey,
                          paid,
                          paymentExpiration
                      }
                  }, {
                      status: () => {},
                      json: () => {}
                  });

                  if (!isAdmin) {
                      // 1.1.7.5 Aciona a função blockchainConfirmation
                      bot.sendMessage(chatId, "Waiting for payment confirmation on the blockchain...");
                      const confirmed = await blockchainConfirmation(chatId);

                      if (confirmed) {
                          // 1.1.7.6 Após pagamento confirmado, o usuário é registrado como paid = true, paymentExpiration = 180 dias a partir da data atual (Date) e isAdmin = false
                          // 1.1.7.7 Atualiza as informações do userModel {paid, paymentExpiration} e registra no mongodb
                          const expirationDate = new Date(Date.now() + (180 * 24 * 60 * 60 * 1000));
                          await User.findOneAndUpdate({
                              telegramId: id
                          }, {
                              paid: true,
                              paymentExpiration: expirationDate
                          });
                          bot.sendMessage(chatId, `Payment confirmed! Your access is granted until ${expirationDate.toLocaleDateString()}.`);
                      } else {
                          bot.sendMessage(chatId, "Payment not confirmed. Please try again later.");
                      }
                  }
              } catch (error) {
                  console.error('Error registering user:', error);
                  bot.sendMessage(chatId, "Error registering user. Please try again later.");
              }
          } else if (messageText === 'Decline') {
              bot.sendMessage(chatId, "You declined the terms of use. Click /register to try again.");
          }
      });
  }
};

// Se o usuário não é registrado, mesmo se for admin, solicita que ele se registre
// Se usuário já registrado, exibe as opções de países para compra de sessions
// Aciona a função country
const start = async (bot, chatId) => {
    // Se o usuário não é registrado, mesmo se for admin, solicita que ele se registre
    const user = await User.findOne({ telegramId: chatId });
    if (!user) {
      return bot.sendMessage(chatId, "You need to register first. Use the /register command.");
    }
    // Se usuário já registrado, exibe as opções de países para compra de sessions
    // Aciona a função country
    country(bot, chatId);
};

// 3 - Renovar assinatura
// Aciona a função isAdminUser
// Se o usuário é admin, atualiza {paid, paymentExpiration} para {true, 2100-01-01T00:00:00.000Z}
// Se usuário não for admin, aciona a função payment.
// Após pagamento confirmado, o usuário é registrado como paid = true, paymentExpiration = 180 dias a partir da data atual (Date) e isAdmin = false
// Atualiza as informações do userModel {paid, paymentExpiration} e registra no mongodb
const renew = async (bot, chatId) => {
    // Aciona a função isAdminUser
    const isAdmin = await isAdminUser(chatId);
  
    if (isAdmin) {
      // Se o usuário é admin, atualiza {paid, paymentExpiration} para {true, 2100-01-01T00:00:00.000Z}
      await User.findOneAndUpdate({ telegramId: chatId }, { paid: true, paymentExpiration: new Date('2100-01-01T00:00:00.000Z') });
      return bot.sendMessage(chatId, "Your subscription has been successfully renewed (admin)!");
    } else {
      // Se usuário não for admin, aciona a função payment.
      return payment(bot, chatId);
    }
};

// 4 - Alterar API Key
// Solicita novo número da Api key da SMS Activate
// Ataualiza a nova Api Key no mongodb
// Informa que a Api Key foi alterada com sucesso
const changeApiKey = async (bot, chatId) => {
  // Solicita novo número da Api key da SMS Activate
  bot.sendMessage(chatId, "Please provide your new SMS Activate API Key:");
  bot.once('message', async (msg) => {
      const newApiKey = msg.text;
      try {
          // Validar a API Key
          await Promise.all(apiKeyValidator.map(validation => validation.run({ body: { apiKey: newApiKey } })));
          const errors = validationResult({ body: { apiKey: newApiKey } });
          if (!errors.isEmpty()) {
              return bot.sendMessage(chatId, `Error: ${errors.array()[0].msg}`);
          }

          // Atualiza a nova Api Key no mongodb
          await User.findOneAndUpdate({ telegramId: chatId }, { apiKey: newApiKey });

          // Informa que a Api Key foi alterada com sucesso
          bot.sendMessage(chatId, "API Key successfully changed!");
      } catch (error) {
          console.error('Error changing API Key:', error);
          bot.sendMessage(chatId, "Error changing API Key. Please try again later.");
      }
  });
};

// 5 - Cancelar todos os processos de compra
// Se enviado a qualquer momento /cancelall
// Cancela qualquer processo de compra que esteja em andamento.
const cancelAll = (bot, chatId) => {
  // Cancela qualquer processo de compra que esteja em andamento.
  if (ongoingBuys[chatId]) {
      clearTimeout(ongoingBuys[chatId]);
      delete ongoingBuys[chatId];
      bot.sendMessage(chatId, 'All ongoing purchase processes have been canceled.');
  } else {
      bot.sendMessage(chatId, 'There are no ongoing purchase processes.');
  }
};

// 6 - Pagamento
// Função boolque verifica se o usuário fez o pagamento
// Verifica se o usuário é admin,
// Se for admin, informa que o acesso é liberado por ser admin
// Aciona userSignature, se a assinatura está válida, informa que a assinatura é valida, informando data de expiração.
// Se a assinatura não estiver válida: 
// Solicita que o usuário aceite o pagamento de 30 USDT para usar por 6 meses o sessionBot
// Usuário aceita ou recusa
// Se recusa, encerra o processo
// Se aceita informa o endereço do contrato para pagamento
// Se o pagamento for realizado pelo usuário,
// o bot recebe o número da carteira que fez o pagamento e registra o pagamento no telegramId de quem a possui
// libera acesso ao sessionBot
const payment = async (bot, chatId) => {
  try {
    // Iniciar o pagamento para o usuário
    const paymentIntent = await createPaymentIntent({ user: { id: chatId } }, { json: (data) => data });
    bot.sendMessage(chatId, `To grant access to the bot, please make a payment of 30 USDT to the following address:\n\n${paymentIntent.to}\n\nAfter the payment, use the /renew command to verify and grant your access.`);
  } catch (error) {
    console.error('Error requesting payment:', error);
    bot.sendMessage(chatId, "Error requesting payment. Please try again later.");
  }
};

// 7 - Listar países
// Deve listar todos os países disponíveis na API do SMS Activate
// Deve listar 21 países por vez, com opção de avançar para a próxima página ou voltar
// Deve exibir o saldo do usuário no SMS Activate em todas as páginas de países
// Após selecionado o país, aciona a função buyCountry
const country = async (bot, chatId, page = 0, parallelPurchase = 5) => {
  try {
      // Obter a lista de países disponíveis na SMS Activate
      const user = await User.findOne({ telegramId: chatId });
      if (!user || !user.apiKey) {
          return bot.sendMessage(chatId, "Error: API Key not found. Use the /changeapikey command to set it up.");
      }

      const response = await axios.get(`https://api.sms-activate.org/stubs/handler_api.php?api_key=${user.apiKey}&action=getServicesList`);
      const services = JSON.parse(response.data);
      const countries = Object.keys(services.tg); // Obter os países disponíveis para Telegram

      // Calcular o índice inicial e final dos países a serem exibidos
      const startIndex = page * 21;
      const endIndex = Math.min(startIndex + 21, countries.length);

      // Criar o teclado com os países
      const keyboard = [];
      for (let i = startIndex; i < endIndex; i += 3) {
          keyboard.push(countries.slice(i, i + 3).map(country => ({ text: country })));
      }

      // Adicionar botões "Voltar" e "Próximo" se necessário
      if (countries.length > 21) {
          const navigationButtons = [];
          if (page > 0) {
              navigationButtons.push({ text: 'Back' });
          }
          if (endIndex < countries.length) {
              navigationButtons.push({ text: 'Next' });
          }
          keyboard.push(navigationButtons);
      }

      // Obter o saldo do usuário
      const balance = await getSmsActivateBalance(chatId);

      // Enviar mensagem com o teclado de países e o saldo do usuário
      bot.sendMessage(chatId, `Balance: ${balance} RUB\nChoose the country for the session:`, {
          reply_markup: {
              keyboard: keyboard
          }
      });

      // Lidar com a resposta do usuário (escolha do país)
      bot.once('message', async (msg) => {
          const chosenCountry = msg.text.toLowerCase();
          if (chosenCountry === 'back' && page > 0) {
              return country(bot, chatId, page - 1, parallelPurchase);
          } else if (chosenCountry === 'next' && endIndex < countries.length) {
              return country(bot, chatId, page + 1, parallelPurchase);
          } else if (countries.includes(chosenCountry)) {
              // Perguntar a quantidade de sessões
              bot.sendMessage(chatId, `How many sessions do you want to create for ${chosenCountry}?`);
              bot.once('message', async (msg) => {
                  const quantity = parseInt(msg.text);
                  if (!isNaN(quantity) && quantity > 0) {
                      try {
                          // Iniciar a compra das sessões
                          await buyCountry(bot, chatId, chosenCountry, quantity);
                      } catch (error) {
                          console.error('Error buying sessions:', error);
                          bot.sendMessage(chatId, "Error buying sessions. Please try again later.");
                      }
                  } else {
                      bot.sendMessage(chatId, "Invalid quantity. Please enter a number greater than zero.");
                  }
              });
          } else {
              bot.sendMessage(chatId, "Invalid country. Please choose a country from the list.");
          }
      });
  } catch (error) {
      console.error('Error getting the list of countries:', error);
      bot.sendMessage(chatId, "Error getting the list of countries. Please try again later.");
  }
};

// 8 - Comprar sessões de um país
// com a informação do país, o bot tenta comprar números de telefone
// Se não houver números disponíveis, retorna que não há números e tentar outro país
// Se houver números, o bot começa a tentar comprar números do menor preços para o maior
// O bot tenta comprar 5 números por vez, fazendo 5 requisições de compra
// Aciona smsMessage por requisição de compra feita
// informa por mensagem os números que está tentando comprar
// Aciona smsCode para receber os códigos de validação do número
// Se não houver mais números, continua os processos em andamento e ao final informa que não há mais números disponíveis
const buyCountry = async (bot, chatId, country, quantity) => {
  try {
    // Configurar a API Key
    const apiKey = await getApiKey(chatId);
    sms.setApiKey(apiKey);

    // Verificar o saldo do usuário
    const balance = await sms.getBalance();
    const priceResponse = await axios.get(`https://api.sms-activate.org/stubs/handler_api.php?api_key=${apiKey}&action=getPrice&service=tg&country=${country}`);
    const priceRub = parseFloat(priceResponse.data.split(':')[1]);
    const totalCostRub = priceRub * quantity;

    if (balance < totalCostRub) {
      return bot.sendMessage(chatId, `Insufficient balance. You need ${totalCostRub} RUB, but you only have ${balance} RUB.`);
    }

    // Comprar números e criar sessões
    let createdSessions = 0;
    let attempts = 0;
    const maxAttempts = 10; // Número máximo de tentativas de compra

    while (createdSessions < quantity && attempts < maxAttempts) {
      const buyPromises = [];
      const numbers = [];

      // Comprar 5 números por vez
      for (let i = 0; i < 5 && createdSessions < quantity; i++) {
        buyPromises.push(
          sms.getNumber('tg', country)
          .then(number => {
            numbers.push(number);
            bot.sendMessage(chatId, `Trying to buy number ${number.phone}...`);
            // Iniciar o processo de criação da sessão (smsMessage)
            smsMessage(bot, chatId, number.activationId)
              .then(success => {
                if (success) {
                  bot.sendMessage(chatId, `Session successfully created for number ${number.phone}!`);
                } else {
                  bot.sendMessage(chatId, `Error creating session for number ${number.phone}.`);
                }
              })
              .catch(error => {
                console.error(`Error creating session for number ${number.phone}:`, error);
                bot.sendMessage(chatId, `Error creating session for number ${number.phone}.`);
              });
          })
          .catch(error => {
            console.error(`Error buying number ${i + 1}:`, error);
          })
        );
        createdSessions++;
      }

      await Promise.all(buyPromises);
      attempts++;
    }

    if (createdSessions < quantity) {
      bot.sendMessage(chatId, `Unable to create all sessions. ${createdSessions} sessions created.`);
    }
  } catch (error) {
    console.error('Error buying sessions:', error);
    bot.sendMessage(chatId, "Error buying sessions. Please try again later.");
  }
};

// 9 - SMS Message
// Aguarda o código
// Se o código demorar mais do que 5 minutos (300000 ms), returna false;
// Se o código for recebido, informa o código recebido
// Tenta fazer o cadastro do número no telegram
// Se o cadastro for feito com sucesso, informa que o número {phone} foi cadastrado com sucesso e returna true
// Se o cadastro não for feito com sucesso, informa que o número {phone} não foi cadastrado por restrição no número e returna false
// 9 - SMS Message
const smsMessage = async (bot, chatId, activationId, waitingTime = 300000) => {
  try {
    // Aguardar o código SMS
    const code = await sms.getCode(activationId, waitingTime);

    // Obter o número de telefone correspondente ao activationId
    const number = await sms.getNumberInfo(activationId); 

    // Criar a sessão no Telegram
    const sessionFile = await createSessionFile(chatId, process.env.TELEGRAM_API_ID, process.env.TELEGRAM_API_HASH, number.phone, code);

    // Enviar arquivo .session para o usuário
    await sendDocument(chatId, sessionFile);

    return true; // Retornar true se a sessão foi criada com sucesso

  } catch (error) {
    console.error(`Error creating session for activationId ${activationId}:`, error);
    return false; // Retornar false se houve erro
  }
};

// 10 - Mostrar informações do usuário
const myInfo = async (bot, chatId) => {
  try {
    const userInfo = await getUserInfo({ user: { id: chatId } }, { status: () => { }, json: () => { } });
    // Formatar a mensagem com as informações do usuário
    const message = `
      *Telegram ID:* ${userInfo.telegramId}
      *Name:* ${userInfo.firstName} ${userInfo.lastName || ''}
      *Username:* ${userInfo.username || ''}
      *API Key:* ${userInfo.apiKey ? 'Configured' : 'Not Configured'}
      *Wallet:* ${userInfo.walletAddress || 'Not Configured'}
      *Your Plan:* ${userInfo.paid ? `Your plan is valid up to ${new Date(userInfo.paymentExpiration).toLocaleDateString()}` : 'Expired'}
    `;
    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error getting user information:', error);
    bot.sendMessage(chatId, "Error getting your information. Please try again later.");
  }
};

// 11 - Mostrar termos de uso
// Chama o arquivo './termsOfUse' o texto dos termos de uso
// Retorna o texto dos termos de uso
const terms = (bot, chatId) => {
  bot.sendMessage(chatId, termsOfUse, {
      parse_mode: 'MarkdownV2'
  });
};

// 12 - Mostrar ajuda
// Informa como usar o sessionBot
const help = (bot, chatId) => {
  bot.sendMessage(chatId, helpText, {
    parse_mode: 'MarkdownV2'
  });
};

// 13 - Alterar carteira
// Solicita informações do novo endereço de wallet
// Atualiza o novo endereço de wallet no mongodb
const changeWallet = (bot, chatId) => {
  // Solicita informações do novo endereço de wallet
  bot.sendMessage(chatId, "Please provide your new BSC (BEP20) wallet address:");
  bot.once('message', async (msg) => {
    const newWalletAddress = msg.text;
    try {
      // Validar o endereço da carteira (opcional)
      // ...

      // Atualiza o novo endereço de wallet no mongodb
      await User.findOneAndUpdate({ telegramId: chatId }, { walletAddress: newWalletAddress });
      bot.sendMessage(chatId, "Wallet address successfully updated!");
    } catch (error) {
      console.error('Error updating wallet address:', error);
      bot.sendMessage(chatId, "Error updating wallet address. Please try again later.");
    }
  });
};

// 14 - Registrar API Key
// Solicita a Api Key da SMS Activate
// retorna a Api Key
const registerApiKey = async (bot, chatId) => {
  // Solicita a Api Key da SMS Activate
  bot.sendMessage(chatId, "Please provide your SMS Activate API Key:");
  const apiKey = await new Promise((resolve) => {
    bot.once('message', (msg) => {
      resolve(msg.text);
    });
  });
  return apiKey;
};

// 15 - Registrar carteira
// Solicita o endereço da carteira BSC BEP20
// Informa que o pagamento deve ser feito sempre pelo endereço cadastrado, sob pena de perda do recurso
// Retorna o valor da nova carteira
const registerWallet = async (bot, chatId) => {
  bot.sendMessage(chatId, "Please provide your BSC (BEP20) wallet address:");
  const walletAddress = await new Promise((resolve) => {
    bot.once('message', (msg) => {
      resolve(msg.text);
    });
  });
  return walletAddress;
};

// 16 - Verificar saldo
// Verifica o saldo do usuário na sms activate
// Informa o saldo do usuário
const balance = async (bot, chatId) => {
  try {
    const balance = await getSmsActivateBalance(chatId);
    bot.sendMessage(chatId, `Your balance on SMS Activate is: ${balance} RUB`);
  } catch (error) {
    console.error('Error checking balance:', error);
    bot.sendMessage(chatId, "Error checking balance. Please try again later.");
  }
};

// 17 - Aceitar termos
// Essa é uma função booleana
// Aciona terms e solicita que o usuário aceite os termos de uso
// Se aceitar, returna true
const acceptTerms = (bot, chatId) => {
  bot.sendMessage(chatId, terms, {
      reply_markup: {
          keyboard: [[{ text: 'Accept' }, { text: 'Decline' }]]
      },
      parse_mode: 'MarkdownV2'
  });
};

module.exports = { registerUser, start, renew, changeApiKey, balance, terms, help, changeWallet, myInfo, cancelAll };


