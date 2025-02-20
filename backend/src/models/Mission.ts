import mongoose, { Document, Schema } from 'mongoose';

export interface IMission extends Document {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    leader: mongoose.Types.ObjectId;
    team: mongoose.Types.ObjectId[];
    tasks: mongoose.Types.ObjectId[];
    createdBy: mongoose.Types.ObjectId;
    status: 'pending' | 'in_progress' | 'completed';
    points: number;
    comments: string;
    attachments: string[];
    color?: 'teal' | 'cyan' | 'indigo' | 'deepPurple' | 'pink' | 'amber';
}

const MissionSchema: Schema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['pending', 'in_progress', 'completed'],
        default: 'pending',
        required: true
    },
    points: { type: Number, default: 0 },
    comments: { type: String, default: '' },
    attachments: [{ type: String }],
    color: {
        type: String,
        enum: ['teal', 'cyan', 'indigo', 'deepPurple', 'pink', 'amber'],
        default: 'teal'
    },
}, { timestamps: true });

export const Mission = mongoose.model<IMission>('Mission', MissionSchema);
