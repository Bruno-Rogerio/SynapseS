// types/index.ts
// Tipos existentes com as atualizações necessárias

export interface User {
    _id: string;
    email: string;
    username: string;
    fullName?: string;
    avatar?: string;
    role: string;       // Agora sempre será uma string (o nome da role)
    roleData?: Role;    // Armazena o objeto completo da role quando disponível
    company: string;
    permissions: string[];
    bookmarks?: string[];
}

// Checkpoint atualizado com novos campos
export interface Checkpoint {
    id: string;
    title: string;
    description?: string; // Descrição do checkpoint (usado nos tooltips e timeline)
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida' | 'concluída';
    assignedTo?: string;
    responsible?: string; // ID do usuário responsável (mostrado na timeline)
    completedAt?: string; // Data de conclusão
    priority?: 'low' | 'medium' | 'high' | 'urgent'; // Prioridade do checkpoint
    order?: number; // Ordem de exibição 
}

// Status de checkpoint para uso nos filtros e visualizações
export type CheckpointStatus = 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida' | 'concluída';
export type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida' | 'concluída';

// Mapeamento de status para visualização
export interface StatusMapping {
    pendente: string;
    'em-progresso': string;
    concluida: string;
}

export interface Mission {
    _id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    leader: string;
    team: string[];
    tasks: Task[];
    members?: string[];
    checkpoints: Checkpoint[];
    createdBy: string;
    status: MissionStatus;
    points: number;
    comments: string;
    attachments: string[];
    progress?: number; // Progresso calculado da missão
    priority?: number; // Prioridade da missão (0-3)
    category?: string; // Categoria da missão
    tags?: string[]; // Tags associadas à missão
    isArchived?: boolean; // Se a missão está arquivada
    updatedAt?: string; // Data da última atualização
    updatedBy?: string; // ID do usuário que fez a última atualização
}

// Estatísticas dos checkpoints (para o componente de estatísticas)
export interface CheckpointStats {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    overdue?: number; // Checkpoints atrasados
}

// Opções de visualização do calendário
export interface CalendarViewOptions {
    showWeekends: boolean;
    highlightToday: boolean;
    showCompletedCheckpoints: boolean;
}

// Opções de filtragem de checkpoints
export interface CheckpointFilterOptions {
    status?: CheckpointStatus[];
    assignedTo?: string[];
    dateRange?: {
        start: Date;
        end: Date;
    };
}

export interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida' | 'concluída';
    startDate: string;
    endDate: string;
    assignedTo: string | { _id: string; username?: string };
    createdBy: string;
    points: number;
    comments: string[] | string;
    attachments: string[];
    color?: 'teal' | 'cyan' | 'indigo' | 'deepPurple' | 'pink' | 'amber' | 'green' | 'blue' | 'red' | 'orange' | 'brown' | 'blueGrey';
    missionId?: string;
    missionTitle?: string;
    subtasks?: SubTask[];
    priority?: number; // 0 = Baixa, 1 = Média, 2 = Alta, 3 = Urgente
    isBlockedBy?: string[]; // IDs de tarefas que bloqueiam esta
    blocks?: string[]; // IDs de tarefas que esta bloqueia
}

export type NewMission = Omit<Mission, '_id'>;
export type UpdateMission = Partial<Omit<Mission, '_id'>> & { _id: string };

// Interface para subtarefas
export interface SubTask {
    id: string;
    title: string;
    completed: boolean;
    dueDate?: string;
    assignedTo?: string;
}

// Timeline view options
export interface TimelineViewOptions {
    groupBy: 'day' | 'week' | 'month';
    sortOrder: 'asc' | 'desc';
    showCompleted: boolean;
}

// Restante dos tipos permanecem inalterados...
export type ChatMessageStatus = 'sending' | 'sent' | 'read' | 'error';
export interface ChatMessage {
    _id: string;
    missionId: string;
    userId: string;
    username: string;
    message: string;
    fileUrl?: string;
    fileName?: string;
    reactions: Record<string, number>;
    createdAt: string;
    replyTo?: ReplyTo;
    status?: ChatMessageStatus;
    avatar?: string;
    isEdited?: boolean;
    editedAt?: string;
    deliveredAt?: string;
    readAt?: string;
}

