import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import inviteRoutes from './routes/inviteRoutes';
import taskRoutes from './routes/taskRoutes';
import missionRoutes from './routes/missionRoutes';
import chatRoutes from './routes/chatRoutes';
import notificationRoutes from './routes/notificationRoutes'; // Nova importação
import { setupForumSocket } from './routes/forumRoutes';
import { logEmailStatus } from './utils/emailUtils';
import eventService from './services/EventService'; // Nova importação
import notificationEventListener from './services/NotificationEventListener'; // Nova importação
import notificationService from './services/NotificationService'; // Nova importação

// Carrega as variáveis de ambiente
dotenv.config();

// Conecta ao banco de dados
connectDB();

// Inicializa o app Express
const app = express();
const httpServer = createServer(app);

// Configuração do CORS
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

// Configuração do Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const port = process.env.PORT || 5000;

// Middleware para parsing do corpo das requisições
app.use(express.json());

// Middleware de log para todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/invites', inviteRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/forums', setupForumSocket(io));
app.use('/api/notifications', notificationRoutes); // Nova rota de notificações

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Configuração do WebSocket para o fórum
const forumNamespace = io.of('/forum');
forumNamespace.on('connection', (socket) => {
  console.log('Um usuário se conectou ao namespace do fórum');
  const { forumId } = socket.handshake.query;
  if (forumId) {
    console.log(`Usuário entrou no fórum: ${forumId}`);
    socket.join(forumId as string);
    socket.on('new_message', (message) => {
      console.log(`Nova mensagem no fórum ${forumId}:`, message);
      forumNamespace.to(forumId as string).emit('new_message', message);
    });
    socket.on('typing', (data) => {
      socket.to(forumId as string).emit('typing', data.userId);
    });
    socket.on('disconnect', () => {
      console.log(`Usuário desconectou do fórum: ${forumId}`);
      socket.leave(forumId as string);
    });
  } else {
    console.log('Usuário tentou se conectar sem forumId');
    socket.disconnect(true);
  }
});

// Configuração do WebSocket para notificações
const notificationNamespace = io.of('/notifications');
notificationNamespace.on('connection', (socket) => {
  console.log('Um usuário se conectou ao namespace de notificações');
  const { userId } = socket.handshake.auth;

  if (userId) {
    console.log(`Usuário ${userId} conectado para receber notificações`);
    // Adiciona usuário a uma sala personalizada para receber suas notificações
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      console.log(`Usuário ${userId} desconectou do sistema de notificações`);
    });
  } else {
    console.log('Usuário tentou se conectar sem userId para notificações');
    socket.disconnect(true);
  }
});

// Injetar o Socket.IO no serviço de notificações para envios em tempo real
notificationService.setSocketServer(notificationNamespace); // Passa o namespace específico

// Inicializar sistema de eventos para notificações
notificationEventListener.initialize();

// Tratamento de rotas não encontradas
app.use((req, res) => {
  console.log(`Route not found: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Route not found' });
});

// Tratamento global de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Inicia o servidor
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`CORS is configured for origin: ${FRONTEND_URL}`);
  console.log('WebSocket server is ready to accept connections');
  console.log('Event system initialized');
  console.log('Routes:');
  console.log(' /api/auth/*');
  console.log(' /api/users/*');
  console.log(' /api/invites/*');
  console.log(' /api/tasks/*');
  console.log(' /api/missions/*');
  console.log(' /api/chat/*');
  console.log(' /api/forums/*');
  console.log(' /api/notifications/*'); // Nova rota
  console.log(' /test');

  // Log do status do email
  logEmailStatus();
});

export default app;
