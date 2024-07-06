require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');

// Get the token from the environment variables
const token = process.env.BOT_TOKEN;

// Create an Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve the static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Handle incoming messages from Telegram bot
bot.on('message', (msg) => {
  const chatId = msg.chat.id;
  if (msg.text) {
    // If the message is text, emit it to the connected clients
    io.emit('message', { user: `${msg.from.first_name} ${msg.from.last_name}`, text: msg.text });
  } else if (msg.photo) {
    // If the message is an image, get the photo with the highest resolution
    const photo = msg.photo[msg.photo.length - 1];
    const imageCaption = msg.caption || ''; // Optionally handle caption
    // Get the image URL and emit it to the connected clients
    bot.getFile(photo.file_id).then(fileInfo => {
      const imageFileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
      io.emit('message', { user: `${msg.from.first_name} ${msg.from.last_name}`, type: 'image', mediaUrl: imageFileUrl, caption: imageCaption, username: msg.from.username });
    }).catch(err => {
      console.log('Error fetching file:', err);
    });
  } else if (msg.video) {
    // If the message is a video, get the video file_id and emit it to the connected clients
    const video = msg.video;
    const videoCaption = msg.caption || ''; // Optionally handle caption
    // Get the video URL and emit it to the connected clients
    bot.getFile(video.file_id).then(fileInfo => {
      const videoFileUrl = `https://api.telegram.org/file/bot${token}/${fileInfo.file_path}`;
      io.emit('message', { user: `${msg.from.first_name} ${msg.from.last_name}`, type: 'video', mediaUrl: videoFileUrl, caption: videoCaption, username: msg.from.username });
    }).catch(err => {
      console.log('Error fetching file:', err);
    });
  }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
