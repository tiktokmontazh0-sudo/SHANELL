const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const users = {};
const messages = {};

app.post('/api/register', (req, res) => {
  const { name, username } = req.body;
  if (!name || !username) return res.status(400).json({ error: 'Заполни все поля' });

  const cleanUsername = username.startsWith('@') ? username : '@' + username;
  const existing = Object.values(users).find(u => u.username === cleanUsername);

  if (existing) {
    return res.json({ success: true, user: existing });
  }

  const id = uuidv4();
  users[id] = { id, name, username: cleanUsername };
  res.json({ success: true, user: users[id] });
});

app.get('/api/users', (req, res) => {
  res.json(Object.values(users));
});

app.post('/api/messages', (req, res) => {
  const { from, to } = req.body;
  const chatId = [from, to].sort().join('-');
  res.json(messages[chatId] || []);
});

app.post('/api/send', (req, res) => {
  const { from, to, text } = req.body;
  if (!from || !to || !text) return res.status(400).json({ error: 'Нет данных' });

  const chatId = [from, to].sort().join('-');
  if (!messages[chatId]) messages[chatId] = [];

  const msg = {
    id: uuidv4(),
    sender: from,
    receiver: to,
    text,
    time: new Date().toISOString()
  };

  messages[chatId].push(msg);
  res.json({ success: true, message: msg });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
  socket.on('join', (userId) => {
    socket.userId = userId;
  });

  socket.on('disconnect', () => {});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('🚀 SHANEL на порту ' + PORT));