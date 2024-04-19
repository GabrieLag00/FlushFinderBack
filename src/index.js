import { createServer } from 'http';
import { Server as WebsocketServer } from 'socket.io';
import { connect } from 'mqtt';  // Usando ES Modules
import app from './app.js';
import { connectDB } from './connect.js';
import '../envConfig.js'; // Asegura que este import esté al principio
import { habilitarManejoEdificios } from './controllers/conserjesSockets.js';
import { habilitarManejoSosReports } from './controllers/sosSockets.js';
import dotenv from 'dotenv';

dotenv.config();

// Configuración MQTT - Asegúrate de que el URL esté en el formato correcto
const mqttClient = connect('mqtt://broker.emqx.io:1883');



// Configuración del servidor HTTP con Express
const server = createServer(app);

// Configuración del servidor WebSocket
const io = new WebsocketServer(server, {
  cors: {
    origin: '*',  // Ajusta esto según tus necesidades de seguridad
  },
});



mqttClient.on('connect', () => {
  console.log('Conectado al broker MQTT');
  mqttClient.subscribe(['Exit/10','Exit/20', 'Exit/30', 'Exit/40' ]);
});

io.on('connection', (socket) => {
  console.log('Cliente conectado a Socket.IO');
  mqttClient.on('message', (topic, message) => {
    console.log(`Mensaje recibido en el tópico ${topic}: ${message.toString()}`);
    socket.emit(topic, message.toString());
  });
});

mqttClient.on('message', (topic, message) => {
  console.log(`Mensaje recibido en el tópico ${topic}: ${message.toString()}`);
  io.emit(topic, message.toString());
});

// Iniciar servidor WebSocket en el puerto especificado en .env

//FUNCIONES SOCKETS
habilitarManejoEdificios(io);
habilitarManejoSosReports(io);



// Iniciar servidor HTTP en el puerto especificado en .env
const port = process.env.PORT; // Asegúrate de que esta variable esté definida en .env
server.listen(port, () => {
  console.log(`Servidor HTTP iniciado en el puerto ${port}`);
});

// Conectar a la base de datos
connectDB();