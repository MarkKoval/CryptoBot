const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Replace with your actual bot token
const TELEGRAM_BOT_TOKEN = '7834249329:AAGb8wzWsvWbAqW0RcT9ilv3scHuLRbBh7E';

// Initialize the bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// CoinGecko API endpoint
const CRYPTO_API_URL = 'https://api.coingecko.com/api/v3/simple/price';

// Token IDs as per CoinGecko's API
const TOKEN_IDS = {
    GRASS: 'grass-token', // Replace with the actual ID for GRASS
    BITCOIN: 'bitcoin',
    TON: 'toncoin'
};

// Function to fetch token prices
const fetchPrices = async () => {
    try {
        const ids = Object.values(TOKEN_IDS).join(',');
        const response = await axios.get(`${CRYPTO_API_URL}?ids=${ids}&vs_currencies=usd`);
        const prices = response.data;
        return Object.entries(TOKEN_IDS).map(([token, id]) => `${token}: $${prices[id].usd}`);
    } catch (error) {
        console.error('Error fetching prices:', error);
        return ['Error fetching prices'];
    }
};

// Respond to the `/start` or `/prices` command
bot.onText(/\/(start|prices)/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'User';
    const prices = await fetchPrices();
    const messageText = `Hello, ${userName}!\nCurrent Prices:\n${prices.join('\n')}`;
    bot.sendMessage(chatId, messageText);
});

// Send prices automatically to users who interact with the bot
const activeUsers = new Set();

bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    if (!activeUsers.has(chatId)) {
        activeUsers.add(chatId);
    }
});

// Periodically send prices to all active users
const sendPricesToAll = async () => {
    const prices = await fetchPrices();
    const messageText = `Current Prices:\n${prices.join('\n')}`;
    activeUsers.forEach((chatId) => {
        bot.sendMessage(chatId, messageText);
    });
};

// Schedule price updates every hour
setInterval(sendPricesToAll, 60 * 60 * 1000); // Every hour
