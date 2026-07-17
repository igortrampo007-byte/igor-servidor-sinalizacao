const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());

app.get('/', (req, res) => {
  res.send('Servidor WebRTC de Alta Performance está Online! 🟢');
});

io.on('connection', (socket) => {
  console.log('Novo dispositivo conectado. ID:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
  });

  // Eventos de Status Visual
  socket.on('funcionario_online', (data) => { socket.to(data.room).emit('funcionario_online', data); });
  socket.on('funcionario_ausente', (data) => { socket.to(data.room).emit('funcionario_ausente', data); });
  socket.on('funcionario_offline', (data) => { socket.to(data.room).emit('funcionario_offline', data); });

  // 🟢 NOVO: Evento para Mudar a Resolução Dinamicamente
  socket.on('set_resolution', (data) => {
    socket.to(data.room).emit('set_resolution', data.resolution, data.idFuncionario);
  });

  // Eventos de Vídeo
  socket.on('offer', (data) => { socket.to(data.room).emit('offer', data.offer, data.idFuncionario); });
  socket.on('answer', (data) => { socket.to(data.room).emit('answer', data.answer, data.idFuncionario); });
  socket.on('ice-candidate', (data) => { socket.to(data.room).emit('ice-candidate', data.candidate, data.idFuncionario); });

  socket.on('disconnect', () => {
    console.log('Dispositivo desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
