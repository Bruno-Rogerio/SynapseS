import mongoose, { Document, Schema } from 'mongoose';

export interface IMission extends Document {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    createdBy: mongoose.Types.ObjectId;
    tasks: mongoose.Types.ObjectId[];
    comments: string;
    attachments: string[];
}

const MissionSchema: Schema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    comments: { type: String, default: '' },
    attachments: [{ type: String }],
}, { timestamps: true });

export const Mission = mongoose.model<IMission>('Mission', MissionSchema);
