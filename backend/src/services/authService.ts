// src/services/authService.ts
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Role } from '../models/Role';
import { hashPassword, comparePassword } from '../utils/passwordUtils';
import { Types } from 'mongoose';

/**
 * Registra um novo usuário no sistema
 * @param username Nome de usuário
 * @param email Email do usuário
 * @param password Senha do usuário
 * @param companyId ID da empresa (opcional)
 */
export const registerUser = async (
  username: string,
  email: string,
  password: string,
  companyId?: string | Types.ObjectId
): Promise<IUser> => {
  console.log('Registering user:', { username, email, companyId: companyId || 'none' });

  // Verificar se o usuário já existe
  const existingUser = await User.findOne({ $or: [{ email }, { username }] });
  if (existingUser) {
    if (existingUser.email === email) {
      throw new Error('Email já está em uso');
    }
    throw new Error('Nome de usuário já está em uso');
  }

  // Obter papel padrão (user)
  const defaultRole = await Role.findOne({ name: 'user' });
  if (!defaultRole) {
    throw new Error('Papel padrão não encontrado. Execute o script de inicialização primeiro.');
  }

  const hashedPassword = await hashPassword(password);

  // Criar objeto de usuário com ou sem empresa
  const userData: Partial<IUser> = {
    username,
    email,
    password: hashedPassword,
    // CORREÇÃO 1: Garantir que defaultRole._id seja tratado como Types.ObjectId
    role: defaultRole._id as unknown as Types.ObjectId
  };

  // Adicionar companyId se fornecido
  if (companyId) {
    // CORREÇÃO 2: Converter string para ObjectId se necessário
    userData.company = typeof companyId === 'string'
      ? new Types.ObjectId(companyId)
      : companyId;

    console.log(`Associando usuário à empresa: ${companyId}`);
  }

  const user = new User(userData);
  const savedUser = await user.save();
  console.log('User registered successfully:', savedUser._id);
  return savedUser;
};

/**
 * Autentica um usuário com email e senha
 * Retorna o token JWT e informações do usuário com suas permissões
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<{ token: string, user: Record<string, any> } | null> => {
  console.log('Attempting login for email:', email);

  // Buscar usuário com seu papel populado e, se disponível, empresa
  const user = await User.findOne({ email })
    .populate('role')
    .populate('company');

  if (!user) {
    console.log('User not found for email:', email);
    return null;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    console.log('Password does not match for email:', email);
    return null;
  }

  // Verificar se o papel foi populado corretamente
  const roleObj = user.role as any; // Cast temporário para acessar propriedades
  if (!roleObj || typeof roleObj === 'string' || !roleObj.permissions) {
    console.error(`Role not properly populated for user ${user._id}. RoleObj:`, roleObj);
    // Tenta recuperar o papel manualmente se a população falhou
    const role = await Role.findById(user.role);
    if (!role) {
      console.error(`Could not find role for user ${user._id}`);
      throw new Error('Erro ao carregar permissões do usuário');
    }
    // Usar o papel recuperado
    roleObj.name = role.name;
    roleObj.permissions = role.permissions;
  }

  // Calcular permissões efetivas
  const rolePermissions = roleObj.permissions || [];
  const additionalPermissions = user.additionalPermissions || [];
  const restrictedPermissions = user.restrictedPermissions || [];
  const permissions = [
    ...rolePermissions,
    ...additionalPermissions
  ].filter(p => !restrictedPermissions.includes(p));

  console.log(`Permissions for user ${user._id}:`, permissions);

  // Processar informações da empresa para o token
  let companyId = null;
  if (user.company) {
    companyId = typeof user.company === 'object' && user.company !== null ?
      user.company._id : user.company;
    console.log(`Company ID for user ${user._id}:`, companyId);
  }

  // Gerar token JWT (com expiração mais curta)
  const token = jwt.sign(
    {
      userId: user._id,
      email: user.email,
      role: roleObj.name, // Mantendo compatibilidade
      company: companyId,
      permissions: permissions // Incluir permissões no token
    },
    process.env.JWTSECRET as string,
    { expiresIn: '1h' } // Reduzido para 1 hora
  );

  console.log('Login successful, token generated for user:', user._id);

  // Preparar informações da empresa para a resposta
  let companyInfo = null;
  if (user.company) {
    if (typeof user.company === 'object' && user.company !== null) {
      // Se a empresa foi populada, extrair informações principais
      const companyObj = 'toObject' in user.company ?
        (user.company as any).toObject() : user.company;

      companyInfo = {
        _id: companyObj._id,
        name: companyObj.name,
        plan: companyObj.plan
      };
    } else {
      // Se for apenas um ID
      companyInfo = user.company;
    }
  }

  // Retornar token e informações do usuário (incluindo permissões e empresa)
  return {
    token,
    user: {
      _id: user._id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: roleObj.name,
      company: companyInfo,
      permissions: permissions, // Novo campo com todas as permissões
      bookmarks: user.bookmarks
    }
  };
};

/**
 * Verifica a validade de um token JWT
 * @param token O token JWT a ser verificado
 * @returns Informações decodificadas do token ou null se inválido
 */
export const verifyToken = (token: string): {
  userId: string;
  email: string;
  role: string;
  company?: string | Types.ObjectId;
  permissions?: string[];
} | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWTSECRET as string) as {
      userId: string;
      email: string;
      role: string;
      company?: string | Types.ObjectId;
      permissions?: string[];
    };
    console.log('Token verified successfully, decoded:', decoded);
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

/**
 * Cria um token com validade reduzida para operações sensíveis
 * (opcional, para uso em operações como redefinição de senha)
 */
export const createShortLivedToken = async (userId: string, purpose: string): Promise<string> => {
  return jwt.sign(
    { userId, purpose },
    process.env.JWTSECRET as string,
    { expiresIn: '15m' }
  );
};

/**
 * Verifica um token de curta duração para operações sensíveis
 * (opcional, complemento para o método acima)
 */
export const verifyShortLivedToken = (token: string, purpose: string): { userId: string } | null => {
  try {
    const decoded = jwt.verify(token, process.env.JWTSECRET as string) as {
      userId: string;
      purpose: string;
    };
    if (decoded.purpose !== purpose) {
      console.error('Token purpose mismatch');
      return null;
    }
    return { userId: decoded.userId };
  } catch (error) {
    console.error('Error verifying short-lived token:', error);
    return null;
  }
};
