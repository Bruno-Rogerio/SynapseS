// src/types/index.ts

export interface User {
    _id: string;
    username: string;
    email: string;
    role?: 'Admin' | 'Gestor' | 'User';
    inviteStatus?: string;
    fullName?: string;
}

export interface Mission {
    _id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    leader: string;
    team: string[];
    tasks: string[]; // Alterado de Task[] para string[]
    createdBy: string;
    status: 'pending' | 'in_progress' | 'completed';
    points: number;
    comments: string;
    attachments: string[];
    color?: 'teal' | 'cyan' | 'indigo' | 'deepPurple' | 'pink' | 'amber';
}

export interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    startDate: string;
    endDate: string;
    assignedTo: string | { _id: string; /* outras propriedades se necessário */ };
    createdBy: string;
    points: number;
    comments: string;
    attachments: string[];
    color?: 'teal' | 'cyan' | 'indigo' | 'deepPurple' | 'pink' | 'amber';
    missionId?: string; // Adicione esta linha
    missionTitle?: string;
}
