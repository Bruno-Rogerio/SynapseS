// models/UserPreferenceModel.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import { NotificationType } from './NotificationModel';

/**
 * Interface que define a estrutura de uma inscrição em fórum
 */
export interface ForumSubscription {
    forum: mongoose.Types.ObjectId;
    notifications: boolean;
}

/**
 * Interface que define as preferências do usuário
 */
export interface IUserPreference extends Document {
    user: mongoose.Types.ObjectId;
    notificationsEnabled: boolean;
    notificationSettings: Map<NotificationType, boolean>;
    emailNotifications: boolean;
    forumSubscriptions: ForumSubscription[];
    theme: string;
    language: string;

    // Métodos
    disableNotificationType(type: NotificationType): Promise<IUserPreference>;
    enableNotificationType(type: NotificationType): Promise<IUserPreference>;
    updateForumSubscription(forumId: mongoose.Types.ObjectId | string, notifications: boolean): Promise<IUserPreference>;
}

/**
 * Schema para as preferências do usuário
 */
const UserPreferenceSchema = new Schema<IUserPreference>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    notificationsEnabled: {
        type: Boolean,
        default: true
    },
    notificationSettings: {
        type: Map,
        of: Boolean,
        default: () => new Map() // Usando função para evitar compartilhamento entre instâncias
    },
    emailNotifications: {
        type: Boolean,
        default: true
    },
    forumSubscriptions: [{
        forum: {
            type: Schema.Types.ObjectId,
            ref: 'Forum'
        },
        notifications: {
            type: Boolean,
            default: true
        }
    }],
    theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
    },
    language: {
        type: String,
        default: 'pt-BR'
    }
});

/**
 * Método para desativar um tipo específico de notificação
 */
UserPreferenceSchema.methods.disableNotificationType = async function (
    this: IUserPreference,
    type: NotificationType
): Promise<IUserPreference> {
    this.notificationSettings.set(type, false);
    return this.save();
};

/**
 * Método para ativar um tipo específico de notificação
 */
UserPreferenceSchema.methods.enableNotificationType = async function (
    this: IUserPreference,
    type: NotificationType
): Promise<IUserPreference> {
    this.notificationSettings.set(type, true);
    return this.save();
};

/**
 * Método para atualizar preferências de notificação de um fórum
 */
UserPreferenceSchema.methods.updateForumSubscription = async function (
    this: IUserPreference,
    forumId: mongoose.Types.ObjectId | string,
    notifications: boolean
): Promise<IUserPreference> {
    // Converter forumId para ObjectId se for uma string
    const objectIdForumId = typeof forumId === 'string'
        ? new mongoose.Types.ObjectId(forumId)
        : forumId;

    const subIndex = this.forumSubscriptions.findIndex(
        (sub: ForumSubscription) => sub.forum.toString() === objectIdForumId.toString()
    );

    if (subIndex >= 0) {
        this.forumSubscriptions[subIndex].notifications = notifications;
    } else {
        this.forumSubscriptions.push({
            forum: objectIdForumId, // Usando o ObjectId convertido
            notifications
        });
    }

    return this.save();
};

// Adiciona índice para buscas por usuário
UserPreferenceSchema.index({ user: 1 });

// Criar e exportar o modelo
const UserPreference = mongoose.model<IUserPreference>('UserPreference', UserPreferenceSchema);

export default UserPreference;
