// backend/src/models/Mission.ts
import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ITask {
    id: string;
    title: string;
    status: 'pendente' | 'em-progresso' | 'concluida';
    assignedTo: string;
}

export interface ICheckpoint {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida';
    dueDate: Date;
    assignedTo: string;
}

export interface IMission extends Document {
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
    syncCheckpointStatus: () => void;
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
    },
    {
        timestamps: true,
    }
);

// Campo virtual para cálculo de progresso (usando tarefas)
MissionSchema.virtual('progress').get(function (this: IMission) {
    if (!this.tasks || this.tasks.length === 0) return 0;
    const completed = this.tasks.filter(task => task.status === 'concluida').length;
    return Math.round((completed / this.tasks.length) * 100);
});

// Configura para que os campos virtuais apareçam na serialização
MissionSchema.set('toJSON', { virtuals: true });
MissionSchema.set('toObject', { virtuals: true });

// Função para converter status do checkpoint
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

// Middleware para validar e sincronizar status dos checkpoints antes de salvar
MissionSchema.pre('save', function (this: IMission, next) {
    // Validar status dos checkpoints
    this.checkpoints.forEach((checkpoint: ICheckpoint) => {
        const validStatuses = ['pending', 'in_progress', 'completed', 'pendente', 'em-progresso', 'concluida'];
        if (!validStatuses.includes(checkpoint.status)) {
            next(new Error(`Status inválido para checkpoint: ${checkpoint.status}`));
        }
    });
    next();
});

// Método para sincronizar os status dos checkpoints
MissionSchema.methods.syncCheckpointStatus = function (this: IMission) {
    this.checkpoints = this.checkpoints.map((checkpoint: ICheckpoint) => ({
        ...checkpoint,
        status: convertCheckpointStatus(checkpoint.status)
    }));
};

const Mission = mongoose.model<IMission>('Mission', MissionSchema);

export default Mission;
