// backend/src/models/Mission.ts
import mongoose, { Document, Schema, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

/**
 * Interface para tarefas de uma missão
 */
export interface ITask {
    id: string;
    title: string;
    status: 'pendente' | 'em-progresso' | 'concluida';
    assignedTo: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Interface para checkpoints de uma missão
 */
export interface ICheckpoint {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida';
    dueDate: Date;
    assignedTo: string;
    createdAt?: Date;
    updatedAt?: Date;
}

/**
 * Interface para representar uma missão após serialização para JSON
 * Útil para tipagem na resposta da API
 */
export interface IMissionJSON {
    _id: string; // String em vez de ObjectId
    title: string;
    description: string;
    leader: string;
    members: string[];
    tasks: ITask[];
    checkpoints: ICheckpoint[];
    startDate: Date | string;
    endDate?: Date | string;
    status: 'pendente' | 'em-progresso' | 'concluida';
    progress: number;
    company: string; // String em vez de ObjectId
    createdAt: Date | string;
    updatedAt: Date | string;
}

/**
 * Interface para o modelo de missão
 */
export interface IMission extends Document {
    _id: Types.ObjectId;
    title: string;
    description: string;
    leader: string;
    members: string[];
    tasks: ITask[];
    checkpoints: ICheckpoint[];
    startDate: Date;
    endDate?: Date;
    status: 'pendente' | 'em-progresso' | 'concluida';
    progress: number;
    company: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;

    // Métodos
    syncCheckpointStatus: () => void;
    calculateProgress: () => number;

    // Sobrescrita para garantir tipagem correta
    toJSON: () => IMissionJSON;
}

const TaskSchema: Schema = new Schema({
    id: { type: String, required: true, default: uuidv4 },
    title: { type: String, required: true },
    status: {
        type: String,
        enum: ['pendente', 'em-progresso', 'concluida'],
        default: 'pendente',
    },
    assignedTo: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const CheckpointSchema: Schema = new Schema({
    id: { type: String, required: true, default: uuidv4 },
    title: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed', 'pendente', 'em-progresso', 'concluida'],
        default: 'pending',
    },
    dueDate: { type: Date, required: true },
    assignedTo: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const MissionSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        leader: { type: String, required: true },
        members: [{ type: String, required: true }],
        tasks: [TaskSchema],
        checkpoints: [CheckpointSchema],
        startDate: { type: Date, required: true },
        endDate: { type: Date },
        status: {
            type: String,
            enum: ['pendente', 'em-progresso', 'concluida'],
            default: 'pendente',
        },
        company: {
            type: Schema.Types.ObjectId,
            ref: 'Company',
            required: true,
            index: true // Adiciona índice para pesquisas por empresa
        },
    },
    {
        timestamps: true,
    }
);

/**
 * Campo virtual para cálculo de progresso considerando tarefas e checkpoints
 */
MissionSchema.virtual('progress').get(function (this: IMission) {
    return this.calculateProgress();
});

/**
 * Método para calcular o progresso da missão
 * Considera tarefas e checkpoints, com peso configurável
 */
MissionSchema.methods.calculateProgress = function (this: IMission): number {
    const taskWeight = 0.7; // 70% do progresso baseado em tarefas
    const checkpointWeight = 0.3; // 30% do progresso baseado em checkpoints
    let taskProgress = 0;
    let checkpointProgress = 0;

    // Calcular progresso das tarefas
    if (this.tasks && this.tasks.length > 0) {
        const completedTasks = this.tasks.filter(task => task.status === 'concluida').length;
        taskProgress = (completedTasks / this.tasks.length) * 100;
    }

    // Calcular progresso dos checkpoints
    if (this.checkpoints && this.checkpoints.length > 0) {
        const completedCheckpoints = this.checkpoints.filter(
            cp => cp.status === 'concluida' || cp.status === 'completed'
        ).length;
        checkpointProgress = (completedCheckpoints / this.checkpoints.length) * 100;
    }

    // Se não houver tarefas, considerar apenas checkpoints e vice-versa
    if (this.tasks.length === 0 && this.checkpoints.length > 0) {
        return Math.round(checkpointProgress);
    } else if (this.checkpoints.length === 0 && this.tasks.length > 0) {
        return Math.round(taskProgress);
    } else if (this.tasks.length === 0 && this.checkpoints.length === 0) {
        return 0;
    }

    // Calcular progresso ponderado
    return Math.round((taskProgress * taskWeight) + (checkpointProgress * checkpointWeight));
};

// Configurar para que os campos virtuais apareçam na serialização e ObjectId seja convertido para string
MissionSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        // Garantir que _id seja string
        if (ret._id) {
            ret._id = ret._id.toString();
        }

        // Garantir que company seja string se for ObjectId
        if (ret.company && typeof ret.company === 'object' && ret.company._id) {
            ret.company = ret.company._id.toString();
        } else if (ret.company && ret.company.toString) {
            ret.company = ret.company.toString();
        }

        // Datas formatadas consistentemente (opcional)
        if (ret.createdAt) {
            ret.createdAt = new Date(ret.createdAt).toISOString();
        }

        if (ret.updatedAt) {
            ret.updatedAt = new Date(ret.updatedAt).toISOString();
        }

        return ret;
    }
});

