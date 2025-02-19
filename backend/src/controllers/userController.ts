import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User';

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
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
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

    const user = await User.findByIdAndDelete(userId);

    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    res.json({ message: 'Usuário excluído com sucesso' });
  } catch (error) {
    res.status(500).json({
      message: 'Error deleting user',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
