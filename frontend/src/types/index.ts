// types/index.ts

// Tipos existentes
export interface User {
    _id: string;
    username: string;
    email: string;
    role?: 'Admin' | 'Gestor' | 'User';
    inviteStatus?: string;
    fullName?: string;
    avatar?: string; // Adicionado para compatibilidade com o fórum
}

export interface Checkpoint {
    id: string;
    title: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo: string;
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
    status: "pending" | "in_progress" | "completed" | "pendente" | "em-progresso" | "concluida";
    points: number;
    comments: string;
    attachments: string[];
    color?: 'teal' | 'cyan' | 'indigo' | 'deepPurple' | 'pink' | 'amber';
}

export type NewMission = Omit<Mission, '_id'>;
export type UpdateMission = Partial<Omit<Mission, '_id'>> & { _id: string };

export interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    startDate: string;
    endDate: string;
    assignedTo: string | { _id: string };
    createdBy: string;
    points: number;
    comments: string;
    attachments: string[];
    color?: 'teal' | 'cyan' | 'indigo' | 'deepPurple' | 'pink' | 'amber';
    missionId?: string;
    missionTitle?: string;
}

export interface ChatMessage {
    _id: string;
    missionId: string;
    userId: string;
    username: string;
    message: string;
    fileUrl?: string;
    reactions: Record<string, number>;
    createdAt: string;
    replyTo?: ReplyTo;
}

export interface ReplyTo {
    messageId: string;
    userId: string;
    username: string;
    message: string;
}

// Novos tipos para o fórum
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
    postCount: number;
    viewCount: number;
    moderators: string[];
}

export interface ForumPost {
    _id: string;
    title: string;
    content: string;
    author: User;
    createdAt: string;
    updatedAt: string;
    forum: string; // ID do fórum
    likes: number;
    comments: ForumComment[];
}

export interface ForumComment {
    _id: string;
    content: string;
    author: User;
    createdAt: string;
    updatedAt: string;
    post: string; // ID do post
    likes: number;
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

export interface NewForumPost {
    title: string;
    content: string;
    forum: string; // ID do fórum
}

export interface NewForumComment {
    content: string;
    post: string; // ID do post
}
