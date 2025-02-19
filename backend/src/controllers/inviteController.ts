import { Response } from 'express';
import mongoose from 'mongoose';
import { Invite } from '../models/Invite';
import { User } from '../models/User';
import { sendEmailWrapper } from '../utils/emailUtils';
import { AsyncRequestHandler, AuthenticatedRequest } from '../types';

export const verifyInvite: AsyncRequestHandler = async (req, res) => {
  try {
    const { token } = req.params;
    const invite = await Invite.findOne({ token, status: 'pending' });
    if (!invite || invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Convite inválido ou expirado' });
    }
    res.json({
      message: 'Convite válido',
      invite: {
        email: invite.email,
        role: invite.role,
        companyId: invite.companyId
      }
    });
  } catch (error) {
    console.error('Erro ao verificar convite:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const resendInvite: AsyncRequestHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    if (user.inviteStatus !== 'pending') {
      return res.status(400).json({ message: 'O convite para este usuário não está pendente' });
    }
    
    const invite = await Invite.findOne({ email: user.email, status: 'pending' });
    if (!invite) {
      return res.status(404).json({ message: 'Convite não encontrado' });
    }

    // Atualiza a data de expiração do convite
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias a partir de agora
    await invite.save();

    // Reenviar o email de convite
    const subject = 'Convite para juntar-se à nossa plataforma';
    const htmlBody = `
      <h1>Você foi convidado!</h1>
      <p>Clique no link abaixo para aceitar o convite:</p>
      <a href="${process.env.FRONTEND_URL}/accept-invite/${invite.token}">Aceitar Convite</a>
    `;
    await sendEmailWrapper(user.email, subject, htmlBody);

    res.json({ message: 'Convite reenviado com sucesso' });
  } catch (error) {
    console.error('Erro ao reenviar convite:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const createInvite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, role } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Usuário não autenticado' });
    }

    const companyId = req.user.company;
    if (!companyId) {
      return res.status(401).json({ message: 'Empresa não associada ao usuário' });
    }

    // Verificar se já existe um convite pendente para este email
    const existingInvite = await Invite.findOne({ email, status: 'pending' });
    if (existingInvite) {
      return res.status(400).json({ message: 'Já existe um convite pendente para este email' });
    }

    // Criar novo convite
    const token = Math.random().toString(36).substr(2, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newInvite = new Invite({
      email,
      role,
      companyId,
      token,
      expiresAt,
      status: 'pending'
    });

    await newInvite.save();

    // Enviar email de convite
    const subject = 'Convite para juntar-se à nossa plataforma';
    const htmlBody = `
      <h1>Você foi convidado!</h1>
      <p>Clique no link abaixo para aceitar o convite:</p>
      <a href="${process.env.FRONTEND_URL}/accept-invite/${token}">Aceitar Convite</a>
    `;
    await sendEmailWrapper(email, subject, htmlBody);

    res.status(201).json({ message: 'Convite criado e enviado com sucesso', invite: newInvite });
  } catch (error) {
    console.error('Erro ao criar convite:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};

export const acceptInvite: AsyncRequestHandler = async (req, res) => {
  try {
    const { token } = req.params;
    const { username, password, fullName } = req.body;

    const invite = await Invite.findOne({ token, status: 'pending' });
    if (!invite || invite.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Convite inválido ou expirado' });
    }

    // Criar novo usuário
    const newUser = new User({
      username,
      email: invite.email,
      password,
      fullName,
      role: invite.role,
      company: invite.companyId,
      inviteStatus: 'accepted'
    });

    await newUser.save();

    // Atualizar status do convite
    invite.status = 'accepted';
    await invite.save();

    res.status(200).json({ message: 'Convite aceito e usuário criado com sucesso' });
  } catch (error) {
    console.error('Erro ao aceitar convite:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
};
