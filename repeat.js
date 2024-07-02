const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const axios = require('axios');

// Load environment variables from .env file
dotenv.config();

// Replace with your bot token from .env file
const token = process.env.BOT_TOKEN;

// Replace with your private channel ID from .env file
const privateChannelId = process.env.PRIVATE_CHANNEL_ID;

// Image URL to send
const imageUrl = 'https://cdni.pornpics.com/1280/7/719/41030643/41030643_001_697b.jpg';

// Caption with special characters
const caption = '𝙿𝚘𝚠𝚎𝚛𝚍 𝙱𝚢 𝙺𝚎𝚜𝚒𝚝𝚑𝚊';

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Function to send message with image and caption, and then delete after a delay
async function sendAndDeleteMessage() {
  try {
    // Download the image file
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const imageBuffer = Buffer.from(response.data, 'binary');

    // Send photo with caption to the private channel
    const sentPhoto = await bot.sendPhoto(privateChannelId, imageBuffer, { caption: caption });

    console.log(`Image sent to channel ${privateChannelId} with caption: ${caption}`);
    console.log(sentPhoto); // Log the sent photo object for debugging

    // Delayed deletion after 1 second
    setTimeout(async () => {
      try {
        // Delete the sent message
        await bot.deleteMessage(privateChannelId, sentPhoto.message_id);
        console.log(`Message deleted from channel ${privateChannelId}`);
      } catch (error) {
        console.error('Error deleting message:', error.response ? error.response.data : error.message);
      }

      // Call the function again for continuous loop
      sendAndDeleteMessage();
    }, 1000); // 1000 milliseconds = 1 second
  } catch (error) {
    console.error('Error sending image:', error.response ? error.response.data : error.message);
  }
}

// Start the process by calling the function once
sendAndDeleteMessage();

console.log('Bot is running...');
