const { Router } = require('express');
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Create a router
const app = Router();

// Replace with your actual bot token and CoinMarketCap API key
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CMC_API_KEY = process.env.CMC_API_KEY;

// Initialize the bot in webhook mode
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { webHook: true });

// Set webhook for Telegram
const BOT_URL = process.env.BOT_URL; // Example: https://your-vercel-app.vercel.app
bot.setWebHook(`${BOT_URL}/api/bot`);

// CoinMarketCap API endpoint and token information
const CMC_API_URL = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
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

        return Object.entries(TOKEN_INFO).map(
            ([key, { emoji, symbol }]) =>
                `${emoji} ${symbol}: $${data[symbol]?.quote?.USD?.price.toFixed(2) || 'N/A'}`
        );
    } catch (error) {
        console.error('Error fetching prices:', error.response?.data || error.message);
        return ['Error fetching prices'];
    }
};

// Handle incoming messages
bot.onText(/\/(start|prices)/, async (msg) => {
    const chatId = msg.chat.id;
    const userName = msg.from.first_name || 'User';
    const prices = await fetchPrices();
    const messageText = `Hello, ${userName}!\nCurrent Prices:\n${prices.join('\n')}`;
    bot.sendMessage(chatId, messageText);
});

// Webhook route for Telegram
app.post('/api/bot', (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Default route
app.get('/', (req, res) => {
    res.send('Telegram Bot is running!');
});

module.exports = app;
