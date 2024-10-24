const { bot } = require('./server');

const { registerUser, start, renew, changeApiKey, balance, terms, help, changeWallet, myInfo, cancelAll } = require('./backend/utils/frontendUtils');

const menu = bot.setMycommands([
    { command: '/register', description: 'Register for an account'},
    { command: '/start', description: 'Start the bot'},
    { command: '/renew', description: 'Renew your subscription'},
    { command: '/changeapikey', description: 'Change your API key'},
    { command: '/changewallet', description: 'Change your wallet address'},
    { command: '/balance', description: 'Check your sms balance'},
    { command: '/terms', description: 'View the terms of use'},
    { command: '/myinfo', description: 'View your account information'},
    { command: '/help', description: 'Get help'},
    { command: '/cancelall', description: 'Cancel all buying process'}
]);

bot.onText(/\/register/, (msg) => {
    const chatId = msg.chat.id;
    registerUser(bot, chatId);
});

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    start(bot, chatId);
});

bot.onText(/\/renew/, (msg) => {
    const chatId = msg.chat.id;
    renew(bot, chatId);
});

bot.onText(/\/changeapikey/, (msg) => {
    const chatId = msg.chat.id;
    changeApiKey(bot, chatId);
});

bot.onText(/\/changewallet/, (msg) => {
    const chatId = msg.chat.id;
    changeWallet(bot, chatId);
});

bot.onText(/\/balance/, (msg) => {
    const chatId = msg.chat.id;
    balance(bot, chatId);
});

bot.onText(/\/terms/, (msg) => {
    const chatId = msg.chat.id;
    terms(bot, chatId);
});

bot.onText(/\/myinfo/, (msg) => {
    const chatId = msg.chat.id;
    myInfo(bot, chatId);
});

bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    help(bot, chatId);
});

bot.onText(/\/cancelall/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'All buying processes have been canceled');
});