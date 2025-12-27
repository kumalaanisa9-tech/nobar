const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  socket.on('join', (data) => {
    socket.join(data.room);
    socket.room = data.room;
    socket.username = data.username;
    io.to(data.room).emit('message', `${data.username} bergabung`);
  });

  socket.on('video', (data) => {
    socket.to(data.room).emit('video', data);
  });

  socket.on('chat', (msg) => {
    io.to(socket.room).emit('chat', {
      user: socket.username,
      msg: msg
    });
  });
});

server.listen(3000, () => console.log('Server jalan di http://localhost:3000'));
``