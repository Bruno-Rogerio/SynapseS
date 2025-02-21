export interface Task {
    id: string;
    title: string;
    status: 'pendente' | 'em-progresso' | 'concluida';
    assignedTo: string;
}

export interface MissionData {
    id: string;
    title: string;
    description: string;
    leader: string;
    members: string[];
    tasks: Task[];
    startDate: Date;
    endDate?: Date;
}

export class Mission {
    private data: MissionData;

    constructor(data: MissionData) {
        this.data = data;
    }

    get id() {
        return this.data.id;
    }

    get title() {
        return this.data.title;
    }

    get description() {
        return this.data.description;
    }

    get leader() {
        return this.data.leader;
    }

    get members() {
        return this.data.members;
    }

    get tasks() {
        return this.data.tasks;
    }

    addTask(task: Task) {
        this.data.tasks.push(task);
    }

    updateTaskStatus(taskId: string, status: 'pendente' | 'em-progresso' | 'concluida') {
        const task = this.data.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
        }
    }

    get progress(): number {
        if (this.data.tasks.length === 0) return 0;
        const completed = this.data.tasks.filter(t => t.status === 'concluida').length;
        return Math.round((completed / this.data.tasks.length) * 100);
    }

    toJSON() {
        return {
            ...this.data,
            progress: this.progress
        };
    }
}
