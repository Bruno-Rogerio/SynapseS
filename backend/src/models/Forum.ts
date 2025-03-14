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
    _id: Types.ObjectId;
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
    company: Types.ObjectId; // Campo para armazenar a empresa
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
    // Campo company com índice
    company: {
        type: Schema.Types.ObjectId,
        ref: 'Company',
        required: true,
        index: true
    },
}, {
    timestamps: true
});

// Indexação para melhorar a performance das buscas
ForumSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Índices compostos com company para isolamento de dados
ForumSchema.index({ company: 1, createdBy: 1, lastActivity: -1 });
ForumSchema.index({ company: 1, tags: 1 });
ForumSchema.index({ company: 1, isArchived: 1 });
ForumSchema.index({ company: 1, lastActivity: -1 }); // Para ordenar por atividade recente
ForumSchema.index({ company: 1, followers: 1 }); // Para buscar forums que um usuário segue

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

// Configuração para toJSON e toObject incluir virtuals e transformar IDs em strings
ForumSchema.set('toJSON', {
    virtuals: true,
    transform: function (doc, ret) {
        if (ret._id) ret._id = ret._id.toString();
        if (ret.company) ret.company = ret.company.toString();

        // Converter IDs das mensagens
        if (ret.messages && Array.isArray(ret.messages)) {
            ret.messages = ret.messages.map((msg: any) => {
                if (msg._id) msg._id = msg._id.toString();
                if (msg.author) msg.author = msg.author.toString();
                if (msg.replyTo) msg.replyTo = msg.replyTo.toString();
                return msg;
            });
        }

        // Converter arrays de IDs para strings
        if (ret.followers && Array.isArray(ret.followers)) {
            ret.followers = ret.followers.map((id: any) =>
                typeof id === 'object' && id._id ? id._id.toString() : id.toString()
            );
        }

        if (ret.moderators && Array.isArray(ret.moderators)) {
            ret.moderators = ret.moderators.map((id: any) =>
                typeof id === 'object' && id._id ? id._id.toString() : id.toString()
            );
        }

        return ret;
    }
});

ForumSchema.set('toObject', { virtuals: true });

// Métodos estáticos para consultas comuns
ForumSchema.statics = {
    /**
     * Busca fóruns por empresa
     */
    findByCompany: function (companyId: Types.ObjectId, options = {}) {
        return this.find({ company: companyId, ...options })
            .sort({ lastActivity: -1 });
    },

    /**
     * Busca fóruns por tag dentro de uma empresa
     */
    findByCompanyAndTag: function (companyId: Types.ObjectId, tag: string) {
        return this.find({
            company: companyId,
            tags: tag
        }).sort({ lastActivity: -1 });
    },

    /**
     * Busca fóruns por texto dentro de uma empresa
     */
    searchInCompany: function (companyId: Types.ObjectId, searchText: string) {
        return this.find({
            company: companyId,
            $text: { $search: searchText }
        }, {
            score: { $meta: "textScore" }
        })
            .sort({ score: { $meta: "textScore" } });
    },

    /**
     * Busca fóruns populares por empresa (baseado em visualizações)
     */
    findPopularByCompany: function (companyId: Types.ObjectId, limit = 10) {
        return this.find({
            company: companyId,
            isArchived: false
        })
            .sort({ viewCount: -1, messageCount: -1 })
            .limit(limit);
    },

    /**
     * Busca fóruns que um usuário segue dentro de uma empresa
     */
    findFollowedByUser: function (companyId: Types.ObjectId, userId: Types.ObjectId) {
        return this.find({
            company: companyId,
            followers: userId
        }).sort({ lastActivity: -1 });
    }
};

const Forum = mongoose.model<IForum>('Forum', ForumSchema);

export { Forum };
export default Forum;
