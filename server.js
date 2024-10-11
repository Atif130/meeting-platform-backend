const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-meeting', (meetingID) => {
    socket.join(meetingID);
    console.log(`User ${socket.id} joined meeting: ${meetingID}`);
    socket.to(meetingID).emit('user-connected', socket.id);
  });

  // Handle offer
  socket.on('offer', (data) => {
    console.log('Offer received from:', socket.id, 'to:', data.to);
    socket.to(data.to).emit('offer', { offer: data.offer, from: socket.id });
  });

  // Handle answer
  socket.on('answer', (data) => {
    console.log('Answer received from:', socket.id, 'to:', data.to);
    socket.to(data.to).emit('answer', { answer: data.answer, from: socket.id });
  });

  // Handle ICE candidate
  socket.on('ice-candidate', (data) => {
    console.log('ICE candidate received from:', socket.id, 'to:', data.to);
    socket.to(data.to).emit('ice-candidate', { candidate: data.candidate, from: socket.id });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
