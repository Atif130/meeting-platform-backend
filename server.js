const express = require('express');    // Importing Express framework
const http = require('http');          // Native HTTP server
const { Server } = require('socket.io'); // Importing Socket.IO for real-time communication
const path = require('path');          // For handling file paths

const app = express();                 // Initializing the Express app
const server = http.createServer(app); // Creating an HTTP server
const io = new Server(server);         // Creating a Socket.IO server

// Serve static files from the 'public' folder (will host the frontend here)
app.use(express.static(path.join(__dirname, 'public')));

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected');  // When a user connects, log it to the console

  // Handling a user joining a meeting room
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);             // Add the user to the specified room
    socket.to(roomId).emit('user-connected', userId); // Notify other users in the room
  });

  // Handling a user disconnecting
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    // Additional cleanup actions can be added here
  });
});

// Starting the server on port 3000 or an environment-defined port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
