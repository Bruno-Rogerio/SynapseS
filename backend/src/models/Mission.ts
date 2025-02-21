import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface ITask {
    id: string;
    title: string;
    status: 'pendente' | 'em-progresso' | 'concluida';
    assignedTo: string;
}

export interface IMission extends Document {
    title: string;
    description: string;
    leader: string;
    members: string[];
    tasks: ITask[];
    startDate: Date;
    endDate?: Date;
    progress: number;
}

const TaskSchema: Schema = new Schema({
    id: { type: String, required: true, default: uuidv4 },
    title: { type: String, required: true },
    status: {
        type: String,
        enum: ['pendente', 'em-progresso', 'concluida'],
        default: 'pendente'
    },
    assignedTo: { type: String, required: true }
});

const MissionSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        leader: { type: String, required: true },
        members: [{ type: String, required: true }],
        tasks: [TaskSchema],
        startDate: { type: Date, required: true },
        endDate: { type: Date }
    },
    {
        timestamps: true
    }
);

// Campo virtual para cálculo de progresso
MissionSchema.virtual('progress').get(function (this: IMission) {
    if (!this.tasks || this.tasks.length === 0) return 0;
    const completed = this.tasks.filter(task => task.status === 'concluida').length;
    return Math.round((completed / this.tasks.length) * 100);
});

// Configura para que os campos virtuais apareçam na serialização
MissionSchema.set('toJSON', { virtuals: true });
MissionSchema.set('toObject', { virtuals: true });

const Mission = mongoose.model<IMission>('Mission', MissionSchema);
export default Mission;
