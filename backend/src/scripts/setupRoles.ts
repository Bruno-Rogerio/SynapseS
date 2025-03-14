// src/scripts/setupRoles.ts
import mongoose from 'mongoose';
import { Role } from '../models/Role';
import { ROLE_PERMISSIONS } from '../constants/permissions';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Função para inicializar os papéis
export const initializeRoles = async () => {
    try {
        console.log('Inicializando papéis...');

        // Definições dos papéis
        const roles = [
            {
                name: 'admin',
                description: 'Administrador com acesso completo ao sistema',
                permissions: ROLE_PERMISSIONS.admin
            },
            {
                name: 'manager',
                description: 'Gestor com permissões para gerenciar tarefas e usuários',
                permissions: ROLE_PERMISSIONS.manager
            },
            {
                name: 'user',
                description: 'Usuário com acesso básico',
                permissions: ROLE_PERMISSIONS.user
            }
        ];

        // Criar ou atualizar cada papel
        for (const role of roles) {
            await Role.findOneAndUpdate(
                { name: role.name },
                role,
                { upsert: true, new: true }
            );
            console.log(`Papel "${role.name}" criado ou atualizado`);
        }

        console.log('Inicialização de papéis concluída com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar papéis:', error);
        throw error;
    }
};

// Se o script for executado diretamente (não importado)
if (require.main === module) {
    // Conectar ao banco de dados
    mongoose
        .connect(process.env.MONGODB_URI || '')
        .then(async () => {
            console.log('Conectado ao MongoDB');
            await initializeRoles();
            process.exit(0);
        })
        .catch(err => {
            console.error('Erro ao conectar ao MongoDB:', err);
            process.exit(1);
        });
}
