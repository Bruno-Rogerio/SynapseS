// src/models/Role.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IRole extends Document {
    name: string;
    description: string;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
}

const RoleSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['admin', 'manager', 'user'] // Manteremos os mesmos nomes para compatibilidade
    },
    description: {
        type: String
    },
    permissions: [{
        type: String
    }]
}, { timestamps: true });

export const Role = mongoose.model<IRole>('Role', RoleSchema);
