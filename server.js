const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);

// Configuração do Socket.io
const io = require('socket.io')(http, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Rota básica para testar se está online
app.get('/', (req, res) => {
  res.send('Servidor de Sinalização IGOR PROYECTOS está rodando perfeitamente! 🟢');
});

// Lógica de Conexão (A Telefonista)
io.on('connection', (socket) => {
  console.log('Novo dispositivo conectado. ID:', socket.id);

  socket.on('join-room', (room) => {
    socket.join(room);
  });

  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', data.offer, data.idFuncionario);
  });

  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', data.answer, data.idFuncionario);
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.room).emit('ice-candidate', data.candidate, data.idFuncionario);
  });

  socket.on('disconnect', () => {
    console.log('Dispositivo desconectado:', socket.id);
  });
});

// Iniciando o servidor
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
