import { User } from '../models/User';
import { Invite } from '../models/Invite';
import { sendEmailWrapper } from '../utils/emailUtils';
import mongoose from 'mongoose';

export const createInvite = async (email: string, companyId: string | mongoose.Types.ObjectId, role: string) => {
  const existingInvite = await Invite.findOne({ email, status: 'pending' });
  if (existingInvite) {
    throw new Error('Já existe um convite pendente para este email');
  }

  const token = Math.random().toString(36).substr(2, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias a partir de agora

  const newInvite = new Invite({
    email,
    role,
    companyId,
    token,
    expiresAt,
    status: 'pending'
  });

  await newInvite.save();

  const subject = 'Convite para juntar-se à nossa plataforma';
  const htmlBody = `
    <h1>Você foi convidado!</h1>
    <p>Clique no link abaixo para aceitar o convite:</p>
    <a href="${process.env.FRONTEND_URL}/accept-invite/${token}">Aceitar Convite</a>
  `;
  await sendEmailWrapper(email, subject, htmlBody);

  return newInvite;
};

export const acceptInvite = async (token: string, userData: { username: string; password: string; fullName: string }) => {
  const invite = await Invite.findOne({ token, status: 'pending' });
  if (!invite || invite.expiresAt < new Date()) {
    throw new Error('Convite inválido ou expirado');
  }

  const newUser = new User({
    username: userData.username,
    email: invite.email,
    password: userData.password,
    fullName: userData.fullName,
    role: invite.role,
    company: invite.companyId,
    inviteStatus: 'accepted'
  });

  await newUser.save();

  invite.status = 'accepted';
  await invite.save();

  return { message: 'Convite aceito e usuário criado com sucesso' };
};

export const verifyInvite = async (token: string) => {
  const invite = await Invite.findOne({ token, status: 'pending' });
  if (!invite || invite.expiresAt < new Date()) {
    throw new Error('Convite inválido ou expirado');
  }
  return {
    message: 'Convite válido',
    invite: {
      email: invite.email,
      role: invite.role,
      companyId: invite.companyId
    }
  };
};

export const resendInvite = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  if (user.inviteStatus !== 'pending') {
    throw new Error('O convite para este usuário não está pendente');
  }
  
  const invite = await Invite.findOne({ email: user.email, status: 'pending' });
  if (!invite) {
    throw new Error('Convite não encontrado');
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

  return invite;
};
