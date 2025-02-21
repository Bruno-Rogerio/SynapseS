// frontend/src/components/TaskMissionManager/MissionDetails.tsx
import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    Divider,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
} from '@mui/material';
import { Mission, User, Task } from '../../types';
import MissionChat from './MissionChat';
import TaskForm from './TaskForm';
import MissionTimelineCard from './MissionTimelineCard';
import { useAuth } from '../../hooks/useAuth';

interface MissionDetailsProps {
    mission: Mission;
    tasks: Task[]; // Lista completa das tarefas (detalhes)
    users: User[];
    onDelete: (missionId: string) => void;
    onClose: () => void;
    onTaskUpdate: (task: Task) => void;
    onTaskCreate: (task: Omit<Task, '_id' | 'missionId'>, missionId: string) => void;
    onEditMission: (mission: Mission) => void;
}

const MissionDetails: React.FC<MissionDetailsProps> = ({
    mission,
    tasks,
    users,
    onDelete,
    onClose,
    onTaskUpdate,
    onTaskCreate,
    onEditMission,
}) => {
    const { user } = useAuth();
    // Filtra as tarefas vinculadas à missão
    const missionTasks = tasks.filter(t => t.missionId === mission._id);
    const progress =
        missionTasks.length > 0
            ? Math.round((missionTasks.filter(t => t.status === 'completed').length / missionTasks.length) * 100)
            : 0;
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);

    return (
        <Box sx={{ p: 2, maxHeight: '90vh', overflowY: 'auto' }}>
            <Typography variant="h5" gutterBottom>{mission.title}</Typography>
            <Typography variant="body1" paragraph>{mission.description}</Typography>
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Líder:</Typography>
                <Chip label={users.find(u => u._id === mission.leader)?.username || 'N/A'} />
            </Box>
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Equipe:</Typography>
                {mission.team.map(userId => (
                    <Chip key={userId} label={users.find(u => u._id === userId)?.username || 'N/A'} sx={{ mr: 1, mb: 1 }} />
                ))}
            </Box>
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Período:</Typography>
                <Typography variant="body2">
                    {new Date(mission.startDate).toLocaleDateString()} - {new Date(mission.endDate).toLocaleDateString()}
                </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1">Progresso da Missão:</Typography>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5 }} />
                <Typography variant="body2" sx={{ mt: 1 }}>{progress}% concluído</Typography>
            </Box>
            {/* Aqui você pode incluir uma timeline detalhada – se preferir usar o mesmo MissionTimelineCard, ou criar outro layout */}
            <Typography variant="subtitle1" sx={{ mt: 2 }}>Tarefas da Missão:</Typography>
            {/* Utilizamos uma versão mais compacta da timeline para os detalhes */}
            <Box sx={{ mb: 2 }}>
                {missionTasks.map((task, index) => (
                    <Box key={task._id} sx={{ mb: 1, cursor: 'pointer' }} onClick={() => onTaskUpdate(task)}>
                        <Typography variant="body2">
                            {index + 1}. {task.title} ({task.status})
                        </Typography>
                    </Box>
                ))}
                {missionTasks.length === 0 && (
                    <Typography variant="caption">Sem tarefas</Typography>
                )}
            </Box>
            {(user?._id === mission.leader /* ou lógica de gestor */) && (
                <Button variant="outlined" onClick={() => setIsTaskFormOpen(true)} sx={{ mb: 2 }}>
                    + Criar Tarefa para Missão
                </Button>
            )}
            <Divider sx={{ my: 2 }} />
            <MissionChat missionId={mission._id} />
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="contained" color="error" onClick={() => onDelete(mission._id)}>
                    Excluir Missão
                </Button>
                <Button variant="contained" onClick={onClose}>
                    Fechar
                </Button>
            </Box>
            <Dialog open={isTaskFormOpen} onClose={() => setIsTaskFormOpen(false)}>
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
                <DialogContent>
                    <TaskForm
                        users={users}
                        onSubmit={(newTaskData) => {
                            onTaskCreate(newTaskData, mission._id);
                            setIsTaskFormOpen(false);
                        }}
                        onClose={() => setIsTaskFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default MissionDetails;
