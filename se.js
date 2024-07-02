const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const channelId = process.env.PRIVATE_CHANNEL_ID;
const resultsPerPage = 10; // Number of results to show per page

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

// Load existing chat data from file or initialize an empty object
let chatData = {};
const chatFile = './chat.json';

if (fs.existsSync(chatFile)) {
    try {
        chatData = JSON.parse(fs.readFileSync(chatFile));
    } catch (error) {
        console.error('Error parsing chat.json:', error.message);
    }
}

// Listener for /start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const message = 'Hello! I am your channel info bot.';
    bot.sendMessage(chatId, message);
});

// Listener for /img [caption] command
bot.onText(/\/img (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const captionQuery = match[1];

    // Search for the image, video, or document by caption in chatData
    let foundItems = [];
    if (chatData[channelId]) {
        foundItems = chatData[channelId].filter(item => item.caption && item.caption.includes(captionQuery));
    }

    if (foundItems.length > 0) {
        // Calculate number of pages
        const pageCount = Math.ceil(foundItems.length / resultsPerPage);

        // Display the first page of results
        displayResults(chatId, foundItems, 1, pageCount);
    } else {
        bot.sendMessage(chatId, 'No items with the specified caption found.');
        console.log(`No items with caption containing "${captionQuery}" found.`);
    }
});

// Handle callback queries from inline keyboards
bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;

    if (data.startsWith('forward_')) {
        const forwardMessageId = data.split('_')[1];
        bot.forwardMessage(chatId, channelId, forwardMessageId)
            .then(() => {
                console.log(`Forwarded message with ID ${forwardMessageId} to user.`);
            })
            .catch((error) => {
                console.error('Error forwarding message:', error.message);
            });
    } else if (data.startsWith('page_')) {
        const pageNumber = parseInt(data.split('_')[1], 10);

        // Ensure captionQuery is defined
        let captionQuery = '';

        // Search for the image, video, or document by caption in chatData
        let foundItems = [];
        if (chatData[channelId]) {
            foundItems = chatData[channelId].filter(item => item.caption && item.caption.includes(captionQuery));
        }

        if (foundItems.length > 0) {
            // Calculate number of pages
            const pageCount = Math.ceil(foundItems.length / resultsPerPage);

            // Display the selected page of results
            displayResults(chatId, foundItems, pageNumber, pageCount, messageId);
        }
    }

    // Answer callback query to remove the inline keyboard
    bot.answerCallbackQuery(query.id);
});

// Function to display results with pagination
function displayResults(chatId, foundItems, pageNumber, pageCount, messageId) {
    // Calculate start and end index for the page
    const startIndex = (pageNumber - 1) * resultsPerPage;
    const endIndex = startIndex + resultsPerPage;

    // Get items for the selected page
    const limitedItems = foundItems.slice(startIndex, endIndex);

    // Prepare inline keyboard with captions
    const keyboard = {
        inline_keyboard: limitedItems.map(item => ([{ text: item.caption, callback_data: `forward_${item.messageId}` }]))
    };

    // Update navigation buttons
    updatePaginationInlineKeyboard(keyboard, pageNumber, pageCount);

    // Edit the message with updated inline keyboard or send new message
    if (messageId) {
        bot.editMessageReplyMarkup({ inline_keyboard: keyboard.inline_keyboard }, {
            chat_id: chatId,
            message_id: messageId
        })
            .then(() => {
                console.log(`Updated pagination for page ${pageNumber}.`);
            })
            .catch((error) => {
                console.error('Error updating pagination:', error.message);
            });
    } else {
        bot.sendMessage(chatId, `Results: ${foundItems.length}`, { reply_markup: keyboard })
            .then(() => {
                console.log(`Sent ${foundItems.length} results to user.`);
            })
            .catch((error) => {
                console.error('Error sending message:', error.message);
            });
    }
}

// Function to update pagination inline keyboard
function updatePaginationInlineKeyboard(keyboard, currentPage, pageCount) {
    keyboard.inline_keyboard = keyboard.inline_keyboard || [];

    // Clear existing pagination buttons
    keyboard.inline_keyboard = keyboard.inline_keyboard.filter(row => !row.some(button => button.callback_data && button.callback_data.startsWith('page_')));

    // Add pagination buttons
    if (currentPage > 1) {
        // Top row: Previous button
        keyboard.inline_keyboard.unshift([
            { text: `< Prev ${currentPage - 1}`, callback_data: `page_${currentPage - 1}` }
        ]);
    }

    // Bottom row: Next button
    const bottomRow = [];

    if (currentPage < pageCount) {
        bottomRow.push({ text: `Next ${currentPage + 1} >`, callback_data: `page_${currentPage + 1}` });
    }

    keyboard.inline_keyboard.push(bottomRow);
}


// Listener for channel posts
bot.on('channel_post', (msg) => {
    const chatId = msg.chat.id;
    if (chatId.toString() === channelId) {
        if (msg.photo) {
            // Handling image messages
            const largestPhoto = msg.photo[msg.photo.length - 1]; // Get the highest resolution photo
            const imageData = {
                messageId: msg.message_id,
                date: new Date().toISOString(),
                file_id: largestPhoto.file_id,
                caption: msg.caption || '',
                type: 'photo'
            };

            // Initialize array if chatId doesn't exist
            if (!chatData.hasOwnProperty(chatId)) {
                chatData[chatId] = [];
            }

            chatData[chatId].push(imageData);
        } else if (msg.video) {
            // Handling video messages
            const videoData = {
                messageId: msg.message_id,
                date: new Date().toISOString(),
                file_id: msg.video.file_id,
                caption: msg.caption || '',
                type: 'video'
            };

            // Initialize array if chatId doesn't exist
            if (!chatData.hasOwnProperty(chatId)) {
                chatData[chatId] = [];
            }

            chatData[chatId].push(videoData);
        } else if (msg.document) {
            // Handling document messages
            const documentData = {
                messageId: msg.message_id,
                date: new Date().toISOString(),
                file_id: msg.document.file_id,
                caption: msg.caption || '',
                type: 'document'
            };

            // Initialize array if chatId doesn't exist
            if (!chatData.hasOwnProperty(chatId)) {
                chatData[chatId] = [];
            }

            chatData[chatId].push(documentData);
        } else if (msg.text) {
            // Handling text messages
            const messageData = {
                messageId: msg.message_id,
                date: new Date().toISOString(),
                text: msg.text,
                type: 'text'
            };

            // Initialize array if chatId doesn't exist
            if (!chatData.hasOwnProperty(chatId)) {
                chatData[chatId] = [];
            }

            chatData[chatId].push(messageData);
        }

        // Save chatData to file
        saveChatData();
        console.log(`Received message in private channel ${channelId}: ${msg.text || `Item with caption: ${msg.caption || ''}`}`);
    }
});

// Function to save chatData to JSON file
function saveChatData() {
    try {
        fs.writeFileSync(chatFile, JSON.stringify(chatData, null, 2));
    } catch (error) {
        console.error('Error saving chat.json:', error.message);
    }
}

// Error handling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error.message);
});
