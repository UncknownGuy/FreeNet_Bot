const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const moment = require('moment');

// Load environment variables from .env file
dotenv.config();

// Get BOT_TOKEN from environment variables
const token = process.env.BOT_TOKEN;

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Storage for image details
let imageStorage = {};

// Function to generate a 25-character unique ID
const generateUniqueId = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

// Function to handle duplicates in captions
const handleDuplicateCaption = (caption) => {
    let newCaption = caption;
    let counter = 1;

    while (imageStorage[newCaption]) {
        counter++;
        newCaption = `${caption}${counter}`;
    }

    return newCaption;
};

// Function to convert bytes to human-readable size
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get bot information
let botUsername;
bot.getMe().then((me) => {
    botUsername = me.username;
});

// Listen for photo uploads
bot.on('photo', async (msg) => {
    const chatId = msg.chat.id;
    const photo = msg.photo[msg.photo.length - 1];
    const photoId = photo.file_id;
    const caption = msg.caption;

    if (!caption) {
        // Ignore uploads without captions
        await bot.sendMessage(chatId, 'Please provide a caption for the image.');
        return;
    }

    // Handle duplicate captions
    const uniqueCaption = handleDuplicateCaption(caption);

    // Store the photo details with caption as key
    const imageDetails = {
        file_id: photoId,
        caption: uniqueCaption,
        uploadDate: moment().format('MMMM Do YYYY'),
        uploadTime: moment().format('h:mm:ss a'),
        orientation: photo.width > photo.height ? 'horizontal' : 'vertical',
        size: formatBytes(photo.file_size) // Image size in human-readable format
    };
    imageStorage[uniqueCaption] = imageDetails;

    // Construct the link to view the image
    const imageLink = `https://t.me/${botUsername}?start=${encodeURIComponent(uniqueCaption)}`;

    // Respond to the user with the caption, details, and the link
    const responseText = `Image uploaded successfully!\n\nCaption: \`${uniqueCaption}\`\nDetails:\n- Date Uploaded: ${imageDetails.uploadDate}\n- Time Uploaded: ${imageDetails.uploadTime}\n- Orientation: ${imageDetails.orientation}\n- Size: ${imageDetails.size}\n\n[Click here to view the image](${imageLink})`;
    await bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
    console.log(`Image stored with caption: ${uniqueCaption}, file_id: ${photoId}`);
});

// Handle inline queries
bot.on('inline_query', async (query) => {
    const queryText = query.query.trim();
    console.log(`Received inline query: ${queryText}`);

    const caption = queryText;
    console.log(`Searching for image with caption: ${caption}`);

    if (imageStorage[caption]) {
        const { file_id, caption: foundCaption, uploadDate, uploadTime, orientation, size } = imageStorage[caption];

        // Generate a unique ID for the inline query result
        const resultId = generateUniqueId(25);

        // Generate inline results using the file_id
        const results = [{
            type: 'photo',
            id: resultId,
            photo_file_id: file_id,
            thumb_file_id: file_id,
            caption: `Image with Caption: \`${foundCaption}\`\n\nDetails:\n- Date Uploaded: ${uploadDate}\n- Time Uploaded: ${uploadTime}\n- Orientation: ${orientation}\n- Size: ${size}`,
            parse_mode: 'Markdown'  // Ensuring the caption is in Markdown
        }];

        console.log(`Results: ${JSON.stringify(results)}`);
        
        // Answer the inline query
        await bot.answerInlineQuery(query.id, results);
    } else {
        console.log(`No image found with caption: ${caption}`);
        // No image found with that caption
        await bot.answerInlineQuery(query.id, []);
    }
});

// Handle start command to display image by caption
bot.onText(/\/start (.+)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const caption = match[1];

    if (imageStorage[caption]) {
        const { file_id, caption: foundCaption, uploadDate, uploadTime, orientation, size } = imageStorage[caption];

        // Send the image to the user
        await bot.sendPhoto(chatId, file_id, {
            caption: `Image with Caption: \`${foundCaption}\`\n\nDetails:\n- Date Uploaded: ${uploadDate}\n- Time Uploaded: ${uploadTime}\n- Orientation: ${orientation}\n- Size: ${size}`,
            parse_mode: 'Markdown'
        });
    } else {
        // Image not found message
        await bot.sendMessage(chatId, 'Image not found.');
    }
});

console.log('Bot is running...');
