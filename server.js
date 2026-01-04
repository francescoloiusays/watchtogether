
const PORT = process.env.PORT || 3000;

const io = require("socket.io")(PORT, {
  cors: {
    origin: "*", // Fondamentale per far parlare YouTube col tuo server
    methods: ["GET", "POST"]
  },
});

console.log(`Server attivo sulla porta ${PORT}...`);

io.on("connection", (socket) => {
  // ... (tutto il resto del codice rimane uguale: join-room, video-action, ecc.)
  console.log("Nuovo utente connesso:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  socket.on("video-action", (data) => {
    socket.to(data.roomId).emit("sync-action", data);
  });
});