export interface ReplyTo {
    messageId: string;
    userId: string;
    username: string;
    message: string;
    fileUrl?: string;
}

export interface ChatConfig {
    enableReactions: boolean;
    enableReplies: boolean;
    enableFileUploads: boolean;
    allowedFileTypes: string[];
    maxFileSize: number;
    messageCharLimit?: number;
}

export interface Forum {
    _id: string;
    title: string;
    description: string;
    createdBy: User;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    followers: string[];
    isArchived: boolean;
    lastActivity: string;
    messageCount: number;
    viewCount: number;
    moderators: string[];
}

export interface MessageReaction {
    type: 'like' | 'dislike';
    userId: string;
}

export interface CustomReaction {
    emoji: string;
    userId: string;
}

export interface ForumMessage {
    _id: string;
    content: string;
    author: User;
    createdAt: string;
    updatedAt: string;
    forum: string;
    replyTo?: string;
    reactions: {
        likes: MessageReaction[];
        dislikes: MessageReaction[];
        custom: CustomReaction[];
    };
}

export interface NewForum {
    title: string;
    description: string;
    tags: string[];
}

export interface UpdateForum {
    _id: string;
    title?: string;
    description?: string;
    tags?: string[];
    isArchived?: boolean;
}

export interface NewForumMessage {
    content: string;
    forum: string;
    replyTo?: string;
}

export interface UpdateForumMessage {
    _id: string;
    content: string;
}

export interface ForumReaction {
    message: string;
    type: 'like' | 'dislike';
}

export interface TypingState {
    userId: string;
    username: string;
    timestamp: number;
}

export type WebSocketMessage =
    | { type: 'new_message'; message: ForumMessage | ChatMessage }
    | { type: 'update_message'; message: ForumMessage | ChatMessage }
    | { type: 'delete_message'; messageId: string }
    | { type: 'typing'; userId: string; username: string }
    | { type: 'message_read'; messageId: string; readBy: string }
    | { type: 'message_reaction'; messageId: string; reaction: string; userId: string }
    | { type: 'follow_forum'; result: any }
    | { type: 'update_forum'; forum: Forum }
    | { type: 'archive_forum'; forum: Forum }
    | { type: 'update_moderators'; result: any }
    | { type: 'notification'; notification: Notification };

export interface WebSocketOptions {
    token: string;
    query?: Record<string, string>;
}

export type WebSocketCallback = (message: WebSocketMessage) => void;

export type NotificationType =
    | 'system_announcement'
    | 'task_assigned'
    | 'task_completed'
    | 'forum_message'
    | 'forum_mention'
    | 'forum_reply'
    | 'mission_created'
    | 'mission_updated'
    | 'mission_task_assigned'
    | 'mission_checkpoint_assigned'
    | 'checkpoint_completed' // Nova notificação para checkpoints concluídos
    | 'checkpoint_approaching' // Nova notificação para checkpoints próximos da data
    | 'user_mention'
    | 'chat_message'
    | 'chat_reaction'
    | 'chat_reply';

export interface Notification {
    _id: string;
    recipient: string;
    type: NotificationType;
    title: string;
    content: string;
    isRead: boolean;
    createdAt: string;
    updatedAt: string;
    sender?: {
        _id: string;
        username: string;
        avatar?: string;
    };
    link?: string;
    relatedItems?: {
        taskId?: string;
        forumId?: string;
        messageId?: string;
        missionId?: string;
        userId?: string;
        chatId?: string;
        checkpointId?: string; // ID do checkpoint relacionado
    };
}

export interface NotificationResponse {
    notifications: Notification[];
    unreadCount: number;
    totalCount: number;
    currentPage: number;
    totalPages: number;
}

export interface NotificationsOptions {
    limit?: number;
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export interface ChatMessageGroup {
    date: string;
    messages: ChatMessage[];
}

export interface ChatStats {
    totalMessages: number;
    activeUsers: number;
    filesShared: number;
    lastActivityAt: string;
}

export interface ChatSearchOptions {
    query: string;
    fromDate?: string;
    toDate?: string;
    fromUser?: string;
    hasFile?: boolean;
    hasReactions?: boolean;
}

export interface MessageEditHistory {
    timestamp: string;
    content: string;
    editedBy: string;
}

export interface Role {
    _id: string;
    name: string;
    description?: string;
    permissions?: string[];
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}
