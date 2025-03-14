import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

// Interface atualizada para incluir permissions
export interface DecodedToken {
  userId: string;
  email: string;
  role: string;
  company?: string | Types.ObjectId;
  permissions?: string[];
}

// Ampliando a interface Request para incluir o usuário decodificado
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

/**
 * Middleware principal de autenticação
 * Verifica e decodifica o token JWT
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  console.log('Authenticating token');

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    res.status(401).json({ message: 'No token, authorization denied' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWTSECRET as string) as DecodedToken;
    console.log('Token verified successfully');

    // Remover logs de informações sensíveis em produção
    if (process.env.NODE_ENV !== 'production') {
      console.log('Decoded token:', {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        company: decoded.company,
        hasPermissions: Array.isArray(decoded.permissions)
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    console.log('Token verification failed:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Alias para compatibilidade com código existente
export const authMiddleware = authenticateToken;

/**
 * Middleware para autorizar apenas administradores
 */
export const authorizeAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (req.user && (req.user.role === 'admin' || (req.user.permissions && req.user.permissions.includes('admin')))) {
    next();
  } else {
    res.status(403).json({ message: 'Acesso negado. Apenas administradores podem realizar esta ação.' });
  }
};

/**
 * Middleware para verificar permissão específica
 * @param permission - A permissão necessária
 */
export const hasPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Se o usuário for admin, permitir acesso independente da permissão específica
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // Verificar se o usuário tem a permissão específica
    if (req.user?.permissions && req.user.permissions.includes(permission)) {
      return next();
    }

    console.log(`Permission denied: ${permission} required`);
    res.status(403).json({
      message: `Acesso negado. Você não tem a permissão necessária: ${permission}`
    });
  };
};

/**
 * Middleware para garantir que o usuário só acesse recursos de sua própria empresa
 * @param getResourceCompanyId - Função para extrair o ID da empresa do recurso
 */
export const sameCompanyOnly = (
  getResourceCompanyId: (req: Request) => string | Types.ObjectId | undefined | null
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Se o usuário for admin, permitir acesso a todas as empresas
    if (req.user && req.user.role === 'admin') {
      return next();
    }

    // Se o usuário não tiver empresa associada, negar acesso
    if (!req.user?.company) {
      console.log('Company-specific access denied: user has no company');
      res.status(403).json({
        message: 'Acesso negado. Você não está associado a nenhuma empresa.'
      });
      return;
    }

    try {
      // Obter o ID da empresa do recurso que está sendo acessado
      const resourceCompanyId = getResourceCompanyId(req);

      // Se o recurso não tiver empresa associada, decisão depende da implementação
      if (!resourceCompanyId) {
        // Opção 1: Permitir acesso (recursos sem empresa são públicos)
        // return next();

        // Opção 2: Negar acesso (recursos sem empresa não são acessíveis)
        res.status(403).json({ message: 'Acesso negado. Recurso não está associado a nenhuma empresa.' });
        return;
      }

      // Converter IDs para string para comparação consistente
      const userCompanyId = req.user.company.toString();
      const targetCompanyId = resourceCompanyId.toString();

      if (userCompanyId === targetCompanyId) {
        return next();
      } else {
        console.log(`Company mismatch: user company ${userCompanyId}, resource company ${targetCompanyId}`);
        res.status(403).json({
          message: 'Acesso negado. Você não tem permissão para acessar recursos de outras empresas.'
        });
      }
    } catch (error) {
      console.error('Error in sameCompanyOnly middleware:', error);
      res.status(500).json({ message: 'Erro interno ao verificar permissões de empresa' });
    }
  };
};

/**
 * Middleware que combina verificação de permissão e de mesma empresa
 */
export const authorizePermissionAndCompany = (
  permission: string,
  getResourceCompanyId: (req: Request) => string | Types.ObjectId | undefined | null
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Primeiro verifica a permissão
    const permissionMiddleware = hasPermission(permission);

    // Usa uma promessa para transformar o middleware em assíncrono
    await new Promise<void>((resolve, reject) => {
      permissionMiddleware(req, res, (err?: any) => {
        if (err) reject(err);
        else resolve();
      });
    }).catch(() => {
      // Se falhar na verificação de permissão, a resposta já foi enviada pelo middleware
      return;
    });

    // Se o status já foi enviado (permissão negada), não continue
    if (res.headersSent) return;

    // Em seguida verifica a empresa
    const companyMiddleware = sameCompanyOnly(getResourceCompanyId);
    await companyMiddleware(req, res, next);
  };
};
