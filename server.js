const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = new Map(); // Store room states

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room
  socket.on('join-room', (roomId, username) => {
    socket.join(roomId);
    socket.username = username;
    socket.roomId = roomId;

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        users: [],
        videoState: { currentTime: 0, playing: false, url: '' }
      });
    }

    const room = rooms.get(roomId);
    room.users.push({ id: socket.id, username });

    // Send current state to new user
    socket.emit('sync-state', room.videoState);

    // Notify others
    socket.to(roomId).emit('user-joined', { username, userId: socket.id });
    io.to(roomId).emit('user-list', room.users);

    console.log(`${username} joined room ${roomId}`);
  });

  // Video control events
  socket.on('video-play', (data) => {
    const room = rooms.get(socket.roomId);
    if (room) {
      room.videoState.playing = true;
      room.videoState.currentTime = data.currentTime;
    }
    socket.to(socket.roomId).emit('video-play', data);
  });

  socket.on('video-pause', (data) => {
    const room = rooms.get(socket.roomId);
    if (room) {
      room.videoState.playing = false;
      room.videoState.currentTime = data.currentTime;
    }
    socket.to(socket.roomId).emit('video-pause', data);
  });

  socket.on('video-seek', (data) => {
    const room = rooms.get(socket.roomId);
    if (room) {
      room.videoState.currentTime = data.currentTime;
    }
    socket.to(socket.roomId).emit('video-seek', data);
  });

  socket.on('video-url-change', (data) => {
    const room = rooms.get(socket.roomId);
    if (room) {
      room.videoState.url = data.url;
    }
    socket.to(socket.roomId).emit('video-url-change', data);
  });

  // Chat messages
  socket.on('chat-message', (message) => {
    io.to(socket.roomId).emit('chat-message', {
      username: socket.username,
      message,
      timestamp: Date.now()
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (socket.roomId && rooms.has(socket.roomId)) {
      const room = rooms.get(socket.roomId);
      room.users = room.users.filter(u => u.id !== socket.id);
      
      socket.to(socket.roomId).emit('user-left', { 
        username: socket.username, 
        userId: socket.id 
      });
      io.to(socket.roomId).emit('user-list', room.users);

      if (room.users.length === 0) {
        rooms.delete(socket.roomId);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000; // GIÀ OK per Render
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});


