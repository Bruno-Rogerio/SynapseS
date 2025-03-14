// src/scripts/migrateUserRoles.ts - Solução com asserção de tipos explícita
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Role } from '../models/Role';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Interface explícita para o documento retornado
interface RoleDocument {
    _id: mongoose.Types.ObjectId;
    name: string;
    permissions: string[];
}

// Função para migrar os papéis dos usuários
export const migrateUserRoles = async () => {
    try {
        console.log('Iniciando migração dos papéis de usuários...');

        // 1. Buscar todos os papéis do sistema com asserção de tipo explícita
        const adminRole = (await Role.findOne({ name: 'admin' }).lean()) as RoleDocument | null;
        const managerRole = (await Role.findOne({ name: 'manager' }).lean()) as RoleDocument | null;
        const userRole = (await Role.findOne({ name: 'user' }).lean()) as RoleDocument | null;

        if (!adminRole || !managerRole || !userRole) {
            throw new Error('Papéis não encontrados. Execute initializeRoles primeiro.');
        }

        // Agora usamos asserção de tipo explícita para os IDs
        const adminId = adminRole._id;
        const managerId = managerRole._id;
        const userId = userRole._id;

        console.log('Papéis encontrados:', {
            admin: adminId.toString(),
            manager: managerId.toString(),
            user: userId.toString()
        });

        // 2. Criar mapeamento de string para ObjectId
        const roleMapping: Record<string, mongoose.Types.ObjectId> = {
            'admin': adminId,
            'manager': managerId,
            'user': userId
        };

        // 3. Buscar todos os usuários
        const users = await User.find({}).lean();
        console.log(`Encontrados ${users.length} usuários para migração`);

        // 4. Migrar cada usuário
        let migratedCount = 0;
        let skippedCount = 0;

        for (const user of users) {
            const userRole = user.role;

            // Verificar o tipo do campo 'role'
            if (typeof userRole === 'string') {
                const oldRole = userRole as string;
                const newRoleId = roleMapping[oldRole];

                if (!newRoleId) {
                    console.warn(`Papel desconhecido: ${oldRole} para usuário ${user._id}`);
                    skippedCount++;
                    continue;
                }

                // Atualizar o papel do usuário
                await User.updateOne(
                    { _id: user._id },
                    { $set: { role: newRoleId } }
                );

                console.log(`Migrado usuário ${user._id} de '${oldRole}' para ObjectId`);
                migratedCount++;
            } else {
                // Já é um ObjectId, não precisa migrar
                console.log(`Usuário ${user._id} já tem role como ObjectId`);
                skippedCount++;
            }
        }

        console.log('Migração concluída:');
        console.log(`- ${migratedCount} usuários migrados`);
        console.log(`- ${skippedCount} usuários pulados (já migrados ou com papel desconhecido)`);

    } catch (error) {
        console.error('Erro ao migrar papéis de usuários:', error);
        throw error;
    }
};

// Se o script for executado diretamente
if (require.main === module) {
    // Conectar ao banco de dados
    mongoose
        .connect(process.env.MONGODB_URI || '')
        .then(async () => {
            console.log('Conectado ao MongoDB');
            await migrateUserRoles();
            process.exit(0);
        })
        .catch(err => {
            console.error('Erro ao conectar ao MongoDB:', err);
            process.exit(1);
        });
}
