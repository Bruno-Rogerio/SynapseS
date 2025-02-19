import { Request, Response, NextFunction } from 'express';
import { DecodedToken } from './middleware/authMiddleware';

export interface AuthenticatedRequest extends Request {
  user?: DecodedToken;
}

export type AsyncRequestHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<any>;
