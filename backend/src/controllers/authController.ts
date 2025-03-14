// src/controllers/authController.ts
import { Request, Response } from 'express';
import { registerUser, loginUser, verifyToken as verifyJWT } from '../services/authService';
import { User } from '../models/User';
import { registerCompanyAndAdmin } from '../services/companyService';
import { Types } from 'mongoose';

/**
 * Interface para representar um objeto de empresa
 */
interface CompanyObject {
  _id: string | Types.ObjectId;
  name?: string; // Tornando opcional para compatibilidade com ObjectId
  [key: string]: any;
}

/**
 * Registra uma nova empresa e um usuário administrador
 */
export const registerCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { companyName, plan, adminUsername, adminEmail, adminPassword, adminFullName } = req.body;
    // Validação básica de campos obrigatórios
    if (!companyName || !adminUsername || !adminEmail || !adminPassword || !adminFullName) {
      res.status(400).json({
        message: 'Todos os campos são obrigatórios',
        requiredFields: ['companyName', 'adminUsername', 'adminEmail', 'adminPassword', 'adminFullName']
      });
      return;
    }

    const { company, admin } = await registerCompanyAndAdmin(
      companyName, plan, adminUsername, adminEmail, adminPassword, adminFullName
    );

    res.status(201).json({
      message: 'Empresa e administrador registrados com sucesso',
      companyId: company._id,
      adminId: admin._id
    });
  } catch (error) {
    console.error('Erro no registro de empresa:', error);
    // Tratamento de erros específicos
    if (error instanceof Error && error.message.includes('duplicate key')) {
      res.status(409).json({
        message: 'Já existe uma empresa ou usuário com essas informações',
        error: error.message
      });
      return;
    }
    res.status(400).json({
      message: 'Erro ao registrar empresa e administrador',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Registra um novo usuário
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Tentativa de registro:', req.body);
    const { username, email, password, companyId } = req.body;

    // Validação básica
    if (!username || !email || !password) {
      res.status(400).json({
        message: 'Todos os campos são obrigatórios',
        requiredFields: ['username', 'email', 'password']
      });
      return;
    }

    // CORREÇÃO 1: Verificar se a função registerUser aceita companyId, se não, ajustar chamada
    // Usando uma condição para verificar se devemos passar companyId
    let user;
    if (companyId) {
      // Se o serviço de autenticação foi atualizado para aceitar companyId
      try {
        // Tentativa com 4 parâmetros
        user = await registerUser(username, email, password, companyId);
      } catch (e) {
        // Fallback para a versão anterior se ocorrer erro
        console.log('Fallback para registerUser sem companyId:', e);
        user = await registerUser(username, email, password);

        // Atualizar a empresa separadamente se possível
        if (user && companyId) {
          user.company = companyId;
          await user.save();
        }
      }
    } else {
      // Chamada original com 3 parâmetros
      user = await registerUser(username, email, password);
    }

    console.log('Usuário registrado com sucesso:', user._id);
    res.status(201).json({
      message: 'Usuário registrado com sucesso',
      userId: user._id,
      companyId: user.company // Incluir a empresa na resposta
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    // Tratamento específico para erros comuns
    if (error instanceof Error) {
      if (error.message.includes('já está em uso')) {
        res.status(409).json({
          message: error.message
        });
        return;
      }
    }
    res.status(400).json({
      message: 'Erro ao registrar usuário',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Realiza o login do usuário
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Tentativa de login:', { email: req.body.email });
    const { email, password } = req.body;

    // Validação básica
    if (!email || !password) {
      res.status(400).json({
        message: 'Email e senha são obrigatórios',
        requiredFields: ['email', 'password']
      });
      return;
    }

    const result = await loginUser(email, password);
    if (!result) {
      console.log('Login falhou: Credenciais inválidas');
      res.status(401).json({ message: 'Credenciais inválidas' });
      return;
    }

    const { token, user } = result;

    // Log detalhado das informações de autenticação
    console.log('Login bem-sucedido para email:', email);
    console.log('Permissões do usuário:', user.permissions);
    console.log('Empresa do usuário:', user.company ?
      typeof user.company === 'object' ? user.company._id : user.company
      : 'Nenhuma empresa');

    res.json({
      token,
      user: {
        ...user,
        // Garantir que a empresa seja retornada no formato esperado pelo frontend
        company: user.company,
        permissions: user.permissions || []
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    // Tratamento de erro específico para problemas de permissões
    if (error instanceof Error && error.message.includes('carregar permissões')) {
      res.status(500).json({
        message: 'Erro ao carregar permissões do usuário',
        error: error.message
      });
      return;
    }
    res.status(500).json({
      message: 'Erro ao fazer login',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Verifica se o token é válido e retorna informações do usuário
 */
export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  console.log('Rota de verificação de token acessada');
  console.log('Usuário da requisição:', req.user);

  try {
    if (!req.user || !req.user.userId) {
      console.log('ID de usuário não encontrado na requisição');
      res.status(401).json({ message: 'Token inválido' });
      return;
    }

    console.log('Buscando usuário com ID:', req.user.userId);

    // Popular o papel e a empresa para incluir na resposta
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('role')
      .populate('company'); // Garantir que a empresa seja populada

    if (!user) {
      console.log('Usuário não encontrado no banco de dados');
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    // Extrair e calcular permissões para incluir na resposta
    const roleObj = user.role as any; // Cast temporário
    let permissions: string[] = [];

    if (roleObj && typeof roleObj !== 'string' && roleObj.permissions) {
      const rolePermissions = roleObj.permissions || [];
      const additionalPermissions = user.additionalPermissions || [];
      const restrictedPermissions = user.restrictedPermissions || [];

      permissions = [
        ...rolePermissions,
        ...additionalPermissions
      ].filter(p => !restrictedPermissions.includes(p));
    }

    console.log('Usuário encontrado com permissões:', permissions);
    console.log('Empresa do usuário:', user.company);

    // Converter documento Mongoose para objeto plano e adicionar permissões
    const userObj = user.toObject();

    // CORREÇÃO 2: Processar a empresa para garantir formato consistente na resposta
    let companyData: string | CompanyObject | null = null;

    if (user.company) {
      // Se company for um objeto Mongoose, converter para objeto plano
      if (typeof user.company === 'object' && user.company !== null) {
        if ('toObject' in user.company) {
          companyData = (user.company as any).toObject();
        } else if ('_id' in user.company) {
          // Tratar caso em que é um ObjectId mas não tem método toObject
          companyData = { _id: user.company._id };
        } else {
          // Último recurso, usar como está
          companyData = user.company as unknown as CompanyObject;
        }
      } else {
        // Se for um ID (string), manter assim
        companyData = user.company;
      }
    }

    // Adicionamos as propriedades necessárias ao objeto resultante
    const userResponse = {
      ...userObj,
      permissions: permissions,
      company: companyData
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Erro em verifyToken:', error);
    res.status(500).json({
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Retorna as permissões do usuário atual
 */
export const getUserPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ message: 'Não autenticado' });
      return;
    }

    const user = await User.findById(req.user.userId)
      .populate('role')
      .populate('company'); // Garantir que a empresa seja populada

    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    // Calcular permissões
    const roleObj = user.role as any;
    const rolePermissions = roleObj?.permissions || [];
    const additionalPermissions = user.additionalPermissions || [];
    const restrictedPermissions = user.restrictedPermissions || [];

    const permissions = [
      ...rolePermissions,
      ...additionalPermissions
    ].filter(p => !restrictedPermissions.includes(p));

    // Processar informações da empresa
    let companyInfo = null;
    if (user.company) {
      if (typeof user.company === 'object' && user.company !== null) {
        // Se company for um objeto Mongoose, extrair informações relevantes
        const companyObj = 'toObject' in user.company ?
          (user.company as any).toObject() : user.company;

        companyInfo = {
          _id: companyObj._id,
          // Usar operador de acesso opcional para evitar erros
          name: companyObj?.name,
          plan: companyObj?.plan
        };
      } else {
        // Se for apenas um ID
        companyInfo = { _id: user.company };
      }
    }

    res.json({
      permissions,
      role: roleObj?.name,
      company: companyInfo
    });
  } catch (error) {
    console.error('Erro ao buscar permissões:', error);
    res.status(500).json({
      message: 'Erro ao buscar permissões do usuário',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Atualiza a empresa do usuário (para administradores)
 */
export const updateUserCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    // CORREÇÃO 3: Corrigir o teste de condição para verificar role
    if (!req.user || req.user.role !== 'admin') {
      res.status(403).json({ message: 'Acesso negado. Somente administradores podem atualizar empresas.' });
      return;
    }

    const { userId, companyId } = req.body;

    if (!userId || !companyId) {
      res.status(400).json({
        message: 'ID do usuário e ID da empresa são obrigatórios',
        requiredFields: ['userId', 'companyId']
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Usuário não encontrado' });
      return;
    }

    // Atualizar a empresa do usuário
    user.company = companyId;
    await user.save();

    res.json({
      message: 'Empresa do usuário atualizada com sucesso',
      userId: user._id,
      companyId: user.company
    });

  } catch (error) {
    console.error('Erro ao atualizar empresa do usuário:', error);
    res.status(500).json({
      message: 'Erro ao atualizar empresa do usuário',
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
