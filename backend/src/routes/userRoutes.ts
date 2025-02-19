import express from 'express';
import { createUser, getUsers, updateUserRole, deleteUser } from '../controllers/userController';
import { authMiddleware, authorizeAdmin } from '../middleware/authMiddleware';
import { User } from '../models/User';
import { Invite } from '../models/Invite';

const router = express.Router();

// Rota para criar um novo usuário
router.post('/', authMiddleware, authorizeAdmin, createUser);

// Rota para obter todos os usuários e convites pendentes
router.get('/', authMiddleware, authorizeAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    const pendingInvites = await Invite.find({ status: 'pending' });

    const combinedUsers = [
      ...users.map(user => ({
        ...user.toObject(),
        inviteStatus: 'active'
      })),
      ...pendingInvites.map(invite => ({
        id: invite._id,
        email: invite.email,
        role: invite.role,
        inviteStatus: 'pending',
        username: 'Pendente',
        fullName: 'Usuário Convidado',
        company: invite.companyId
      }))
    ];

    res.json(combinedUsers);
  } catch (error) {
    console.error('Erro ao buscar usuários e convites:', error);
    res.status(500).json({ message: 'Erro ao buscar usuários e convites' });
  }
});

// Rota para atualizar o papel de um usuário
router.put('/:userId', authMiddleware, authorizeAdmin, updateUserRole);

// Rota para excluir um usuário
router.delete('/:userId', authMiddleware, authorizeAdmin, deleteUser);

export default router;
