const mineflayer = require('mineflayer');
const fs = require('fs');
const path = require('path');

const configPath = path.resolve(__dirname, 'settings.json');
console.debug("[DEBUG] Loading config from:", configPath);

let config;
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
    console.error("[ERROR] Failed to load settings.json! Error:", error);
    process.exit(1);
}

let bot;

function createBot() {
    bot = mineflayer.createBot({
        host: config.host,
        port: config.port,
        username: config.username,
        version: config.version
    });

    bot.on('login', () => {
        console.log(`[INFO] Logged in as ${bot.username}`);
        if (config.antiAFK) {
            setInterval(() => {
                bot.setControlState('jump', true);
                setTimeout(() => bot.setControlState('jump', false), 500);
            }, 10000);
        }
        if (config.chatMessages && config.chatMessages.length > 0) {
            let i = 0;
            setInterval(() => {
                bot.chat(config.chatMessages[i % config.chatMessages.length]);
                i++;
            }, config.chatInterval || 60000);
        }
    });

    bot.on('end', () => {
        console.warn("[WARN] Bot disconnected.");
        if (config.autoReconnect) {
            console.log(`[INFO] Reconnecting in ${config.reconnectDelay || 5000}ms...`);
            setTimeout(createBot, config.reconnectDelay || 5000);
        }
    });

    bot.on('error', (err) => {
        console.error("[ERROR]", err);
    });

    if (config.logChat) {
        bot.on('chat', (username, message) => {
            if (username !== bot.username) {
                console.log(`[CHAT] ${username}: ${message}`);
            }
        });
    }
}

createBot();