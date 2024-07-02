const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Replace with your bot token from .env file
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });

// Replace with the chat ID of the private channel
const privateChannelId = '-1002220523648'; // Example: '-1002220523648' (replace with your private channel ID)

// Listen for incoming messages
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  // Check if the message contains an image
  if (msg.photo && msg.photo.length > 0) {
    const photo = msg.photo[msg.photo.length - 1]; // Get the largest photo (highest resolution)
    const photoId = photo.file_id;

    // Extract and parse the caption for inline keyboard buttons
    const { caption } = msg;
    const inlineButtons = parseInlineButtonsFromCaption(caption);

    try {
      // Forward the image to the private channel
      await bot.sendPhoto(privateChannelId, photoId, {
        caption: cleanCaption || 'Original message',
        reply_markup: {
          inline_keyboard: inlineButtons.map(button => [{ text: button.text, url: button.url }])
        }
      });

      console.log(`Image forwarded with inline keyboard to private channel ${privateChannelId}`);
    } catch (error) {
      console.error('Error forwarding image:', error.response ? error.response.data : error.message);
      // Send a failure message to the user (optional)
      // bot.sendMessage(chatId, 'Failed to forward the image. Please try again later.');
    }
  }
});

// Function to parse inline buttons from the caption
function parseInlineButtonsFromCaption(caption) {
  const inlineButtons = [];

  // Regular expression to find buttons in the format "[TEXT](URL)"
  const buttonRegex = /\[(.*?)\]\((.*?)\)/g;
  let match;

  while ((match = buttonRegex.exec(caption)) !== null) {
    const text = match[1].trim();
    const url = match[2].trim();

    // Create the inline button object
    const button = { text, url };
    inlineButtons.push(button);
  }

  return inlineButtons;
}

// Function to clean up caption by removing inline buttons syntax
function cleanCaption(caption) {
  // Remove inline keyboard syntax "[TEXT](URL)" from caption
  return caption.replace(/\[(.*?)\]\((.*?)\)/g, '').trim();
}

console.log('Bot is running...');
