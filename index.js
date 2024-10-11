const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files (optional if you want to add HTML/CSS later)
app.use(express.static('public'));

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('New user connected');

  // Handle WebRTC signaling
  socket.on('signal', (data) => {
    console.log('Signal received:', data);
    socket.broadcast.emit('signal', data); // Broadcast to other peers
  });

  // Handle users joining rooms
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`User joined room: ${roomId}`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
