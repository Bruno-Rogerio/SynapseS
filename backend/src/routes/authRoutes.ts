// routes/authRoutes.ts
import express from 'express';
import {
    registerCompany,
    register,
    login,
    verifyToken,
    getUserPermissions,
    updateUserCompany
} from '../controllers/authController';
import {
    authenticateToken,
    authorizeAdmin,
    hasPermission,
    sameCompanyOnly,
    authorizePermissionAndCompany
} from '../middleware/authMiddleware';
import { PERMISSIONS } from '../constants/permissions';

const router = express.Router();

// Rotas públicas de autenticação
router.post('/register-company', registerCompany);
router.post('/register', register); // Nova rota para registro de usuário comum
router.post('/login', login);

// Rotas protegidas por autenticação
router.get('/verify', authenticateToken, verifyToken);
router.get('/permissions', authenticateToken, getUserPermissions);

// Rotas administrativas
router.post('/update-user-company',
    authenticateToken,
    authorizeAdmin,
    updateUserCompany
);

// Rota para informações da empresa do usuário atual
router.get('/my-company',
    authenticateToken,
    async (req, res) => {
        try {
            // Importar os modelos aqui para evitar problemas de dependência circular
            const { User } = require('../models/User');
            const { Company } = require('../models/Company');

            if (!req.user?.userId) {
                res.status(401).json({ message: 'Não autenticado' });
                return;
            }

            const user = await User.findById(req.user.userId);
            if (!user) {
                res.status(404).json({ message: 'Usuário não encontrado' });
                return;
            }

            if (!user.company) {
                res.status(404).json({
                    message: 'Usuário não está associado a nenhuma empresa',
                    user: {
                        _id: user._id,
                        username: user.username,
                        email: user.email
                    }
                });
                return;
            }

            const company = await Company.findById(user.company);
            if (!company) {
                res.status(404).json({
                    message: 'Empresa não encontrada',
                    companyId: user.company
                });
                return;
            }

            res.json({
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email
                },
                company: {
                    _id: company._id,
                    name: company.name,
                    plan: company.plan,
                    createdAt: company.createdAt
                }
            });
        } catch (error) {
            console.error('Erro ao buscar informações da empresa:', error);
            res.status(500).json({
                message: 'Erro ao buscar informações da empresa',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
);

// Exemplo de rota específica para empresa com verificação de permissão combinada
router.get('/company/:companyId/users',
    authenticateToken,
    authorizePermissionAndCompany(
        PERMISSIONS.USERS_VIEW,
        (req) => req.params.companyId
    ),
    async (req, res) => {
        try {
            // Importar o modelo User aqui para evitar problemas de dependência circular
            const { User } = require('../models/User');

            const users = await User.find({
                company: req.params.companyId
            }).select('-password');

            res.json({ users });
        } catch (error) {
            console.error('Erro ao buscar usuários da empresa:', error);
            res.status(500).json({
                message: 'Erro ao buscar usuários da empresa',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    }
);

// Rotas de teste para verificar permissões
router.get('/test-admin',
    authenticateToken,
    hasPermission(PERMISSIONS.USERS_CREATE),
    (req, res) => {
        res.json({
            message: 'Você tem permissão de administrador!',
            userInfo: req.user
        });
    }
);

router.get('/test-manager',
    authenticateToken,
    hasPermission(PERMISSIONS.TASKS_CREATE),
    (req, res) => {
        res.json({
            message: 'Você tem permissão para criar tarefas!',
            userInfo: req.user
        });
    }
);

router.get('/test-user',
    authenticateToken,
    hasPermission(PERMISSIONS.TASKS_VIEW),
    (req, res) => {
        res.json({
            message: 'Você tem permissão para visualizar tarefas!',
            userInfo: req.user
        });
    }
);

// Exemplo de rota que verifica apenas a empresa
router.get('/test-same-company/:companyId',
    authenticateToken,
    sameCompanyOnly((req) => req.params.companyId),
    (req, res) => {
        res.json({
            message: 'Você pertence a esta empresa!',
            companyId: req.params.companyId,
            userInfo: req.user
        });
    }
);

// Usando o controller getUserPermissions em vez de implementar a lógica aqui
router.get('/my-permissions', authenticateToken, getUserPermissions);

export default router;
