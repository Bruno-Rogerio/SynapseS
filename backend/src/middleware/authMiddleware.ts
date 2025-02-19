import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  company?: string | Types.ObjectId;
}

declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  console.log('Authenticating token');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted token:', token);

  if (!token) {
    console.log('No token provided');
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWTSECRET as string) as DecodedToken;
    console.log('Token verified successfully');
    console.log('Decoded token:', decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  console.log('Authenticating token');
  console.log('Headers:', req.headers);
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  console.log('Extracted token:', token);

  if (!token) {
    console.log('No token provided');
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  jwt.verify(token, process.env.JWTSECRET as string, (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      res.status(403).json({ message: 'Token is not valid' });
      return;
    }
    console.log('Token verified successfully');
    console.log('Decoded token:', decoded);
    req.user = decoded as DecodedToken;
    next();
  });
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
};
