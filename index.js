const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
require('dotenv').config();  // Load environment variables from .env file

// Replace with your bot token from .env file
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

const imageUrl = 'https://images.filmibeat.com/webp/wallpapers/desktop/2022/07/alia-bhatt_53.jpg';

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  
  const options = {
    caption: 'FʀᴇᴇNᴇᴛ BOT V¹',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '𝚂𝙴𝚁𝚅𝙴𝚁𝚂', callback_data: 'servers' },
          { text: '𝚂𝚃𝙰𝚃𝚄𝚂', callback_data: 'status' },
          { text: '𝙷𝙾𝚂𝚃𝚂', callback_data: 'hosts' }
        ]
      ]
    }
  };

  bot.sendPhoto(chatId, imageUrl, options);
});

bot.on('callback_query', (callbackQuery) => {
  const message = callbackQuery.message;
  const data = callbackQuery.data;

  bot.answerCallbackQuery(callbackQuery.id)
    .then(() => {
      if (data === 'servers') {
        // Clear previous responses by deleting the original message
        bot.deleteMessage(message.chat.id, message.message_id)
          .then(() => {
            // Send the image with the new inline keyboard
            const options = {
              caption: 'FʀᴇᴇNᴇᴛ BOT V¹',
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: '𝚂𝚂𝙷', callback_data: 'ssh' },
                    { text: '𝚅𝙼𝙴𝚂𝚂', callback_data: 'vmess' },
                    { text: '𝚅𝙻𝙴𝚂𝚂', callback_data: 'vless' }
                  ]
                ]
              }
            };
            bot.sendPhoto(message.chat.id, imageUrl, options);
          })
          .catch((err) => {
            console.error('Error deleting message:', err);
          });
      } else if (data === 'status') {
        bot.sendMessage(message.chat.id, 'You pressed "status".');
      } else if (data === 'hosts') {
        bot.sendMessage(message.chat.id, 'You pressed "hosts".');
      } else if (data === 'ssh') {
        bot.sendMessage(message.chat.id, 'You pressed "ssh".');
      } else if (data === 'vmess') {
        // Clear previous responses by deleting the original message
        bot.deleteMessage(message.chat.id, message.message_id)
          .then(() => {
            // Read vmess links from the JSON file
            fs.readFile('./vmess.json', 'utf8', (err, data) => {
              if (err) {
                console.error('Error reading vmess.json:', err);
                bot.sendMessage(message.chat.id, 'There was an error reading the vmess links.');
                return;
              }
              const vmessLinks = JSON.parse(data);
              let vmessMessage = '';
              vmessLinks.forEach((link, index) => {
                vmessMessage += `<b>Link ${index + 1}</b>: <code>${link}</code>\n\n`;
              });
              bot.sendMessage(message.chat.id, vmessMessage, { parse_mode: 'HTML' });
            });
          })
          .catch((err) => {
            console.error('Error deleting message:', err);
          });
      } else if (data === 'vless') {
        bot.sendMessage(message.chat.id, 'You pressed "vless".');
      }
    })
    .catch((err) => {
      console.error('Error answering callback query:', err);
    });
});

console.log('Bot is running...');
