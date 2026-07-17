const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
app.use(cors());

app.get('/', (req, res) => { res.send('Servidor de Sinalização Avançado Online! 🟢'); });

const connectedUsers = {}; // Guarda quem está conectado

io.on('connection', (socket) => {
  socket.on('join-room', (room) => { socket.join(room); });

  socket.on('funcionario_online', (data) => {
    connectedUsers[socket.id] = data;
    socket.to(data.room).emit('funcionario_online', data);
  });

  socket.on('funcionario_ausente', (data) => { socket.to(data.room).emit('funcionario_ausente', data); });
  
  socket.on('funcionario_offline', (data) => {
    socket.to(data.room).emit('funcionario_offline', data);
    delete connectedUsers[socket.id];
  });

  // 🟢 Gatilho de Zoom (Alta Resolução)
  socket.on('set_resolution', (data) => {
    socket.to(data.room).emit('set_resolution', data.resolution, data.idFuncionario);
  });

  socket.on('offer', (data) => { socket.to(data.room).emit('offer', data.offer, data.idFuncionario); });
  socket.on('answer', (data) => { socket.to(data.room).emit('answer', data.answer, data.idFuncionario); });
  socket.on('ice-candidate', (data) => { socket.to(data.room).emit('ice-candidate', data.candidate, data.idFuncionario); });

  // 🔴 Detecta Queda de Internet do Funcionário
  socket.on('disconnect', () => {
    const user = connectedUsers[socket.id];
    if (user) {
      socket.to(user.room).emit('funcionario_desconectado', user);
      delete connectedUsers[socket.id];
    }
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log(`Rodando na porta ${PORT}`); });
