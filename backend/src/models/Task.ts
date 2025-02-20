import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    startDate: Date;
    endDate: Date;
    assignedTo: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    points: number;
    comments: string;
    attachments: string[];
}

const TaskSchema: Schema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    points: { type: Number, default: 0 },
    comments: { type: String },
    attachments: [{ type: String }],
    color: {
        type: String,
        enum: ['teal', 'cyan', 'indigo', 'deepPurple', 'pink', 'amber'],
        default: 'teal'
    },
}, { timestamps: true });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
