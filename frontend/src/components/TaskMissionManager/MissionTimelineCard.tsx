// frontend/src/components/TaskMissionManager/MissionTimelineCard.tsx
import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Button,
    LinearProgress,
    Chip,
    Avatar,
    Stack,
    Modal,
} from '@mui/material';
import { Mission, Task, User } from '../../types';
import { format } from 'date-fns';
import MissionChat from './MissionChat';

interface MissionTimelineCardProps {
    mission: Mission;
    tasks: Task[]; // Tarefas detalhadas vinculadas à missão
    users: User[];
    onEditMission: (mission: Mission) => void;
    onDeleteMission: (missionId: string) => void;
    onAddTask: (missionId: string) => void;
    onTaskClick: (task: Task) => void;
}

const statusColors: Record<Mission['status'], string> = {
    pending: 'rgba(255, 102, 102, 0.15)',
    in_progress: 'rgba(0, 175, 240, 0.15)',
    completed: 'rgba(29, 185, 84, 0.15)',
};

const MissionTimelineCard: React.FC<MissionTimelineCardProps> = ({
    mission,
    tasks,
    users,
    onEditMission,
    onDeleteMission,
    onAddTask,
    onTaskClick,
}) => {
    const [chatOpen, setChatOpen] = useState(false);

    // Filtra as tarefas vinculadas à missão
    const missionTasks = tasks.filter(task => task.missionId === mission._id);
    const progress =
        missionTasks.length > 0
            ? Math.round((missionTasks.filter(task => task.status === 'completed').length / missionTasks.length) * 100)
            : 0;

    // Configurações da timeline
    const timelineWidth = 320; // Largura ajustada para um layout compacto
    const taskCount = missionTasks.length;
    const taskPositions = missionTasks.map((task, index) => {
        const left = taskCount > 1 ? (index / (taskCount - 1)) * timelineWidth : timelineWidth / 2;
        return { ...task, left };
    });

    return (
        <>
            <Card
                sx={{
                    mb: 2,
                    mr: 2,
                    borderRadius: 2,
                    boxShadow: 3,
                    bgcolor: 'grey.50',
                    borderLeft: `5px solid ${statusColors[mission.status]}`,
                }}
            >
                <CardContent sx={{ p: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Typography variant="h6" noWrap sx={{ fontWeight: 600 }}>
                            {mission.title}
                        </Typography>
                        <Chip
                            label={
                                mission.status === 'pending'
                                    ? 'Pendente'
                                    : mission.status === 'in_progress'
                                        ? 'Em Progresso'
                                        : 'Concluída'
                            }
                            sx={{
                                bgcolor: statusColors[mission.status],
                                color: 'black',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                height: 24,
                            }}
                        />
                    </Stack>
                    <Typography variant="body2" sx={{ mb: 1 }} noWrap>
                        {mission.description}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Líder:
                        </Typography>
                        <Typography variant="body2">
                            {users.find(u => u._id === mission.leader)?.username || 'N/A'}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Período:
                        </Typography>
                        <Typography variant="body2">
                            {format(new Date(mission.startDate), 'dd/MM/yyyy')} - {format(new Date(mission.endDate), 'dd/MM/yyyy')}
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Equipe:
                        </Typography>
                        <Stack direction="row" spacing={0.5}>
                            {mission.team.map(userId => {
                                const member = users.find(u => u._id === userId);
                                return (
                                    <Avatar
                                        key={userId}
                                        sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                                        title={member?.username || 'N/A'}
                                    >
                                        {member?.username ? member.username.charAt(0).toUpperCase() : '?'}
                                    </Avatar>
                                );
                            })}
                        </Stack>
                    </Stack>
                    <Box sx={{ mb: 1 }}>
                        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                        <Typography variant="caption">{progress}% concluído</Typography>
                    </Box>
                    {/* Timeline Horizontal */}
                    <Box
                        sx={{
                            position: 'relative',
                            width: timelineWidth,
                            height: 50,
                            mx: 'auto',
                            mt: 2,
                            borderTop: '1px solid #ccc',
                        }}
                    >
                        {taskPositions.map(task => (
                            <Box
                                key={task._id}
                                sx={{
                                    position: 'absolute',
                                    top: -8,
                                    left: task.left,
                                    transform: 'translateX(-50%)',
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    bgcolor:
                                        task.status === 'pending'
                                            ? 'rgba(255, 102, 102, 0.15)'
                                            : task.status === 'in_progress'
                                                ? 'rgba(0, 175, 240, 0.15)'
                                                : 'rgba(29, 185, 84, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxShadow: 1,
                                }}
                                onClick={() => onTaskClick(task)}
                            >
                                <Typography variant="caption" sx={{ color: 'black', fontWeight: 600 }}>
                                    {task.status === 'pending' ? 'P' : task.status === 'in_progress' ? 'IP' : 'C'}
                                </Typography>
                            </Box>
                        ))}
                        {taskCount === 0 && (
                            <Typography
                                variant="caption"
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                Sem tarefas
                            </Typography>
                        )}
                        <Button
                            onClick={() => onAddTask(mission._id)}
                            variant="contained"
                            size="small"
                            sx={{
                                position: 'absolute',
                                right: -35,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                minWidth: 'unset',
                                p: 0.5,
                            }}
                        >
                            +
                        </Button>
                    </Box>
                    {/* Botões de ação */}
                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between' }}>
                        <Button variant="text" onClick={() => onEditMission(mission)} size="small">
                            Editar
                        </Button>
                        <Button variant="text" color="error" onClick={() => onDeleteMission(mission._id)} size="small">
                            Excluir
                        </Button>
                        <Button variant="text" onClick={() => setChatOpen(true)} size="small">
                            Comentar
                        </Button>
                    </Box>
                </CardContent>
            </Card>
            {/* Modal de chat */}
            <Modal open={chatOpen} onClose={() => setChatOpen(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        maxWidth: 500,
                        bgcolor: 'background.paper',
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 24,
                    }}
                >
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Chat - {mission.title}
                    </Typography>
                    <MissionChat missionId={mission._id} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                        <Button variant="contained" onClick={() => setChatOpen(false)}>
                            Fechar
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </>
    );
};

export default MissionTimelineCard;
