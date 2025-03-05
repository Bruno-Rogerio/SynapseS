// frontend/src/components/TaskMissionManager/MissionDetails.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Grid,
    IconButton,
    useTheme,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Tooltip,
    Fab,
    Zoom,
    Paper,
} from '@mui/material';
import { Mission, User, Checkpoint } from '../../types';
import MissionChat from './MissionChat';
import CheckpointForm from './CheckpointForm';
import MissionEditForm from './MissionEditForm';
import { useAuth } from '../../hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import FlagIcon from '@mui/icons-material/Flag';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida' | 'concluída';

export interface MissionDetailsProps {
    mission: Mission;
    users: User[];
    onDelete: (missionId: string) => void;
    onClose: () => void;
    onEditMission: (mission: Mission) => void;
    onDeleteCheckpoint: (missionId: string, checkpointId: string) => Promise<void>;
}

const MissionDetails: React.FC<MissionDetailsProps> = ({
    mission,
    users,
    onDelete,
    onClose,
    onEditMission,
    onDeleteCheckpoint,
}) => {
    const theme = useTheme();
    const { user } = useAuth();
    const [isCheckpointFormOpen, setIsCheckpointFormOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
    const [localMission, setLocalMission] = useState<Mission>(mission);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);

    useEffect(() => {
        setLocalMission(mission);
        console.log('Mission in MissionDetails:', mission);
        console.log('Users in MissionDetails:', users);
    }, [mission, users]);

    const convertStatus = useCallback((status: MissionStatus): 'pending' | 'in_progress' | 'completed' => {
        switch (status) {
            case 'pendente':
            case 'pending':
                return 'pending';
            case 'em-progresso':
            case 'in_progress':
                return 'in_progress';
            case 'concluida':
            case 'concluída':
            case 'completed':
                return 'completed';
            default:
                return 'pending';
        }
    }, []);

    const translateStatus = useCallback((status: 'pending' | 'in_progress' | 'completed') => {
        switch (status) {
            case 'pending': return 'Pendente';
            case 'in_progress': return 'Em Progresso';
            case 'completed': return 'Concluído';
            default: return status;
        }
    }, []);

    const handleDeleteCheckpoint = useCallback(async (checkpointId: string) => {
        try {
            await onDeleteCheckpoint(localMission._id, checkpointId);
            const updatedMission = {
                ...localMission,
                checkpoints: localMission.checkpoints.filter(cp => cp.id !== checkpointId),
            };
            setLocalMission(updatedMission);
            onEditMission(updatedMission);
        } catch (error) {
            console.error('Erro ao excluir checkpoint:', error);
            // Adicione uma notificação de erro aqui, se desejar
        }
    }, [localMission, onEditMission, onDeleteCheckpoint]);

    const missionCheckpoints = useMemo(() =>
        Array.isArray(localMission.checkpoints) ? localMission.checkpoints : []
        , [localMission.checkpoints]);

    const progress = useMemo(() =>
        missionCheckpoints.length > 0
            ? Math.round(
                (missionCheckpoints.filter(cp => convertStatus(cp.status as MissionStatus) === 'completed').length /
                    missionCheckpoints.length) * 100
            )
            : 0
        , [missionCheckpoints, convertStatus]);

    const teamMembers = useMemo(() => users
        .filter(u => localMission.members?.includes(u._id) || u._id === localMission.leader)
        .map(u => ({
            _id: u._id,
            username: u.username,
            email: u.email,
            role: u.role,
            isLeader: u._id === localMission.leader
        }))
        , [users, localMission.members, localMission.leader]);

    const handleCheckpointClick = useCallback((checkpoint: Checkpoint) => {
        setSelectedCheckpoint({
            ...checkpoint,
            status: convertStatus(checkpoint.status as MissionStatus)
        });
        setIsCheckpointFormOpen(true);
    }, [convertStatus]);

    const handleCheckpointSubmit = useCallback((checkpointData: Omit<Checkpoint, 'id'>) => {
        const newCheckpoint: Checkpoint = {
            id: selectedCheckpoint ? selectedCheckpoint.id : uuidv4(),
            ...checkpointData,
            status: ['pending', 'in_progress', 'completed'].includes(checkpointData.status)
                ? checkpointData.status
                : 'pending'
        };
        const updatedCheckpoints = selectedCheckpoint
            ? missionCheckpoints.map(cp => cp.id === selectedCheckpoint.id ? newCheckpoint : cp)
            : [...missionCheckpoints, newCheckpoint];
        const updatedMission = {
            ...localMission,
            checkpoints: updatedCheckpoints,
        };
        setLocalMission(updatedMission);
        onEditMission(updatedMission);
        setIsCheckpointFormOpen(false);
        setSelectedCheckpoint(null);
    }, [selectedCheckpoint, missionCheckpoints, localMission, onEditMission]);

    const getStatusIcon = useCallback((status: 'pending' | 'in_progress' | 'completed') => {
        switch (status) {
            case 'completed':
                return <CheckCircleOutlineIcon color="success" />;
            case 'in_progress':
                return <PlayCircleOutlineIcon color="primary" />;
            default:
                return <RadioButtonUncheckedIcon color="action" />;
        }
    }, []);

    const handleEditMission = () => {
        setIsEditFormOpen(true);
    };

    const handleEditFormSubmit = (updatedData: Partial<Mission>) => {
        const updatedMission = {
            ...localMission,
            ...updatedData,
            endDate: updatedData.endDate || localMission.endDate,
            status: updatedData.status || localMission.status,
        };
        setLocalMission(updatedMission);
        onEditMission(updatedMission);
        setIsEditFormOpen(false);
    };

    if (!localMission) {
        return <Typography>Missão não encontrada</Typography>;
    }

    console.log('Team members:', teamMembers);
    return (
        <Box
            sx={{
                p: 3,
                maxHeight: '80vh',
                width: '80vw',
                maxWidth: 1000,
                overflowY: 'auto',
                position: 'relative',
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: 3,
            }}
        >
            <IconButton
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                }}
            >
                <CloseIcon />
            </IconButton>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Typography variant="h5" gutterBottom color="primary">
                        {localMission.title}
                    </Typography>
                    <Typography variant="body2" paragraph>
                        {localMission.description}
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Líder:</Typography>
                        <Chip
                            size="small"
                            label={users.find(u => u._id === localMission.leader)?.username || 'N/A'}
                        />
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Equipe:</Typography>
                        {Array.isArray(localMission.members) && localMission.members.length > 0 ? (
                            localMission.members.map(userId => (
                                <Chip
                                    key={userId}
                                    size="small"
                                    label={users.find(u => u._id === userId)?.username || 'N/A'}
                                    sx={{ mr: 0.5, mb: 0.5 }}
                                />
                            ))
                        ) : (
                            <Typography variant="body2">Nenhum membro na equipe</Typography>
                        )}
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Período:</Typography>
                        <Typography variant="body2">
                            {new Date(localMission.startDate).toLocaleDateString()} -{' '}
                            {new Date(localMission.endDate).toLocaleDateString()}
                        </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Status da Missão:</Typography>
                        <Typography variant="body2">
                            {translateStatus(convertStatus(localMission.status as MissionStatus))}
                        </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">Progresso da Missão:</Typography>
                        <LinearProgress
                            variant="determinate"
                            value={progress}
                            sx={{ height: 8, borderRadius: 4, mt: 1 }}
                        />
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {progress}% concluído
                        </Typography>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Box sx={{ borderLeft: `1px solid ${theme.palette.divider}`, pl: 3, height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <FlagIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6" color="primary">
                                Checkpoints da Missão
                            </Typography>
                        </Box>
                        <List sx={{ mb: 2, maxHeight: '50vh', overflowY: 'auto' }}>
                            {missionCheckpoints.length > 0 ? (
                                missionCheckpoints.map((cp) => (
                                    <ListItem
                                        key={cp.id}
                                        sx={{
                                            mb: 1,
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: 'action.hover' },
                                            borderRadius: 1,
                                            border: `1px solid ${theme.palette.divider}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <Box
                                            onClick={() => handleCheckpointClick(cp)}
                                            sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}
                                        >
                                            <ListItemIcon>
                                                {getStatusIcon(convertStatus(cp.status as MissionStatus))}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={cp.title}
                                                secondary={
                                                    <>
                                                        Entrega: {new Date(cp.dueDate).toLocaleDateString()} ({translateStatus(convertStatus(cp.status as MissionStatus))})
                                                        {cp.assignedTo && ` - Responsável: ${users.find(u => u._id === cp.assignedTo)?.username || 'N/A'}`}
                                                    </>
                                                }
                                            />
                                        </Box>
                                        {user?._id === localMission.leader && (
                                            <Tooltip title="Excluir checkpoint">
                                                <IconButton
                                                    edge="end"
                                                    aria-label="delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteCheckpoint(cp.id);
                                                    }}
                                                    sx={{
                                                        color: theme.palette.grey[500],
                                                        '&:hover': {
                                                            color: theme.palette.error.main,
                                                        },
                                                    }}
                                                >
                                                    <DeleteOutlineIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </ListItem>
                                ))
                            ) : (
                                <Typography variant="caption">Sem checkpoints</Typography>
                            )}
                        </List>
                        {user?._id === localMission.leader && (
                            <Button
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setSelectedCheckpoint(null);
                                    setIsCheckpointFormOpen(true);
                                }}
                                sx={{ mb: 2 }}
                            >
                                + Criar Novo Checkpoint
                            </Button>
                        )}
                    </Box>
                </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={handleEditMission}
                    size="small"
                >
                    Editar
                </Button>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => onDelete(localMission._id)}
                    size="small"
                >
                    Excluir
                </Button>
            </Box>
            <Zoom in={true} style={{ transitionDelay: '500ms' }}>
                <Tooltip title="Abrir chat da missão" placement="left">
                    <Fab
                        color="primary"
                        size="medium"
                        onClick={() => setIsChatOpen(true)}
                        sx={{
                            position: 'absolute',
                            bottom: 16,
                            right: 16,
                            boxShadow: 3,
                        }}
                    >
                        <ChatIcon />
                    </Fab>
                </Tooltip>
            </Zoom>
            <Dialog
                open={isCheckpointFormOpen}
                onClose={() => {
                    setIsCheckpointFormOpen(false);
                    setSelectedCheckpoint(null);
                }}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '12px',
                    },
                }}
            >
                <DialogTitle>{selectedCheckpoint ? 'Editar Checkpoint' : 'Criar Novo Checkpoint'}</DialogTitle>
                <DialogContent>
                    <CheckpointForm
                        onSubmit={handleCheckpointSubmit}
                        onClose={() => {
                            setIsCheckpointFormOpen(false);
                            setSelectedCheckpoint(null);
                        }}
                        teamMembers={teamMembers}
                        missionStartDate={localMission.startDate}
                        missionEndDate={localMission.endDate}
                        initialCheckpoint={selectedCheckpoint || undefined}
                    />
                </DialogContent>
            </Dialog>
            <Dialog
                open={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '16px',
                        overflow: 'hidden',
                    },
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        height: '70vh',
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                    }}
                >
                    <DialogTitle sx={{
                        color: 'white',
                        fontWeight: 'bold',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                    }}>
                        Chat da Missão: {localMission.title}
                        <IconButton
                            aria-label="close"
                            onClick={() => setIsChatOpen(false)}
                            sx={{
                                color: 'white',
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        p: 0,
                        bgcolor: 'background.paper',
                    }}>
                        <MissionChat missionId={localMission._id} />
                    </DialogContent>
                </Paper>
            </Dialog>
            <Dialog
                open={isEditFormOpen}
                onClose={() => setIsEditFormOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '12px',
                    },
                }}
            >
                <DialogTitle>Editar Missão</DialogTitle>
                <DialogContent>
                    <MissionEditForm
                        mission={localMission}
                        users={users}
                        onSubmit={handleEditFormSubmit}
                        onClose={() => setIsEditFormOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default MissionDetails;
