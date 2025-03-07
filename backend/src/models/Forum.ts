// src/models/Forum.ts
import mongoose, { Schema, Document, Types } from 'mongoose';
import { IUser } from './User';

// Separar a interface base do post da interface do documento
export interface IPostBase {
    title: string;
    content: string;
    author: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPost extends IPostBase, Document { }

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
    posts: Types.DocumentArray<IPost>;
    moderators: Types.ObjectId[];
    postCount: number;
    updateLastActivity: () => Promise<IForum>;
}

const PostSchema = new Schema({
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const ForumSchema = new Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tags: [{ type: String, trim: true }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isArchived: { type: Boolean, default: false },
    lastActivity: { type: Date, default: Date.now },
    viewCount: { type: Number, default: 0 },
    posts: [PostSchema],
    moderators: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, {
    timestamps: true
});

// Indexação para melhorar a performance das buscas
ForumSchema.index({ title: 'text', description: 'text', tags: 'text' });
ForumSchema.index({ createdBy: 1, lastActivity: -1 });
ForumSchema.index({ tags: 1 });
ForumSchema.index({ isArchived: 1 });

// Método virtual para contar posts
ForumSchema.virtual('postCount').get(function (this: IForum) {
    return this.posts.length;
});

// Método para atualizar lastActivity
ForumSchema.methods.updateLastActivity = function (this: IForum) {
    this.lastActivity = new Date();
    return this.save();
};

// Middleware para atualizar lastActivity antes de salvar
ForumSchema.pre<IForum>('save', function (next) {
    if (this.isModified('posts')) {
        this.lastActivity = new Date();
    }
    next();
});

const Forum = mongoose.model<IForum>('Forum', ForumSchema);

export default Forum;
