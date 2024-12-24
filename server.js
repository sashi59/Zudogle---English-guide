const { ExpressPeerServer } = require('peer');
const express = require('express');
const app = express();
const cors = require('cors');
const dotenv = require('dotenv');
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { v4: uuidV4 } = require('uuid');

dotenv.config();
app.use(cors());
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
});

// PeerJS Server Setup
const peerServer = ExpressPeerServer(server, {
  path: '/peerjs',
  debug: true
});
app.use('/peerjs', peerServer);

// Socket.IO Events
io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).broadcast.emit('user-connected', userId);

    socket.on('disconnect', () => {
      socket.to(roomId).broadcast.emit('user-disconnected', userId);
    });
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
