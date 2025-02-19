import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { hashPassword, comparePassword } from '../utils/passwordUtils';

export const registerUser = async (username: string, email: string, password: string): Promise<IUser> => {
  console.log('Registering user:', { username, email });
  const hashedPassword = await hashPassword(password);
  const user = new User({ username, email, password: hashedPassword });
  const savedUser = await user.save();
  console.log('User registered successfully:', savedUser._id);
  return savedUser;
};

export const loginUser = async (email: string, password: string): Promise<{ token: string, user: Partial<IUser> } | null> => {
  console.log('Attempting login for email:', email);
  const user = await User.findOne({ email });
  if (!user) {
    console.log('User not found for email:', email);
    return null;
  }
  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    console.log('Password does not match for email:', email);
    return null;
  }
  const token = jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      role: user.role,
      company: user.company // Usando 'company' em vez de 'companyId'
    },
    process.env.JWTSECRET as string,
    { expiresIn: '1d' }
  );
  console.log('Login successful, token generated for user:', user._id);
  return { 
    token, 
    user: {
      _id: user._id,
      email: user.email,
      role: user.role,
      company: user.company // Usando 'company' em vez de 'companyId'
    }
  };
};

export const verifyToken = (token: string): { userId: string; email: string; role: string; company?: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWTSECRET as string) as { userId: string; email: string; role: string; company?: string };
    console.log('Token verified successfully, decoded:', decoded);
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};
