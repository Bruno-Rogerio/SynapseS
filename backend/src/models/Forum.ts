// src/models/Forum.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './User';

// Interfaces para as reações
export interface ILikedReaction {
    type: 'like';
    userId: Types.ObjectId;
}

export interface IDislikedReaction {
    type: 'dislike';
    userId: Types.ObjectId;
}

export interface ICustomReaction {
    emoji: string;
    userId: Types.ObjectId;
}

// Interface para as mensagens
export interface IMessage {
    _id: Types.ObjectId;
    content: string;
    author: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    reactions: {
        likes: ILikedReaction[];
        dislikes: IDislikedReaction[];
        custom: ICustomReaction[];
    };
    replyTo?: Types.ObjectId;
}

// Interface para o fórum
export interface IForum extends Document {
    title: string;
    description: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    followers: Types.ObjectId[];
    isArchived: boolean;
    lastActivity: Date;
    viewCount: number;
    messages: IMessage[];
    moderators: Types.ObjectId[];
    messageCount: number;
    updateLastActivity: () => Promise<IForum>;
}

// Schema para reações de like/dislike
const ReactionSchema = new Schema({
    type: { type: String, enum: ['like', 'dislike'], required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

// Schema para reações custom (com emoji)
const CustomReactionSchema = new Schema({
    emoji: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

// Schema para mensagens
const MessageSchema = new Schema({
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    reactions: {
        likes: { type: [ReactionSchema], default: [] },
        dislikes: { type: [ReactionSchema], default: [] },
        custom: { type: [CustomReactionSchema], default: [] },
    },
    replyTo: { type: Schema.Types.ObjectId, ref: 'Message' },
});

// Schema para fórum
const ForumSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String, trim: true }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isArchived: { type: Boolean, default: false },
    lastActivity: { type: Date, default: Date.now },
    viewCount: { type: Number, default: 0 },
    messages: [MessageSchema],
    moderators: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    messageCount: { type: Number, default: 0 },
}, {
    timestamps: true
});

// Indexação para melhorar a performance das buscas
ForumSchema.index({ title: 'text', description: 'text', tags: 'text' });
ForumSchema.index({ createdBy: 1, lastActivity: -1 });
ForumSchema.index({ tags: 1 });
ForumSchema.index({ isArchived: 1 });

// Método para atualizar lastActivity
ForumSchema.methods.updateLastActivity = function (this: IForum) {
    this.lastActivity = new Date();
    return this.save();
};

// Middleware para atualizar lastActivity e messageCount antes de salvar
ForumSchema.pre<IForum>('save', function (next) {
    if (this.isModified('messages')) {
        this.lastActivity = new Date();
        this.messageCount = this.messages.length;
    }
    next();
});

const Forum = mongoose.model<IForum>('Forum', ForumSchema);

export { Forum };
export default Forum;
