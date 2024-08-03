const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { MongoClient } = require('mongodb');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'colorSelector';
let db;

MongoClient.connect(mongoUrl, { useUnifiedTopology: true }, (err, client) => {
    if (err) throw err;
    db = client.db(dbName);
    console.log(`Connected to database: ${dbName}`);
});

io.on('connection', (socket) => {
    console.log('New client connected');

    db.collection('colors').findOne({}, (err, result) => {
        if (err) throw err;
        if (result) {
            socket.emit('colorChange', result.color);
        }
    });

    socket.on('colorChange', (color) => {
        io.emit('colorChange', color);
        db.collection('colors').updateOne({}, { $set: { color: color } }, { upsert: true });
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));

module.exports = app;
