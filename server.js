const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, { cors: { origin: "*", methods: ["GET", "POST"] } });
app.use(cors());

app.get('/', (req, res) => { res.send('Servidor de Monitoramento 🟢'); });

let estadoDoMosaico = { funcionarios: {} };
let socketMap = {}; // 🟢 CORREÇÃO 2: Lembra qual internet/conexão pertence a qual funcionário

io.on('connection', (socket) => {
  socket.on('join-room', (data) => {
    const room = data.room || data;
    const role = data.role || 'desconhecido';
    socket.join(room);
    if (role === 'monitor') socket.emit('sync_initial_state', estadoDoMosaico.funcionarios);
  });

  socket.on('funcionario_online', (data) => {
    socketMap[socket.id] = data.id; // Salva o vínculo
    estadoDoMosaico.funcionarios[data.id] = { ...data, status: 'activo', motivo: "" };
    socket.to(data.room).emit('funcionario_online', data);
  });

  socket.on('funcionario_ausente', (data) => {
    if (estadoDoMosaico.funcionarios[data.id]) {
        estadoDoMosaico.funcionarios[data.id].status = 'ausente';
        estadoDoMosaico.funcionarios[data.id].motivo = data.motivo;
    }
    socket.to(data.room).emit('funcionario_ausente', data);
  });

  socket.on('funcionario_offline', (data) => {
    delete estadoDoMosaico.funcionarios[data.id];
    delete socketMap[socket.id];
    socket.to(data.room).emit('funcionario_offline', data);
  });

  socket.on('set_resolution', (data) => { socket.to(data.room).emit('set_resolution', data.resolution, data.idFuncionario); });
  socket.on('offer', (data) => { socket.to(data.room).emit('offer', data.offer, data.idFuncionario); });
  socket.on('answer', (data) => { socket.to(data.room).emit('answer', data.answer, data.idFuncionario); });
  socket.on('ice-candidate', (data) => { socket.to(data.room).emit('ice-candidate', data.candidate, data.idFuncionario); });

  socket.on('disconnect', () => {
    // 🟢 APAGA DA MEMÓRIA SE O FUNCIONÁRIO CAIR
    const userId = socketMap[socket.id];
    if (userId) {
        delete estadoDoMosaico.funcionarios[userId];
        delete socketMap[socket.id];
        socket.to('sala-monitoramento').emit('funcionario_offline', { id: userId });
    }
  });
});

http.listen(process.env.PORT || 3000);
