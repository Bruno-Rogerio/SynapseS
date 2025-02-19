// src/routes/inviteRoutes.ts
import express from 'express';
import { createInvite, acceptInvite, verifyInvite, resendInvite } from '../services/inviteService';
import { authenticateToken, authorizeAdmin } from '../middleware/authMiddleware';
import { AsyncRequestHandler } from '../types';
import { Types } from 'mongoose';

const router = express.Router();

const createInviteHandler: AsyncRequestHandler = async (req, res) => {
  console.log('Recebida solicitação para criar convite:', req.body);
  try {
    const { email, role } = req.body;
    if (!req.user || !req.user.company) {
      console.log('Informações do usuário ou empresa ausentes');
      res.status(400).json({ message: 'User or company information is missing' });
      return;
    }
    const companyId = typeof req.user.company === 'string' ? req.user.company : new Types.ObjectId(req.user.company);
    const invite = await createInvite(email, companyId, role);
    console.log('Convite criado com sucesso:', invite);
    res.status(201).json(invite);
  } catch (error: unknown) {
    console.error('Erro ao criar convite:', error);
    res.status(400).json({ message: 'Error creating invite', error: error instanceof Error ? error.message : String(error) });
  }
};

const acceptInviteHandler: AsyncRequestHandler = async (req, res) => {
  console.log('Recebida solicitação para aceitar convite:', { token: req.params.token, body: req.body });
  try {
    const { token } = req.params;
    const { username, password, fullName } = req.body;
    if (!token) {
      console.log('Token não fornecido');
      return res.status(400).json({ message: 'Token não fornecido' });
    }
    if (!username || !password || !fullName) {
      console.log('Dados incompletos para aceitar convite:', { username, password, fullName });
      return res.status(400).json({ message: 'Dados incompletos. Todos os campos são obrigatórios.' });
    }
    const result = await acceptInvite(token, { username, password, fullName });
    console.log('Convite aceito com sucesso:', result);
    res.status(200).json({ message: 'Invite accepted successfully' });
  } catch (error: unknown) {
    console.error('Erro ao aceitar convite:', error);
    res.status(400).json({ message: 'Error accepting invite', error: error instanceof Error ? error.message : String(error) });
  }
};

const verifyInviteHandler: AsyncRequestHandler = async (req, res) => {
  console.log('Recebida solicitação para verificar convite:', req.params.token);
  try {
    const { token } = req.params;
    const result = await verifyInvite(token);
    if (result) {
      console.log('Convite válido:', result);
      res.json({
        message: 'Convite válido',
        invite: {
          email: result.invite.email,
          role: result.invite.role,
          companyId: result.invite.companyId
        }
      });
    } else {
      console.log('Convite inválido ou expirado');
      res.status(400).json({ message: 'Convite inválido ou expirado' });
    }
  } catch (error: unknown) {
    console.error('Erro ao verificar convite:', error);
    res.status(500).json({ message: 'Erro ao verificar convite', error: error instanceof Error ? error.message : String(error) });
  }
};

const resendInviteHandler: AsyncRequestHandler = async (req, res) => {
  console.log('Recebida solicitação para reenviar convite:', req.params.userId);
  try {
    const { userId } = req.params;
    const invite = await resendInvite(userId);
    console.log('Convite reenviado com sucesso:', invite);
    res.json({ message: 'Invite resent successfully', invite });
  } catch (error: unknown) {
    console.error('Erro ao reenviar convite:', error);
    res.status(400).json({ message: 'Error resending invite', error: error instanceof Error ? error.message : String(error) });
  }
};

router.post('/create', authenticateToken, authorizeAdmin, createInviteHandler);
router.post('/accept/:token', acceptInviteHandler);
router.get('/verify/:token', verifyInviteHandler);
router.post('/resend/:userId', authenticateToken, authorizeAdmin, resendInviteHandler);

export default router;
