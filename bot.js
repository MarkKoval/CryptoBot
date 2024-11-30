const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Replace with your actual bot token and CoinMarketCap API key
const TELEGRAM_BOT_TOKEN = '7834249329:AAHQ6ycu-bv-KSFetdxdrasx8FcWY-OEml4';
const CMC_API_KEY = 'cfbfcb82-8405-41de-8a4f-232043d0b7c1';

// Initialize the bot
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

// CoinMarketCap API endpoint
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';

// Mapping of token symbols to CMC IDs and emojis
const TOKEN_INFO = {
    GRASS: { emoji: '🌿', symbol: 'GRASS' }, // Replace with the actual symbol if different
    BTC: { emoji: '₿', symbol: 'BTC' },
    TON: { emoji: '💎', symbol: 'TON' },
};

// Function to fetch token prices
const fetchPrices = async () => {
    try {
        const symbols = Object.values(TOKEN_INFO).map((token) => token.symbol).join(',');
        const response = await axios.get(CMC_API_URL, {
            headers: { 'X-CMC_PRO_API_KEY': CMC_API_KEY },
            params: { symbol: symbols, convert: 'USD' },
        });
        const data = response.data.data;

        // Format the response with emojis
        return Object.entries(TOKEN_INFO).map(
            ([key, { emoji, symbol }]) =>
                `${emoji} ${symbol}: $${data[symbol]?.quote?.USD?.price.toFixed(2) || 'N/A'}`
        );
    } catch (error) {
        console.error('Error fetching prices:', error.response?.data || error.message);
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

bot.onText(/\/(restart)/, async (msg) => {
    const chatId = msg.chat.id;
    const messageText = `Restart`;
    bot.sendMessage(chatId, messageText);
});

// Track active users for automatic updates
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
