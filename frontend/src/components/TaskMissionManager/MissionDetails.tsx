import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    List,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
} from '@mui/material';
import { Mission, User, Task } from '../../types';
import TaskForm from './TaskForm';

interface MissionDetailsProps {
    mission: Mission;
    users: User[];
    tasks: Task[];
    onDelete: () => void;
    onClose: () => void;
    onTaskClick: (task: Task) => void;
    onCreateTask: (task: Omit<Task, '_id'>) => void;
}

const MissionDetails: React.FC<MissionDetailsProps> = ({
    mission,
    users,
    tasks,
    onDelete,
    onClose,
    onTaskClick,
    onCreateTask,
}) => {
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

    const handleCreateTask = (newTask: Omit<Task, '_id'>) => {
        onCreateTask({ ...newTask, missionId: mission._id });
        setIsTaskFormOpen(false);
    };

    const missionTasks = tasks.filter(task => task.missionId === mission._id);

    return (
        <Box>
            <Typography variant="h5" gutterBottom>{mission.title}</Typography>
            <Typography variant="body1" paragraph>{mission.description}</Typography>

            <Typography variant="subtitle1">Líder:</Typography>
            <Chip label={users.find(u => u._id === mission.leader)?.username} sx={{ mb: 2 }} />

            <Typography variant="subtitle1">Equipe:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {mission.team.map(userId => (
                    <Chip key={userId} label={users.find(u => u._id === userId)?.username} />
                ))}
            </Box>

            <Typography variant="subtitle1">Período:</Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
                {new Date(mission.startDate).toLocaleDateString()} - {new Date(mission.endDate).toLocaleDateString()}
            </Typography>

            <Typography variant="subtitle1">Tarefas:</Typography>
            <List>
                {missionTasks.map(task => (
                    <ListItem
                        key={task._id}
                        onClick={() => onTaskClick(task)}
                        sx={{ cursor: 'pointer' }}
                    >
                        <ListItemText primary={task.title} secondary={`Status: ${task.status}`} />
                    </ListItem>
                ))}
            </List>

            <Button onClick={() => setIsTaskFormOpen(true)} variant="outlined" sx={{ mt: 2 }}>
                Adicionar Tarefa
            </Button>

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={onDelete} color="error" variant="contained">
                    Excluir Missão
                </Button>
                <Button onClick={onClose} variant="contained">
                    Fechar
                </Button>
            </Box>

            <Dialog open={isTaskFormOpen} onClose={() => setIsTaskFormOpen(false)}>
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
                <DialogContent>
                    <TaskForm
                        users={users}
                        onSubmit={handleCreateTask}
                        onClose={() => setIsTaskFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default MissionDetails;
