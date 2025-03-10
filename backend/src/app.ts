import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import inviteRoutes from './routes/inviteRoutes';
import taskRoutes from './routes/taskRoutes';
import missionRoutes from './routes/missionRoutes';
import { logEmailStatus } from './utils/emailUtils';
import chatRoutes from './routes/chatRoutes';
import forumRoutes from './routes/forumRoutes';

// Carrega as variáveis de ambiente
dotenv.config();

// Conecta ao banco de dados
connectDB();

// Inicializa o app Express
const app = express();
const port = process.env.PORT || 5000;

// Configuração do CORS
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));

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

app.use('/api/forums', forumRoutes);

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

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
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`CORS is configured for origin: ${FRONTEND_URL}`);
  console.log('Routes:');
  console.log(' /api/auth/*');
  console.log(' /api/users/*');
  console.log(' /api/invites/*');
  console.log(' /api/tasks/*');
  console.log(' /api/missions/*');
  console.log(' /test');

  // Log do status do email
  logEmailStatus();
});

export default app;
