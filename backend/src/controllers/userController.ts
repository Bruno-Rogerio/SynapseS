// src/controllers/userController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';
import eventService from '../services/EventService';
import { EventTypes } from '../constants/EventTypes';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: 'Error fetching users',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, role } = req.body;

    // Verifica se o e-mail já está cadastrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'Este e-mail já está cadastrado' });
      return;
    }

    const user = new User({ username, email, password, role });
    await user.save();

    // Emite evento para registro de novo usuário
    try {
      eventService.emit(EventTypes.USER.REGISTERED, {
        userId: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        registrationDate: new Date()
      });

      // Opcional: Notificar administradores sobre novo registro
      const admins = await User.find({ role: 'admin' }).select('_id');
      if (admins.length > 0) {
        eventService.emit(EventTypes.SYSTEM.ANNOUNCEMENT, {
          title: 'Novo usuário registrado',
          body: `${username} (${email}) acabou de se registrar na plataforma.`,
          link: `/admin/users/${user._id}`,
          recipients: admins.map(admin => admin._id)
        });
      }
    } catch (notifyError) {
      console.error('Erro ao emitir evento de registro:', notifyError);
      // Continuar mesmo se houver erro na notificação
    }

    res.status(201).json({ message: 'User created successfully', userId: user._id });
  } catch (error) {
    res.status(400).json({
      message: 'Error creating user',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    console.log(`Tentando atualizar o usuário ${userId} para a função ${role}`);

    // Validação do ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'ID de usuário inválido' });
      return;
    }

    // Validação da role
    const validRoles = ['admin', 'manager', 'user'];
    if (!validRoles.includes(role)) {
      res.status(400).json({ message: 'Função inválida' });
      return;
    }

    // Buscar usuário antes da atualização para comparar
    const previousUser = await User.findById(userId);
    if (!previousUser) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    const previousRole = previousUser.role;

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    // Emitir evento para atualização de perfil/função
    try {
      if (previousRole !== role) {
        // Notificar o usuário sobre a mudança de função
        eventService.emit(EventTypes.USER.PROFILE_UPDATED, {
          userId: user._id,
          username: user.username,
          updatedFields: { role: { previous: previousRole, current: role } },
          updatedBy: req.body.adminId || 'system', // ID do administrador que fez a mudança
          updateDate: new Date()
        });

        // Notificar o usuário diretamente
        eventService.emit(EventTypes.SYSTEM.ANNOUNCEMENT, {
          title: 'Sua função foi atualizada',
          body: `Sua função na plataforma foi alterada de ${previousRole} para ${role}.`,
          link: '/profile',
          recipients: [userId]
        });
      }
    } catch (notifyError) {
      console.error('Erro ao emitir evento de atualização de perfil:', notifyError);
      // Continuar mesmo se houver erro na notificação
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao atualizar função do usuário:', error);
    res.status(500).json({
      message: 'Error updating user role',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({ message: 'ID de usuário inválido' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    // Armazenar informações do usuário antes de excluir
    const deletedUserInfo = {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    await User.findByIdAndDelete(userId);

    // Emitir evento para exclusão de usuário
    try {
      // Este pode ser um novo tipo de evento que você precisará adicionar ao EventTypes
      eventService.emit(EventTypes.USER.DELETED, {
        userId: deletedUserInfo.id,
        username: deletedUserInfo.username,
        email: deletedUserInfo.email,
        deletedBy: req.body.adminId || 'system',
        deletionDate: new Date()
      });

      // Notificar administradores sobre a exclusão
      const admins = await User.find({ role: 'admin' }).select('_id');
      if (admins.length > 0) {
        eventService.emit(EventTypes.SYSTEM.ANNOUNCEMENT, {
          title: 'Usuário excluído',
          body: `O usuário ${deletedUserInfo.username} (${deletedUserInfo.email}) foi excluído da plataforma.`,
          recipients: admins.map(admin => admin._id)
        });
      }
    } catch (notifyError) {
      console.error('Erro ao emitir evento de exclusão de usuário:', notifyError);
      // Continuar mesmo se houver erro na notificação
    }

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting user',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
