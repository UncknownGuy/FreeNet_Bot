const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const moment = require('moment');

// Load environment variables from .env file
dotenv.config();

// Get BOT_TOKEN from environment variables
const token = process.env.BOT_TOKEN;

// Create a bot instance
const bot = new TelegramBot(token, { polling: true });

// Storage for media details
let mediaStorage = {};

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

    while (mediaStorage[newCaption]) {
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

// Get bot information and set botUsername
let botUsername = null;
bot.getMe().then((me) => {
    botUsername = me.username;
});

// Handle media uploads and text commands
bot.on('text', async (msg) => {
    const chatId = msg.chat.id;
    const command = msg.text.split(' ')[0];
    const caption = msg.text.split(' ').slice(1).join(' ');

    if (command === '/start' && caption) {
        if (mediaStorage[caption]) {
            const { file_id, caption: foundCaption, uploadDate, uploadTime, type, size } = mediaStorage[caption];

            // Send the media to the user based on type
            if (type === 'photo') {
                await bot.sendPhoto(chatId, file_id, {
                    caption: `Image with Caption: \`${foundCaption}\`\n\nDetails:\n- Date Uploaded: ${uploadDate}\n- Time Uploaded: ${uploadTime}\n- Size: ${size}`,
                    parse_mode: 'Markdown'
                });
            } else if (type === 'video') {
                await bot.sendVideo(chatId, file_id, {
                    caption: `Video with Caption: \`${foundCaption}\`\n\nDetails:\n- Date Uploaded: ${uploadDate}\n- Time Uploaded: ${uploadTime}\n- Size: ${size}`,
                    parse_mode: 'Markdown'
                });
            } else if (type === 'document') {
                await bot.sendDocument(chatId, file_id, {
                    caption: `Document with Caption: \`${foundCaption}\`\n\nDetails:\n- Date Uploaded: ${uploadDate}\n- Time Uploaded: ${uploadTime}\n- Size: ${size}`,
                    parse_mode: 'Markdown'
                });
            }
        } else {
            // Media not found message
            await bot.sendMessage(chatId, 'Media not found.');
        }
    }
});

// Listen for media uploads (photo, video, document)
bot.on('photo', handleMediaUpload);
bot.on('video', handleMediaUpload);
bot.on('document', handleMediaUpload);

// Function to handle media uploads
async function handleMediaUpload(msg) {
    const chatId = msg.chat.id;
    let file, fileId, fileType;

    if (msg.photo) {
        file = msg.photo[msg.photo.length - 1];
        fileId = file.file_id;
        fileType = 'photo';
    } else if (msg.video) {
        file = msg.video;
        fileId = file.file_id;
        fileType = 'video';
    } else if (msg.document) {
        file = msg.document;
        fileId = file.file_id;
        fileType = 'document';
    }

    const caption = msg.caption;

    if (!caption) {
        await bot.sendMessage(chatId, 'Please provide a caption for the media.');
        return;
    }

    const uniqueCaption = handleDuplicateCaption(caption);

    const mediaDetails = {
        file_id: fileId,
        caption: uniqueCaption,
        uploadDate: moment().format('MMMM Do YYYY'),
        uploadTime: moment().format('h:mm:ss a'),
        type: fileType,
        size: formatBytes(file.file_size) // Media size in human-readable format
    };
    mediaStorage[uniqueCaption] = mediaDetails;

    // Wait for botUsername to be set before generating the link
    await bot.getMe();
    const mediaLink = `https://t.me/${botUsername}?start=${encodeURIComponent(uniqueCaption)}`;

    // Respond to the user with the caption, details, and the link
    let responseText = '';
    if (fileType === 'photo') {
        const orientation = file.width > file.height ? 'horizontal' : 'vertical';
        responseText = `Image uploaded successfully!\n\nCaption: \`${uniqueCaption}\`\nDetails:\n- Date Uploaded: ${mediaDetails.uploadDate}\n- Time Uploaded: ${mediaDetails.uploadTime}\n- Orientation: ${orientation}\n- Size: ${mediaDetails.size}\n\n[Click here to view the image](${mediaLink})`;
    } else if (fileType === 'video') {
        responseText = `Video uploaded successfully!\n\nCaption: \`${uniqueCaption}\`\nDetails:\n- Date Uploaded: ${mediaDetails.uploadDate}\n- Time Uploaded: ${mediaDetails.uploadTime}\n- Size: ${mediaDetails.size}\n\n[Click here to view the video](${mediaLink})`;
    } else if (fileType === 'document') {
        responseText = `Document uploaded successfully!\n\nCaption: \`${uniqueCaption}\`\nDetails:\n- Date Uploaded: ${mediaDetails.uploadDate}\n- Time Uploaded: ${mediaDetails.uploadTime}\n- Size: ${mediaDetails.size}\n\n[Click here to view the document](${mediaLink})`;
    }

    await bot.sendMessage(chatId, responseText, { parse_mode: 'Markdown' });
    console.log(`${fileType} stored with caption: ${uniqueCaption}, file_id: ${fileId}`);
}

// Handle inline queries
bot.on('inline_query', async (query) => {
    const queryText = query.query.trim().toLowerCase();
    console.log(`Received inline query: ${queryText}`);

    const results = [];

    // Search for matching captions in mediaStorage
    Object.values(mediaStorage).forEach((media) => {
        if (media.caption.toLowerCase().includes(queryText)) {
            let result = {
                type: media.type,
                id: generateUniqueId(25),
                [`${media.type}_file_id`]: media.file_id,
                title: media.caption, // Title field for inline query result
                caption: `${media.type.charAt(0).toUpperCase() + media.type.slice(1)} with Caption: \`${media.caption}\`\n\nDetails:\n- Date Uploaded: ${media.uploadDate}\n- Time Uploaded: ${media.uploadTime}\n- Size: ${media.size}`,
                parse_mode: 'Markdown'
            };
            if (media.type === 'photo') {
                result.thumb_file_id = media.file_id; // Add thumbnail for photos
            }
            results.push(result);
        }
    });

    console.log(`Inline query results: ${JSON.stringify(results)}`);

    // Answer the inline query with results
    await bot.answerInlineQuery(query.id, results);
});

console.log('Bot is running...');
