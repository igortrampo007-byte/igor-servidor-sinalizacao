const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);

const io = require('socket.io')(http, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
app.use(cors());

app.get('/', (req, res) => { res.send('Servidor de Monitoramento com Memória Online! 🟢'); });

// 🧠 A MEMÓRIA DO SERVIDOR: Onde guardamos o estado de quem está online
let estadoDoMosaico = {
    funcionarios: {} // Guardará { id_func: { dados_do_funcionario } }
};

io.on('connection', (socket) => {
  console.log('Novo dispositivo conectado:', socket.id);

  // 1. Ouvindo o pedido de entrada na sala
  socket.on('join-room', (data) => {
    const room = data.room || data; // Suporta formato antigo e novo
    const role = data.role || 'desconhecido'; // 'agente' (Python) ou 'monitor' (HTML)
    
    socket.join(room);
    console.log(`Dispositivo ${socket.id} entrou na sala ${room} como ${role}`);

    // 🔄 SINCRONISMO INICIAL (O pulo do gato)
    // Se quem entrou foi o Painel HTML (monitor), enviamos o estado atual completo imediamente
    if (role === 'monitor') {
        socket.emit('sync_initial_state', estadoDoMosaico.funcionarios);
        console.log(`📤 Estado sincronizado para o painel ${socket.id}`);
    }
  });

  // Eventos de Status Visual (Python -> Servidor -> HTML)
  socket.on('funcionario_online', (data) => {
    // Salva na memória do servidor antes de repassar
    estadoDoMosaico.funcionarios[data.id] = { ...data, status: 'activo', motivo: "" };
    socket.to(data.room).emit('funcionario_online', data);
  });

  socket.on('funcionario_ausente', (data) => {
    // Atualiza a memória
    if (estadoDoMosaico.funcionarios[data.id]) {
        estadoDoMosaico.funcionarios[data.id].status = 'ausente';
        estadoDoMosaico.funcionarios[data.id].motivo = data.motivo;
    }
    socket.to(data.room).emit('funcionario_ausente', data);
  });

  socket.on('funcionario_offline', (data) => {
    // Remove da memória
    delete estadoDoMosaico.funcionarios[data.id];
    socket.to(data.room).emit('funcionario_offline', data);
  });

  // Evento de Resolução Dinâmica (HTML -> Servidor -> Python)
  socket.on('set_resolution', (data) => {
    socket.to(data.room).emit('set_resolution', data.resolution, data.idFuncionario);
  });

  // Eventos de Vídeo (WebRTC Signaling)
  socket.on('offer', (data) => { socket.to(data.room).emit('offer', data.offer, data.idFuncionario); });
  socket.on('answer', (data) => { socket.to(data.room).emit('answer', data.answer, data.idFuncionario); });
  socket.on('ice-candidate', (data) => { socket.to(data.room).emit('ice-candidate', data.candidate, data.idFuncionario); });

  // 🛑 Se a conexão cair abruptamente (queda de energia/internet do funcionário)
  socket.on('disconnect', () => {
    // Precisamos varrer a memória para ver se o socket que caiu era um funcionário
    for (const id in estadoDoMosaico.funcionarios) {
        // Nota: O Socket.io não guarda o ID do funcionário no disconnect padrão, 
        // mas o WebRTC cairá e o painel notará o FPS zerado. 
        // Em uma versão futura, podemos associar socket.id ao id do funcionário para remover automaticamente aqui.
    }
    console.log('Dispositivo desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log(`Rodando na porta ${PORT}`); });
