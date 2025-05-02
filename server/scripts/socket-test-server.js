const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('ping', (msg) => {
    console.log('Received ping:', msg);
    socket.emit('pong', 'Hello from server!');
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(4000, () => {
  console.log('Socket.io test server running on port 4000');
}); 