// Configuração para toObject também manter virtuals
MissionSchema.set('toObject', { virtuals: true });

/**
 * Função para converter status do checkpoint
 */
const convertCheckpointStatus = (status: string): ICheckpoint['status'] => {
    switch (status) {
        case 'pending':
        case 'pendente':
            return 'pendente';
        case 'in_progress':
        case 'em-progresso':
            return 'em-progresso';
        case 'completed':
        case 'concluida':
            return 'concluida';
        default:
            return 'pendente';
    }
};

/**
 * Middleware para validar e sincronizar status dos checkpoints antes de salvar
 */
MissionSchema.pre('save', function (this: IMission, next) {
    // Atualizar data de modificação dos itens modificados
    const now = new Date();

    // Atualizar datas para tarefas e checkpoints modificados
    if (this.isModified('tasks')) {
        this.tasks.forEach(task => {
            if (!task.createdAt) task.createdAt = now;
            task.updatedAt = now;
        });
    }

    if (this.isModified('checkpoints')) {
        this.checkpoints.forEach(checkpoint => {
            if (!checkpoint.createdAt) checkpoint.createdAt = now;
            checkpoint.updatedAt = now;

            // Validar status dos checkpoints
            const validStatuses = ['pending', 'in_progress', 'completed', 'pendente', 'em-progresso', 'concluida'];
            if (!validStatuses.includes(checkpoint.status)) {
                return next(new Error(`Status inválido para checkpoint: ${checkpoint.status}`));
            }
        });
    }

    // Verificar se o líder está incluído nos membros
    if (this.leader && this.isModified('leader') && this.members.length > 0) {
        if (!this.members.includes(this.leader)) {
            this.members.push(this.leader);
        }
    }

    next();
});

/**
 * Método para sincronizar os status dos checkpoints
 */
MissionSchema.methods.syncCheckpointStatus = function (this: IMission) {
    this.checkpoints = this.checkpoints.map((checkpoint: ICheckpoint) => ({
        ...checkpoint,
        status: convertCheckpointStatus(checkpoint.status)
    }));
};

/**
 * Índices compostos para consultas frequentes
 */
// Índice para buscar missões por empresa + status
MissionSchema.index({ company: 1, status: 1 });

// Índice para buscar missões por empresa + líder
MissionSchema.index({ company: 1, leader: 1 });

// Índice para buscar missões por empresa + membro (para getMissionsByMember)
MissionSchema.index({ company: 1, members: 1 });

// Índice para buscar por data
MissionSchema.index({ company: 1, startDate: -1 });
MissionSchema.index({ company: 1, endDate: -1 });

/**
 * Métodos estáticos para consultas comuns
 */
MissionSchema.statics = {
    /**
     * Busca missões por empresa e membro
     */
    findByMemberAndCompany: function (memberId: string, companyId: mongoose.Types.ObjectId) {
        return this.find({
            members: memberId,
            company: companyId
        });
    },

    /**
     * Busca missões ativas por empresa
     */
    findActiveByCompany: function (companyId: mongoose.Types.ObjectId) {
        return this.find({
            company: companyId,
            status: { $ne: 'concluida' }
        }).sort({ startDate: -1 });
    },

    /**
     * Busca missões atribuídas a um usuário específico em uma empresa
     */
    findAssignedToUserInCompany: function (userId: string, companyId: mongoose.Types.ObjectId) {
        return this.find({
            $or: [
                { leader: userId },
                { members: userId },
                { 'tasks.assignedTo': userId },
                { 'checkpoints.assignedTo': userId }
            ],
            company: companyId
        }).sort({ updatedAt: -1 });
    }
};

// Criar e exportar o modelo
const Mission = mongoose.model<IMission>('Mission', MissionSchema);
export default Mission;
