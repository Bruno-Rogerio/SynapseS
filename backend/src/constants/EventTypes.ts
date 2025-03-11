// constants/EventTypes.ts
export const EventTypes = {
    // Eventos de fórum
    FORUM: {
        MESSAGE_CREATED: 'forum.message.created',
        FORUM_CREATED: 'forum.created',
        USER_MENTIONED: 'forum.user.mentioned',
        MESSAGE_REPLIED: 'forum.message.replied'
    },

    // Eventos de tarefas gerais
    TASK: {
        ASSIGNED: 'task.assigned',
        COMPLETED: 'task.completed',
        DUE_DATE_APPROACHING: 'task.dueDate.approaching'
    },

    // Eventos de usuário
    USER: {
        REGISTERED: 'user.registered',
        PROFILE_UPDATED: 'user.profile.updated',
        DELETED: 'user.deleted'  // Novo evento adicionado
    },

    // Eventos do sistema
    SYSTEM: {
        ANNOUNCEMENT: 'system.announcement'
    },

    // Eventos de chat
    CHAT: {
        MESSAGE_CREATED: 'chat.message.created',
        MESSAGE_REPLIED: 'chat.message.replied',
        MENTION_USER: 'chat.user.mentioned'
    },

    // Eventos de missões
    MISSION: {
        CREATED: 'mission.created',
        STATUS_UPDATED: 'mission.status.updated',
        MEMBER_ADDED: 'mission.member.added',

        // Eventos relacionados a tarefas de missão
        TASK: {
            ASSIGNED: 'mission.task.assigned',
            STATUS_UPDATED: 'mission.task.status.updated',
            COMPLETED: 'mission.task.completed'
        },

        // Eventos relacionados a checkpoints
        CHECKPOINT: {
            ASSIGNED: 'mission.checkpoint.assigned',
            STATUS_UPDATED: 'mission.checkpoint.status.updated'
        }
    }
};
