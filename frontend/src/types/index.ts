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
    category: string;
    createdBy: string;
    tasks: Task[];
    comments: string;
    attachments: string[]; // Change to string[] to store file URLs
}

export interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    startDate: string;
    endDate: string;
    assignedTo: string;
    createdBy: string;
    points: number;
    comments: string;
    attachments: string[];
    color?: 'teal' | 'cyan' | 'indigo' | 'deepPurple' | 'pink' | 'amber';
}
