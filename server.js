require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

const conversations = require('./html');
const app = express();

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/api/conversations', (req, res) => {
    res.json(conversations);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
