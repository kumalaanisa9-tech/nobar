const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Store users and current video
let users = [];
let currentVideoLink = '';

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join', (data) => {
        const { username, isHost, videoLink } = data;
        
        users.push({ 
            id: socket.id, 
            username: username,
            isHost: isHost 
        });
        
        socket.username = username;
        socket.isHost = isHost;
        
        // If host sets video, update for everyone
        if (isHost && videoLink) {
            currentVideoLink = videoLink;
            io.emit('loadVideo', currentVideoLink);
            io.emit('systemMessage', `👑 ${username} set video baru!`);
        } else if (currentVideoLink) {
            // Send current video to new user
            socket.emit('loadVideo', currentVideoLink);
        }
        
        io.emit('updateUsers', users.map(u => ({ 
            username: u.username, 
            isHost: u.isHost 
        })));
        io.emit('systemMessage', `${isHost ? '👑 ' : ''}${username} bergabung!`);
    });

    socket.on('changeVideo', (videoLink) => {
        if (socket.isHost) {
            currentVideoLink = videoLink;
            io.emit('loadVideo', currentVideoLink);
            io.emit('systemMessage', `👑 ${socket.username} ganti video!`);
        }
    });

    socket.on('play', () => {
        io.emit('play');
    });

    socket.on('pause', () => {
        io.emit('pause');
    });

    socket.on('seek', (time) => {
        socket.broadcast.emit('seek', time);
    });

    socket.on('sendMessage', (message) => {
        io.emit('message', {
            username: socket.username,
            message: message
        });
    });

    socket.on('disconnect', () => {
        users = users.filter(u => u.id !== socket.id);
        io.emit('updateUsers', users.map(u => ({ 
            username: u.username, 
            isHost: u.isHost 
        })));
        if (socket.username) {
            io.emit('systemMessage', `${socket.username} keluar`);
        }
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Server jalan di http://localhost:${PORT}`);
});
