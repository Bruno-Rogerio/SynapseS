// src/middleware/permissionMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { DecodedToken } from './authMiddleware'; // Reutilizando a interface
import ChatMessage from '../models/ChatMessage';
import Mission from '../models/Mission';
import { Types } from 'mongoose';

/**
 * Verifica se o usuário é o proprietário de um recurso específico
 * @param req Request do Express
 * @param resourceType Tipo do recurso ('chat', 'mission', etc)
 * @param resourceId ID do recurso
 * @returns Promise<boolean> se o usuário é proprietário
 */
async function isResourceOwner(
    req: Request,
    resourceType: string,
    resourceId: string
): Promise<boolean> {
    try {
        if (!req.user?.userId) return false;

        const userId = req.user.userId;

        switch (resourceType) {
            case 'chat':
                const message = await ChatMessage.findById(resourceId);
                return message?.userId === userId;

            case 'mission':
                const mission = await Mission.findById(resourceId);
                return mission?.leader === userId;

            // Adicione outros casos conforme necessário para diferentes tipos de recursos

            default:
                return false;
        }
    } catch (error) {
        console.error(`Erro ao verificar propriedade do recurso ${resourceType}/${resourceId}:`, error);
        return false;
    }
}

/**
 * Middleware para verificar se o usuário tem a permissão necessária
 * @param requiredPermission Permissão ou array de permissões necessárias
 * @param options Opções adicionais (allowOwner, resourceType)
 */
export const hasPermission = (
    requiredPermission: string | string[],
    options: {
        allowOwner?: boolean;
        resourceType?: string;
        resourceIdParam?: string;
    } = {}
) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Verificar autenticação
            if (!req.user?.userId) {
                res.status(401).json({ message: 'Não autenticado' });
                return;
            }

            // Verificar se é o proprietário do recurso (se configurado)
            if (options.allowOwner && options.resourceType) {
                const resourceIdParam = options.resourceIdParam || 'id';
                const resourceId = req.params[resourceIdParam];

                if (resourceId && await isResourceOwner(req, options.resourceType, resourceId)) {
                    // Se é proprietário e allowOwner está habilitado, permite o acesso
                    next();
                    return;
                }
            }

            // Buscar usuário com seu papel
            const user = await User.findById(req.user.userId).populate('role');
            if (!user) {
                res.status(404).json({ message: 'Usuário não encontrado' });
                return;
            }

            // Verificar se o campo role foi populado corretamente
            if (!user.role || typeof user.role === 'string') {
                console.error('Erro: o campo role não está populado corretamente');
                res.status(500).json({ message: 'Erro ao verificar permissões' });
                return;
            }

            // Calcular permissões efetivas do usuário
            const roleObj = user.role as any; // Para acessar .permissions
            const rolePermissions = roleObj.permissions || [];
            const additionalPermissions = user.additionalPermissions || [];
            const restrictedPermissions = user.restrictedPermissions || [];

            const effectivePermissions = [
                ...rolePermissions,
                ...additionalPermissions
            ].filter(p => !restrictedPermissions.includes(p));

            // Converter para array se for string única
            const permissionsToCheck = Array.isArray(requiredPermission)
                ? requiredPermission
                : [requiredPermission];

            // Verificar se o usuário tem todas as permissões necessárias
            const hasAllPermissions = permissionsToCheck.every(
                permission => effectivePermissions.includes(permission)
            );

            if (!hasAllPermissions) {
                // Registrar a tentativa de acesso não autorizado
                console.warn(`Acesso negado: usuário ${user._id} tentou acessar recurso que requer ${permissionsToCheck.join(', ')}`);
                res.status(403).json({
                    message: 'Você não tem permissão para realizar esta ação',
                    required: permissionsToCheck,
                    available: effectivePermissions
                });
                return;
            }

            // Se chegou aqui, o usuário tem permissão
            next();
        } catch (error) {
            console.error('Erro ao verificar permissões:', error);
            res.status(500).json({
                message: 'Erro ao verificar permissões',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    };
};

/**
 * Middleware para verificar propriedade de um recurso
 * @param resourceType Tipo do recurso ('chat', 'mission', etc.)
 * @param resourceIdParam Nome do parâmetro que contém o ID do recurso
 */
export const isOwnerOrHasPermission = (
    requiredPermission: string | string[],
    resourceType: string,
    resourceIdParam: string = 'id'
) => {
    return hasPermission(requiredPermission, {
        allowOwner: true,
        resourceType,
        resourceIdParam
    });
};

/**
 * Middleware para verificar se o usuário é o autor da mensagem de chat ou tem permissão específica
 */
export const isChatMessageOwnerOrHasPermission = (requiredPermission: string | string[]) => {
    return isOwnerOrHasPermission(requiredPermission, 'chat', 'messageId');
};

/**
 * Middleware para verificar se o usuário é o líder da missão ou tem permissão específica
 */
export const isMissionLeaderOrHasPermission = (requiredPermission: string | string[]) => {
    return isOwnerOrHasPermission(requiredPermission, 'mission', 'missionId');
};

/**
 * Middleware para verificar se o usuário pertence à mesma empresa do recurso
 * @param resourceType Tipo de recurso a verificar
 * @param resourceIdParam Nome do parâmetro que contém o ID do recurso
 */
export const sameCompanyOnly = (
    resourceType: string,
    resourceIdParam: string = 'id'
) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Verificar autenticação
            if (!req.user?.userId || !req.user?.company) {
                res.status(401).json({ message: 'Não autenticado ou sem empresa' });
                return;
            }

            const resourceId = req.params[resourceIdParam];
            if (!resourceId) {
                res.status(400).json({ message: `Parâmetro ${resourceIdParam} não encontrado` });
                return;
            }

            let resourceCompany;

            switch (resourceType) {
                case 'chat':
                    // Para mensagens de chat, precisamos buscar a missão associada
                    const message = await ChatMessage.findById(resourceId).select('company');
                    resourceCompany = message?.company;
                    break;

                case 'mission':
                    const mission = await Mission.findById(resourceId).select('company');
                    resourceCompany = mission?.company;
                    break;

                // Adicione outros casos conforme necessário

                default:
                    res.status(400).json({ message: `Tipo de recurso '${resourceType}' não suportado` });
                    return;
            }

            if (!resourceCompany) {
                res.status(404).json({ message: 'Recurso não encontrado' });
                return;
            }

            // Comparar IDs da empresa
            const userCompany = req.user.company.toString();
            const resourceCompanyStr = resourceCompany.toString();

            if (userCompany !== resourceCompanyStr) {
                console.warn(`Acesso negado: usuário da empresa ${userCompany} tentou acessar recurso da empresa ${resourceCompanyStr}`);
                res.status(403).json({ message: 'Este recurso pertence a outra empresa' });
                return;
            }

            next();
        } catch (error) {
            console.error('Erro ao verificar empresa:', error);
            res.status(500).json({
                message: 'Erro ao verificar empresa',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        }
    };
};

// Equivalente ao middleware authorizeAdmin atual, mas usando o sistema de permissões
export const authorizeAdmin = hasPermission('users:admin');

// Apenas administradores da empresa
export const companyAdmin = hasPermission('company:admin');
