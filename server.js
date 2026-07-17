const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);

// Configuração do Socket.io permitindo acesso de qualquer origem
const io = require('socket.io')(http, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

app.use(cors());

// Rota de teste para sabermos se o servidor está online
app.get('/', (req, res) => {
  res.send('Servidor de Sinalização WebRTC está Online! 🟢');
});

// Lógica de Sinalização (A "Telefonista")
io.on('connection', (socket) => {
  console.log('Novo dispositivo conectado. ID:', socket.id);

  // Entrar na sala de monitoramento
  socket.on('join-room', (room) => {
    socket.join(room);
  });

  // Repassar a Oferta de Vídeo
  socket.on('offer', (data) => {
    socket.to(data.room).emit('offer', data.offer, data.idFuncionario);
  });

  // Repassar a Resposta de Vídeo
  socket.on('answer', (data) => {
    socket.to(data.room).emit('answer', data.answer, data.idFuncionario);
  });

  // Repassar as Rotas de Conexão (ICE Candidates) para furar firewalls
  socket.on('ice-candidate', (data) => {
    socket.to(data.room).emit('ice-candidate', data.candidate, data.idFuncionario);
  });

  socket.on('disconnect', () => {
    console.log('Dispositivo desconectado:', socket.id);
  });
});

// Ligar o servidor na porta correta
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
