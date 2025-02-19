import { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/authService';
import { User } from '../models/User';
import { registerCompanyAndAdmin } from '../services/companyService';

export const registerCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyName, plan, adminUsername, adminEmail, adminPassword, adminFullName } = req.body;
    const { company, admin } = await registerCompanyAndAdmin(
      companyName, plan, adminUsername, adminEmail, adminPassword, adminFullName
    );
    res.status(201).json({
      message: 'Company and admin registered successfully',
      companyId: company._id,
      adminId: admin._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      message: 'Error registering company and admin',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Registration attempt:', req.body);
    const { username, email, password } = req.body;
    const user = await registerUser(username, email, password);
    console.log('User registered successfully:', user._id);
    res.status(201).json({ message: 'User registered successfully', userId: user._id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      message: 'Error registering user',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Login attempt:', req.body);
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    if (!result) {
      console.log('Login failed: Invalid credentials');
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }
    const { token, user } = result;
    console.log('Login successful for email:', email);
    res.json({ token, user });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Error logging in',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  console.log('Verify token route hit');
  console.log('User from request:', req.user);
  
  try {
    if (!req.user || !req.user.userId) {
      console.log('No user ID found in request');
      res.status(401).json({ message: 'Invalid token' });
      return;
    }

    console.log('Searching for user with ID:', req.user.userId);
    const user = await User.findById(req.user.userId).select('-password');
    console.log('User found in database:', user);

    if (!user) {
      console.log('User not found in database');
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error('Error in verifyToken:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
