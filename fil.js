const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Replace with your bot token from .env file
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Replace with the chat ID of the user you want to send information to
const userIdToSendInfo = '7105003930'; // Example: '7105003930' (replace with the user ID)

// Listen for messages from any chat the bot is added to
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Prepare message content to send to the user
  let messageText = `ℹ️ *Message Info*:\n`;
  messageText += `From: ${msg.from.username ? `@${msg.from.username}` : msg.from.first_name}\n`;
  messageText += `Chat ID: ${chatId}\n`;
  messageText += `Message ID: ${msg.message_id}\n`;
  messageText += `Text: ${msg.text || '(no text)'}\n`;
  messageText += `Has Photo: ${msg.photo ? 'Yes' : 'No'}\n`;
  
  // Check if the message is forwarded
  if (msg.forward_from_chat) {
    messageText += `Forwarded: Yes\n`;
    messageText += `Forwarded From Chat Type: ${msg.forward_from_chat.type}\n`; // Type can be 'channel', 'group', etc.
    messageText += `Forwarded From Chat ID: ${msg.forward_from_chat.id}\n`;
    messageText += `Forwarded Message ID: ${msg.forward_from_message_id}\n`;
  } else {
    messageText += `Forwarded: No\n`;
  }

  // Send the message info to the user
  bot.sendMessage(userIdToSendInfo, messageText, { parse_mode: 'Markdown' })
    .then(() => {
      console.log(`Message info sent to user ${userIdToSendInfo}`);
    })
    .catch((error) => {
      console.error('Error sending message info:', error);
    });
});

console.log('Bot is running...');
