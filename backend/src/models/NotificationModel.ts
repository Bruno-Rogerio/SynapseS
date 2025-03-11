// models/NotificationModel.ts
import mongoose, { Document, Schema, Model } from 'mongoose';

// Definição dos tipos de notificação
export type NotificationType =
    | 'forum_message'
    | 'forum_mention'
    | 'forum_reply'
    | 'task_assigned'
    | 'task_completed'
    | 'chat_message'    // Novo tipo
    | 'chat_mention'    // Novo tipo
    | 'chat_reply'      // Novo tipo
    | 'system';

// Interface para as referências
export interface NotificationReferences {
    forum?: mongoose.Types.ObjectId;
    message?: mongoose.Types.ObjectId;
    task?: mongoose.Types.ObjectId;
    mission?: mongoose.Types.ObjectId;  // Nova referência
}

// Interface para o documento de notificação
export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId;
    sender?: mongoose.Types.ObjectId;
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
    references: NotificationReferences;
    metadata?: Record<string, any>;
    read: boolean;
    createdAt: Date;
    readAt?: Date;
    // Métodos
    markAsRead(): Promise<INotification>;
}

// Interface para o modelo de notificação com métodos estáticos
export interface INotificationModel extends Model<INotification> {
    countUnread(userId: mongoose.Types.ObjectId | string): Promise<number>;
}

const NotificationSchema = new Schema<INotification>({
    // Usuário que receberá a notificação
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    // Usuário que causou a notificação (se aplicável)
    sender: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    // Tipo de notificação
    type: {
        type: String,
        required: true,
        enum: [
            'forum_message',
            'forum_mention',
            'forum_reply',
            'task_assigned',
            'task_completed',
            'chat_message',    // Novo tipo
            'chat_mention',    // Novo tipo
            'chat_reply',      // Novo tipo
            'system'
        ]
    },
    // Título da notificação
    title: {
        type: String,
        required: true
    },
    // Corpo da notificação
    body: {
        type: String,
        required: true
    },
    // Link para redirecionamento
    link: {
        type: String
    },
    // Referências a objetos relacionados
    references: {
        forum: {
            type: Schema.Types.ObjectId,
            ref: 'Forum'
        },
        message: {
            type: Schema.Types.ObjectId,
            ref: 'ForumMessage'
        },
        task: {
            type: Schema.Types.ObjectId,
            ref: 'Task'
        },
        mission: {           // Nova referência
            type: Schema.Types.ObjectId,
            ref: 'Mission'
        }
    },
    // Metadados adicionais
    metadata: {
        type: Schema.Types.Mixed
    },
    // Estado de leitura
    read: {
        type: Boolean,
        default: false,
        index: true
    },
    // Campos de data
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    // Data em que foi lida (se aplicável)
    readAt: {
        type: Date
    }
});

// Método para marcar como lida
NotificationSchema.methods.markAsRead = async function (this: INotification): Promise<INotification> {
    if (!this.read) {
        this.read = true;
        this.readAt = new Date();
        await this.save();
    }
    return this;
};

// Método estático para contar não lidas
NotificationSchema.statics.countUnread = async function (
    userId: mongoose.Types.ObjectId | string
): Promise<number> {
    return this.countDocuments({
        recipient: userId,
        read: false
    });
};

// Índice composto para buscas frequentes
NotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

// Cria e exporta o modelo fortemente tipado
const Notification = mongoose.model<INotification, INotificationModel>('Notification', NotificationSchema);
export default Notification;
