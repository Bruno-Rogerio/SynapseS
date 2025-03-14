// frontend/src/components/TaskMissionManager/MissionDetails.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    Divider,
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
    Avatar,
    AvatarGroup,
    Card,
    CardContent,
    Badge,
    alpha,
    Tabs,
    Tab,
    CircularProgress,
    useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import { Mission, User, Checkpoint } from '../../types';
import MissionChat from './MissionChat';
import CheckpointForm from './CheckpointForm';
import MissionEditForm from './MissionEditForm';
import { useAuth } from '../../hooks/useAuth';
import { v4 as uuidv4 } from 'uuid';
import { isPast, format, differenceInDays } from 'date-fns';
// Removido o import não utilizado
// import { ptBR } from 'date-fns/locale';
// Ícones
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import FlagIcon from '@mui/icons-material/Flag';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import TodayIcon from '@mui/icons-material/Today';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import StarIcon from '@mui/icons-material/Star';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida' | 'concluída';

export interface MissionDetailsProps {
    mission: Mission;
    users: User[];
    onDelete: (missionId: string) => void;
    onClose: () => void;
    onEditMission: (mission: Mission) => void;
    onDeleteCheckpoint: (missionId: string, checkpointId: string) => Promise<void>;
}

const TabPanel = (props: { children?: React.ReactNode; value: number; index: number }) => {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`mission-tabpanel-${index}`}
            aria-labelledby={`mission-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ py: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
};

// Componente principal
const MissionDetails: React.FC<MissionDetailsProps> = ({
    mission,
    users,
    onDelete,
    onClose,
    onEditMission,
    onDeleteCheckpoint,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();

    // Estados
    const [isCheckpointFormOpen, setIsCheckpointFormOpen] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
    const [localMission, setLocalMission] = useState<Mission>(mission);
    const [isEditFormOpen, setIsEditFormOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0);

    // Dados derivados (memos)
    const missionCheckpoints = useMemo(() =>
        Array.isArray(localMission.checkpoints) ? localMission.checkpoints : []
        , [localMission.checkpoints]);

    // Efeitos
    useEffect(() => {
        setLocalMission(mission);
    }, [mission]);

    // Funções utilitárias
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

    // Mais dados derivados
    const progress = useMemo(() =>
        missionCheckpoints.length > 0
            ? Math.round(
                (missionCheckpoints.filter(cp => convertStatus(cp.status as MissionStatus) === 'completed').length /
                    missionCheckpoints.length) * 100
            )
            : 0
        , [missionCheckpoints, convertStatus]);

    // Correção: adicionando company e permissions
    const teamMembers = useMemo(() => users
        .filter(u => localMission.members?.includes(u._id) || u._id === localMission.leader)
        .map(u => ({
            _id: u._id,
            username: u.username,
            email: u.email,
            role: u.role,
            avatar: u.avatar,
            company: u.company,          // Propriedade adicionada
            permissions: u.permissions,  // Propriedade adicionada
            roleData: u.roleData,        // Opcional: adicionando roleData se existir
            isLeader: u._id === localMission.leader
        }))
        , [users, localMission.members, localMission.leader]);

    const leaderUser = useMemo(() => {
        return users.find(u => u._id === localMission.leader);
    }, [users, localMission.leader]);

    const statusColor = useMemo(() => {
        const status = convertStatus(localMission.status as MissionStatus);
        switch (status) {
            case 'completed': return theme.palette.success.main;
            case 'in_progress': return theme.palette.info.main;
            default: return theme.palette.warning.main;
        }
    }, [localMission.status, convertStatus, theme.palette]);

    const statusIcon = useMemo(() => {
        const status = convertStatus(localMission.status as MissionStatus);
        switch (status) {
            case 'completed': return <CheckCircleIcon />;
            case 'in_progress': return <PlayCircleOutlineIcon />;
            default: return <RadioButtonUncheckedIcon />;
        }
    }, [localMission.status, convertStatus]);

    const timeInfo = useMemo(() => {
        const startDate = new Date(localMission.startDate);
        const endDate = new Date(localMission.endDate);
        const now = new Date();
        const isOverdue = isPast(endDate) && convertStatus(localMission.status as MissionStatus) !== 'completed';
        const daysLeft = differenceInDays(endDate, now);
        const totalDays = differenceInDays(endDate, startDate);
        const elapsedPercentage = totalDays > 0
            ? Math.min(100, Math.max(0, 100 - (daysLeft / totalDays * 100)))
            : 0;

        // Corrigido: usando apenas 2 argumentos
        const formattedStartDate = format(startDate, 'dd MMM yyyy');
        const formattedEndDate = format(endDate, 'dd MMM yyyy');

        return {
            startDate,
            endDate,
            isOverdue,
            daysLeft: Math.abs(daysLeft),
            formattedStartDate,
            formattedEndDate,
            timeRemaining: isOverdue
                ? `${Math.abs(daysLeft)} dias atrasado`
                : daysLeft === 0
                    ? "Vence hoje"
                    : `${daysLeft} dias restantes`,
            elapsedPercentage
        };
    }, [localMission.startDate, localMission.endDate, localMission.status, convertStatus]);

    // Manipuladores de eventos
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
        }
    }, [localMission, onEditMission, onDeleteCheckpoint]);

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

    const handleChangeTab = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    // Funções de renderização
    const getStatusIcon = useCallback((status: 'pending' | 'in_progress' | 'completed') => {
        switch (status) {
            case 'completed':
                return <CheckCircleOutlineIcon color="success" />;
            case 'in_progress':
                return <PlayCircleOutlineIcon color="info" />;
            default:
                return <RadioButtonUncheckedIcon color="action" />;
        }
    }, []);

    const getStatusColor = (status: 'pending' | 'in_progress' | 'completed') => {
        switch (status) {
            case 'completed': return theme.palette.success.main;
            case 'in_progress': return theme.palette.info.main;
            case 'pending': return theme.palette.warning.main;
            default: return theme.palette.grey[500];
        }
    };

    // Se missão não for encontrada
    if (!localMission) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <Paper sx={{ p: 4, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h6" color="text.secondary">Missão não encontrada</Typography>
                </Paper>
            </Box>
        );
    }

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            sx={{
                borderRadius: 3,
                bgcolor: 'background.paper',
                maxHeight: '85vh',
                width: '85vw',
                maxWidth: 1200,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                boxShadow: theme.shadows[10]
            }}
        >
            {/* Cabeçalho colorido */}
            <Box
                sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    p: 3,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Padrão de fundo decorativo */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        opacity: 0.1,
                        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
                        backgroundSize: '20px 20px',
                    }}
                />
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box>
                            <Typography variant="overline" fontWeight="bold" sx={{ opacity: 0.8 }}>
                                Detalhes da Missão
                            </Typography>
                            <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                                {localMission.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Chip
                                    icon={React.cloneElement(statusIcon, { style: { color: 'inherit' } })}
                                    label={translateStatus(convertStatus(localMission.status as MissionStatus))}
                                    sx={{
                                        bgcolor: alpha('#fff', 0.2),
                                        color: 'white',
                                        fontWeight: 'medium',
                                        '& .MuiChip-icon': { color: 'inherit' }
                                    }}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccessTimeIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.8 }} />
                                    <Typography variant="body2" fontWeight="medium" sx={{ opacity: 0.9 }}>
                                        {timeInfo.isOverdue ? (
                                            <span style={{ color: theme.palette.error.light }}>{timeInfo.timeRemaining}</span>
                                        ) : (
                                            timeInfo.timeRemaining
                                        )}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <IconButton
                            onClick={onClose}
                            sx={{
                                color: 'white',
                                bgcolor: alpha('#fff', 0.2),
                                '&:hover': { bgcolor: alpha('#fff', 0.3) },
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Box>
            {/* Barra de progresso */}
            <Box sx={{ position: 'relative', height: 8, bgcolor: alpha(theme.palette.primary.main, 0.2) }}>
                <Box
                    sx={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${progress}%`,
                        bgcolor: theme.palette.primary.main,
                        transition: 'width 0.8s ease-in-out'
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        left: `${timeInfo.elapsedPercentage}%`,
                        top: -10,
                        transform: 'translateX(-50%)',
                        width: 4,
                        height: 28,
                        bgcolor: timeInfo.isOverdue ? theme.palette.error.main : theme.palette.common.black,
                        opacity: timeInfo.isOverdue ? 1 : 0.6,
                        zIndex: 2
                    }}
                />
                <Tooltip
                    title={`Tempo decorrido: ${Math.round(timeInfo.elapsedPercentage)}%`}
                    placement="top"
                    arrow
                >
                    <Box
                        sx={{
                            position: 'absolute',
                            left: `${timeInfo.elapsedPercentage}%`,
                            top: -3,
                            transform: 'translateX(-50%)',
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            bgcolor: timeInfo.isOverdue ? theme.palette.error.main : theme.palette.common.black,
                            opacity: timeInfo.isOverdue ? 1 : 0.6,
                            zIndex: 3,
                            border: '2px solid white'
                        }}
                    />
                </Tooltip>
            </Box>
            <Box
                sx={{
                    flexGrow: 1,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* Tabs de navegação */}
                <Tabs
                    value={tabValue}
                    onChange={handleChangeTab}
                    variant="fullWidth"
                    sx={{
                        borderBottom: 1,
                        borderColor: 'divider',
                        '& .MuiTab-root': {
                            minHeight: 64,
                            fontWeight: 'medium',
                            textTransform: 'none',
                        },
                        '& .Mui-selected': {
                            color: theme.palette.primary.main,
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: theme.palette.primary.main,
                        }
                    }}
                >
                    <Tab
                        icon={<InfoIcon />}
                        iconPosition="start"
                        label="Visão Geral"
                        id="mission-tab-0"
                        aria-controls="mission-tabpanel-0"
                    />
                    <Tab
                        icon={<FlagIcon />}
                        iconPosition="start"
                        label={`Checkpoints (${missionCheckpoints.length})`}
                        id="mission-tab-1"
                        aria-controls="mission-tabpanel-1"
                    />
                    <Tab
                        icon={<GroupIcon />}
                        iconPosition="start"
                        label={`Equipe (${teamMembers.length})`}
                        id="mission-tab-2"
                        aria-controls="mission-tabpanel-2"
                    />
                </Tabs>
                {/* Conteúdo das tabs */}
                <TabPanel value={tabValue} index={0}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <InfoIcon color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="h6" fontWeight="medium">Informações</Typography>
                                    </Box>
                                    {localMission.description && (
                                        <Box sx={{ mb: 3, mt: 2 }}>
                                            <Typography variant="body1" paragraph>
                                                {localMission.description}
                                            </Typography>
                                        </Box>
                                    )}
                                    <Grid container spacing={3}>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Período
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CalendarTodayIcon fontSize="small" color="action" />
                                                    <Typography variant="body2">
                                                        {timeInfo.formattedStartDate} até {timeInfo.formattedEndDate}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Progresso
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CircularProgress
                                                        variant="determinate"
                                                        value={progress}
                                                        size={24}
                                                        thickness={4}
                                                        sx={{
                                                            color: progress === 100 ? theme.palette.success.main :
                                                                progress > 50 ? theme.palette.info.main :
                                                                    theme.palette.warning.main,
                                                            mr: 1
                                                        }}
                                                    />
                                                    <Typography variant="body2">
                                                        {progress}% concluído
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Status
                                                </Typography>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        color: statusColor,
                                                        fontWeight: 'medium'
                                                    }}
                                                >
                                                    {React.cloneElement(statusIcon, { fontSize: 'small', style: { marginRight: 8 } })}
                                                    <Typography variant="body2" fontWeight="medium" color="inherit">
                                                        {translateStatus(convertStatus(localMission.status as MissionStatus))}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                                    Checkpoints
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                    <FlagIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                                    <Typography variant="body2">
                                                        {missionCheckpoints.filter(cp => convertStatus(cp.status as MissionStatus) === 'completed').length} de {missionCheckpoints.length} concluídos
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card elevation={0} variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <GroupIcon color="primary" sx={{ mr: 1 }} />
                                        <Typography variant="h6" fontWeight="medium">Equipe</Typography>
                                    </Box>
                                    <Box sx={{ mb: 3, mt: 2 }}>
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Líder
                                        </Typography>
                                        {leaderUser ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                <Badge
                                                    overlap="circular"
                                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                    badgeContent={
                                                        <StarIcon
                                                            sx={{
                                                                fontSize: 14,
                                                                color: 'white',
                                                                bgcolor: theme.palette.primary.main,
                                                                borderRadius: '50%',
                                                                p: 0.2,
                                                                border: `2px solid ${theme.palette.background.paper}`
                                                            }}
                                                        />
                                                    }
                                                >
                                                    <Avatar
                                                        src={leaderUser.avatar}
                                                        alt={leaderUser.username}
                                                        sx={{ width: 48, height: 48 }}
                                                    >
                                                        {leaderUser.username.charAt(0)}
                                                    </Avatar>
                                                </Badge>
                                                <Box>
                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                        {leaderUser.username}
                                                    </Typography>
                                                    {leaderUser.email && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {leaderUser.email}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Sem líder definido
                                            </Typography>
                                        )}
                                        <Divider sx={{ my: 2 }} />
                                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                            Membros
                                        </Typography>
                                        {teamMembers.length > 1 ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <AvatarGroup max={5} sx={{ justifyContent: 'flex-start' }}>
                                                    {teamMembers.filter(member => !member.isLeader).map(member => (
                                                        <Tooltip key={member._id} title={member.username}>
                                                            <Avatar src={member.avatar} alt={member.username}>
                                                                {member.username.charAt(0)}
                                                            </Avatar>
                                                        </Tooltip>
                                                    ))}
                                                </AvatarGroup>
                                                <Button
                                                    size="small"
                                                    onClick={() => setTabValue(2)}
                                                    startIcon={<GroupIcon />}
                                                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                                                >
                                                    Ver equipe completa
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                Sem outros membros na equipe
                                            </Typography>
                                        )}
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12}>
                            <Card elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                            <AssignmentTurnedInIcon color="primary" sx={{ mr: 1 }} />
                                            <Typography variant="h6" fontWeight="medium">Checkpoints Recentes</Typography>
                                        </Box>
                                        <Button
                                            variant="outlined"
                                            size="small"
                                            startIcon={<FlagIcon />}
                                            onClick={() => setTabValue(1)}
                                        >
                                            Ver todos
                                        </Button>
                                    </Box>
                                    {missionCheckpoints.length > 0 ? (
                                        <List disablePadding sx={{ mt: 1 }}>
                                            {missionCheckpoints.slice(0, 3).map((checkpoint) => {
                                                const status = convertStatus(checkpoint.status as MissionStatus);
                                                return (
                                                    <ListItem
                                                        key={checkpoint.id}
                                                        sx={{
                                                            py: 1,
                                                            mb: 1,
                                                            borderRadius: 1,
                                                            bgcolor: alpha(getStatusColor(status), 0.05),
                                                            border: `1px solid ${alpha(getStatusColor(status), 0.1)}`,
                                                            '&:hover': { bgcolor: alpha(getStatusColor(status), 0.1) },
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handleCheckpointClick(checkpoint)}
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 40, color: getStatusColor(status) }}>
                                                            {getStatusIcon(status)}
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={checkpoint.title}
                                                            secondary={
                                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                    <Typography variant="caption" color="text.secondary">
                                                                        Entrega: {format(new Date(checkpoint.dueDate), 'dd/MM/yyyy')} · {translateStatus(status)}
                                                                    </Typography>
                                                                    {checkpoint.assignedTo && (
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                                            <Avatar
                                                                                src={users.find(u => u._id === checkpoint.assignedTo)?.avatar}
                                                                                alt="Responsável"
                                                                                sx={{ width: 16, height: 16, mr: 0.5 }}
                                                                            >
                                                                                {(users.find(u => u._id === checkpoint.assignedTo)?.username || 'U').charAt(0)}
                                                                            </Avatar>
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                {users.find(u => u._id === checkpoint.assignedTo)?.username || 'N/A'}
                                                                            </Typography>
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            }
                                                        />
                                                        <Box sx={{ mr: 1, color: getStatusColor(status) }}>
                                                            <ExpandMoreIcon fontSize="small" />
                                                        </Box>
                                                    </ListItem>
                                                );
                                            })}
                                        </List>
                                    ) : (
                                        <Box sx={{ p: 3, textAlign: 'center' }}>
                                            <HourglassEmptyIcon color="disabled" sx={{ fontSize: 40, mb: 1 }} />
                                            <Typography variant="body2" color="text.secondary">
                                                Nenhum checkpoint foi criado ainda
                                            </Typography>
                                            {user?._id === localMission.leader && (
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<AddCircleOutlineIcon />}
                                                    onClick={() => {
                                                        setSelectedCheckpoint(null);
                                                        setIsCheckpointFormOpen(true);
                                                    }}
                                                    sx={{ mt: 2 }}
                                                >
                                                    Criar Primeiro Checkpoint
                                                </Button>
                                            )}
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight="medium">
                                Checkpoints da Missão
                            </Typography>
                            {user?._id === localMission.leader && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddCircleOutlineIcon />}
                                    onClick={() => {
                                        setSelectedCheckpoint(null);
                                        setIsCheckpointFormOpen(true);
                                    }}
                                    size="small"
                                >
                                    Novo Checkpoint
                                </Button>
                            )}
                        </Box>
                        <Grid container spacing={2}>
                            {missionCheckpoints.length > 0 ? (
                                missionCheckpoints.map((checkpoint) => {
                                    const status = convertStatus(checkpoint.status as MissionStatus);
                                    const assignedUser = users.find(u => u._id === checkpoint.assignedTo);
                                    return (
                                        <Grid item xs={12} sm={6} md={4} key={checkpoint.id}>
                                            <Card
                                                elevation={0}
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 2,
                                                    transition: 'all 0.2s',
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        borderColor: getStatusColor(status),
                                                        boxShadow: `0 4px 12px ${alpha(getStatusColor(status), 0.2)}`
                                                    }
                                                }}
                                                onClick={() => handleCheckpointClick(checkpoint)}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, alignItems: 'center' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <Box sx={{ mr: 1, color: getStatusColor(status) }}>
                                                                {getStatusIcon(status)}
                                                            </Box>
                                                            <Typography variant="subtitle1" fontWeight="medium">
                                                                {checkpoint.title}
                                                            </Typography>
                                                        </Box>
                                                        {user?._id === localMission.leader && (
                                                            <Tooltip title="Excluir checkpoint">
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDeleteCheckpoint(checkpoint.id);
                                                                    }}
                                                                    sx={{
                                                                        color: theme.palette.grey[500],
                                                                        '&:hover': {
                                                                            color: theme.palette.error.main,
                                                                        },
                                                                    }}
                                                                >
                                                                    <DeleteOutlineIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                    <Box sx={{ mb: 2 }}>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: 1,
                                                                color: getStatusColor(status),
                                                                fontWeight: 'medium',
                                                                fontSize: '0.875rem',
                                                                mt: 1
                                                            }}
                                                        >
                                                            {translateStatus(status)}
                                                        </Box>
                                                    </Box>
                                                    <Divider sx={{ my: 1.5 }} />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                            <TodayIcon fontSize="small" sx={{ color: 'text.secondary', mr: 0.5 }} />
                                                            <Typography variant="caption" color="text.secondary">
                                                                {format(new Date(checkpoint.dueDate), 'dd/MM/yyyy')}
                                                            </Typography>
                                                        </Box>
                                                        {assignedUser && (
                                                            <Tooltip title={`Responsável: ${assignedUser.username}`}>
                                                                <Avatar
                                                                    src={assignedUser.avatar}
                                                                    alt={assignedUser.username}
                                                                    sx={{ width: 24, height: 24 }}
                                                                >
                                                                    {assignedUser.username.charAt(0)}
                                                                </Avatar>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })
                            ) : (
                                <Grid item xs={12}>
                                    <Box sx={{
                                        p: 4,
                                        textAlign: 'center',
                                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                                        borderRadius: 2
                                    }}>
                                        <HourglassEmptyIcon color="disabled" fontSize="large" sx={{ mb: 2 }} />
                                        <Typography variant="h6" gutterBottom>
                                            Esta missão não possui checkpoints
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" paragraph>
                                            Checkpoints ajudam a dividir a missão em etapas e acompanhar o progresso
                                        </Typography>
                                        {user?._id === localMission.leader && (
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                startIcon={<AddCircleOutlineIcon />}
                                                onClick={() => {
                                                    setSelectedCheckpoint(null);
                                                    setIsCheckpointFormOpen(true);
                                                }}
                                                sx={{ mt: 1 }}
                                            >
                                                Criar Primeiro Checkpoint
                                            </Button>
                                        )}
                                    </Box>
                                </Grid>
                            )}
                        </Grid>
                    </Box>
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                    <Box>
                        <Typography variant="h6" fontWeight="medium" gutterBottom>
                            Equipe da Missão
                        </Typography>
                        <Grid container spacing={3} sx={{ mt: 1 }}>
                            {/* Líder da equipe */}
                            {leaderUser && (
                                <Grid item xs={12}>
                                    <Card
                                        elevation={0}
                                        variant="outlined"
                                        sx={{
                                            borderRadius: 2,
                                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                                            borderColor: alpha(theme.palette.primary.main, 0.3),
                                            mb: 2
                                        }}
                                    >
                                        <CardContent>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                <Badge
                                                    overlap="circular"
                                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                                    badgeContent={
                                                        <StarIcon
                                                            sx={{
                                                                fontSize: 16,
                                                                color: 'white',
                                                                bgcolor: theme.palette.primary.main,
                                                                borderRadius: '50%',
                                                                p: 0.3,
                                                                border: `2px solid ${theme.palette.background.paper}`
                                                            }}
                                                        />
                                                    }
                                                >
                                                    <Avatar
                                                        src={leaderUser.avatar}
                                                        alt={leaderUser.username}
                                                        sx={{ width: 56, height: 56 }}
                                                    >
                                                        {leaderUser.username.charAt(0)}
                                                    </Avatar>
                                                </Badge>
                                                <Box sx={{ flexGrow: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                        <Typography variant="subtitle1" fontWeight="medium">
                                                            {leaderUser.username}
                                                        </Typography>
                                                        <Chip
                                                            label="Líder"
                                                            size="small"
                                                            color="primary"
                                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                                        />
                                                    </Box>
                                                    {leaderUser.email && (
                                                        <Typography variant="body2" color="text.secondary">
                                                            {leaderUser.email}
                                                        </Typography>
                                                    )}
                                                    {leaderUser.role && (
                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                            Função: {leaderUser.role}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            )}
                            {/* Membros da equipe */}
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
                                    Membros da Equipe
                                </Typography>
                                <Grid container spacing={2}>
                                    {teamMembers.filter(member => !member.isLeader).length > 0 ? (
                                        teamMembers
                                            .filter(member => !member.isLeader)
                                            .map(member => (
                                                <Grid item xs={12} sm={6} md={4} key={member._id}>
                                                    <Card elevation={0} variant="outlined" sx={{ borderRadius: 2 }}>
                                                        <CardContent>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                                <Avatar
                                                                    src={member.avatar}
                                                                    alt={member.username}
                                                                    sx={{ width: 48, height: 48 }}
                                                                >
                                                                    {member.username.charAt(0)}
                                                                </Avatar>
                                                                <Box>
                                                                    <Typography variant="subtitle2" fontWeight="medium">
                                                                        {member.username}
                                                                    </Typography>
                                                                    {member.email && (
                                                                        <Typography variant="body2" color="text.secondary">
                                                                            {member.email}
                                                                        </Typography>
                                                                    )}
                                                                    {member.role && (
                                                                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                                                            Função: {member.role}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            ))
                                    ) : (
                                        <Grid item xs={12}>
                                            <Box
                                                sx={{
                                                    p: 3,
                                                    textAlign: 'center',
                                                    borderRadius: 2,
                                                    bgcolor: alpha(theme.palette.divider, 0.05)
                                                }}
                                            >
                                                <Typography color="text.secondary">
                                                    Não há outros membros além do líder.
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </Grid>
                        </Grid>
                    </Box>
                </TabPanel>
            </Box>
            {/* Barra de ações */}
            <Box
                sx={{
                    p: 2,
                    borderTop: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}
            >
                <Box>
                    <Button
                        variant="text"
                        color="inherit"
                        onClick={onClose}
                        sx={{ mr: 1 }}
                    >
                        Fechar
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => onDelete(localMission._id)}
                        size="small"
                    >
                        Excluir
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<EditIcon />}
                        onClick={handleEditMission}
                        size={isMobile ? "small" : "medium"}
                    >
                        Editar Missão
                    </Button>
                </Box>
            </Box>
            {/* Botão flutuante de chat */}
            <Zoom in={true} style={{ transitionDelay: '500ms' }}>
                <Tooltip title="Abrir chat da missão" placement="left">
                    <Fab
                        color="primary"
                        size="medium"
                        onClick={() => setIsChatOpen(true)}
                        sx={{
                            position: 'absolute',
                            bottom: 74,
                            right: 16,
                            boxShadow: 3
                        }}
                    >
                        <ChatIcon />
                    </Fab>
                </Tooltip>
            </Zoom>
            {/* Modal de formulário de checkpoint */}
            <Dialog
                open={isCheckpointFormOpen}
                onClose={() => {
                    setIsCheckpointFormOpen(false);
                    setSelectedCheckpoint(null);
                }}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '16px',
                    },
                }}
            >
                <DialogTitle sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    py: 2,
                    bgcolor: selectedCheckpoint ? 'background.paper' : theme.palette.primary.main,
                    color: selectedCheckpoint ? 'text.primary' : 'white',
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <FlagIcon sx={{ mr: 1 }} />
                        {selectedCheckpoint ? 'Editar' : 'Criar Novo'} Checkpoint
                    </Box>
                    <IconButton
                        onClick={() => {
                            setIsCheckpointFormOpen(false);
                            setSelectedCheckpoint(null);
                        }}
                        sx={{
                            color: selectedCheckpoint ? 'text.secondary' : 'white',
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers>
                    <Box sx={{ py: 1 }}>
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
                    </Box>
                </DialogContent>
            </Dialog>
            {/* Modal de chat */}
            <Dialog
                open={isChatOpen}
                onClose={() => setIsChatOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '16px',
                        overflow: 'hidden',
                        height: '80vh',
                    },
                }}
            >
                <Box
                    sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
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
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ChatIcon sx={{ mr: 1 }} />
                            Chat da Missão: {localMission.title}
                        </Box>
                        <IconButton
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
                </Box>
            </Dialog>
            {/* Modal de edição de missão */}
            <Dialog
                open={isEditFormOpen}
                onClose={() => setIsEditFormOpen(false)}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    style: {
                        borderRadius: '16px',
                        overflow: 'hidden',
                    },
                }}
            >
                <DialogContent sx={{ p: 0 }}>
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

