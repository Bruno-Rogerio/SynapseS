// frontend/src/components/TaskMissionManager/MissionTimelineCard.tsx
import React, { useState, useMemo, useRef } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    LinearProgress,
    Chip,
    Avatar,
    Stack,
    Tooltip,
    useTheme,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    AvatarGroup,
    Paper,
    IconButton,
    alpha,
    Badge,
    Divider,
    Grid,
    ButtonBase,
    Button,
    Menu,
    MenuItem,
    Fade,
    Zoom,
    CardHeader,
    useMediaQuery,
    Collapse
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Mission, Checkpoint, User } from '../../types';
import { format, differenceInDays, isSameDay, startOfMonth, endOfMonth, addMonths, isToday, subMonths, isSameMonth, differenceInMonths } from 'date-fns';

// Icons
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PendingIcon from '@mui/icons-material/Pending';
import TodayIcon from '@mui/icons-material/Today';
import StarIcon from '@mui/icons-material/Star';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddTaskIcon from '@mui/icons-material/AddTask';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import PieChartIcon from '@mui/icons-material/PieChart';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import TimerIcon from '@mui/icons-material/Timer';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import QueryBuilderIcon from '@mui/icons-material/QueryBuilder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AddAlertIcon from '@mui/icons-material/AddAlert';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import TimelineIcon from '@mui/icons-material/Timeline';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';

type CheckpointStatus = 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida' | 'concluída';
type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida' | 'concluída';

// Helpers
const formatMonthYear = (date: Date): string => {
    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
};

const eachMonthOfInterval = (start: Date, end: Date): Date[] => {
    const months: Date[] = [];
    let currentDate = new Date(start);

    // Garantir que pelo menos o mês de início seja incluído
    if (differenceInMonths(end, start) < 1) {
        return [new Date(start)];
    }

    while (currentDate <= end) {
        months.push(new Date(currentDate));
        currentDate = addMonths(currentDate, 1);
    }
    return months;
};

const isCheckpointCompleted = (status: CheckpointStatus): boolean => {
    return ['completed', 'concluida', 'concluída'].includes(status);
};

const getStatusForCard = (status: MissionStatus): "pendente" | "em-progresso" | "concluida" => {
    switch (status) {
        case "pending":
        case "pendente":
            return "pendente";
        case "in_progress":
        case "em-progresso":
            return "em-progresso";
        case "completed":
        case "concluida":
        case "concluída":
            return "concluida";
        default:
            return "pendente";
    }
};

const statusColors: Record<"pendente" | "em-progresso" | "concluida", string> = {
    pendente: '#FF9800', // Laranja
    'em-progresso': '#2196F3', // Azul
    concluida: '#4CAF50', // Verde
};

const statusGradients: Record<"pendente" | "em-progresso" | "concluida", string> = {
    pendente: 'linear-gradient(135deg, #FF9800 0%, #FFA726 100%)',
    'em-progresso': 'linear-gradient(135deg, #2196F3 0%, #42A5F5 100%)',
    concluida: 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)',
};

const statusBackgroundColors: Record<"pendente" | "em-progresso" | "concluida", string> = {
    pendente: 'rgba(255, 152, 0, 0.08)',
    'em-progresso': 'rgba(33, 150, 243, 0.08)',
    concluida: 'rgba(76, 175, 80, 0.08)',
};

const statusLabels: Record<"pendente" | "em-progresso" | "concluida", string> = {
    pendente: 'Pendente',
    'em-progresso': 'Em Progresso',
    concluida: 'Concluída',
};

const statusIcons: Record<"pendente" | "em-progresso" | "concluida", React.ReactElement> = {
    pendente: <PendingIcon />,
    'em-progresso': <ScheduleIcon />,
    concluida: <CheckCircleIcon />,
};

interface MissionTimelineCardProps {
    mission: Mission;
    users: User[];
    onEditMission: (mission: Mission) => void;
}

const eachDayOfInterval = ({ start, end }: { start: Date; end: Date }): Date[] => {
    const days: Date[] = [];
    let currentDay = new Date(start);
    while (currentDay <= end) {
        days.push(new Date(currentDay));
        currentDay.setDate(currentDay.getDate() + 1);
    }
    return days;
};

const isWithinInterval = (date: Date, { start, end }: { start: Date; end: Date }): boolean => {
    return date >= start && date <= end;
};

const MissionTimelineCard: React.FC<MissionTimelineCardProps> = ({
    mission,
    users,
    onEditMission,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    const [expanded, setExpanded] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [displayMonth, setDisplayMonth] = useState<Date>(new Date(mission.startDate));

    const missionCheckpoints: Checkpoint[] = mission.checkpoints || [];
    const missionStart = new Date(mission.startDate);
    const missionEnd = new Date(mission.endDate);

    // Total de meses na missão
    const totalMonths = Math.max(1, differenceInMonths(missionEnd, missionStart) + 1);
    const hasMultipleMonths = totalMonths > 1;

    // Progresso da missão baseado nos checkpoints concluídos
    const progress = useMemo(() =>
        missionCheckpoints.length > 0
            ? Math.round(
                (missionCheckpoints.filter(cp => isCheckpointCompleted(cp.status as CheckpointStatus)).length /
                    missionCheckpoints.length) *
                100
            )
            : 0
        , [missionCheckpoints]);

    const missionStatus = getStatusForCard(mission.status as MissionStatus);

    // Calcular dias restantes (negativos se a missão já passou)
    const today = new Date();
    const daysLeft = differenceInDays(missionEnd, today);

    // Verificar se a missão está atrasada (terminou mas não está completa)
    const isOverdue = daysLeft < 0 && missionStatus !== 'concluida';

    // Verificar se a missão está próxima de acabar (menos de 7 dias)
    const isNearDeadline = daysLeft >= 0 && daysLeft < 7 && missionStatus !== 'concluida';

    // Obter a inicial do líder para o avatar
    const getResponsibleInitial = (userId: string | undefined) => {
        if (!userId) return '?';
        const user = users.find(u => u._id === userId);
        return user ? user.username.charAt(0).toUpperCase() : '?';
    };

    // Encontrar o usuário líder
    const leaderUser = users.find(u => u._id === mission.leader);

    // Ordenar checkpoints por data
    const sortedCheckpoints = useMemo(() =>
        [...missionCheckpoints].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        , [missionCheckpoints]);

    // Checkpoints agrupados por status
    const checkpointsByStatus = useMemo(() => {
        const result = {
            completed: [] as Checkpoint[],
            inProgress: [] as Checkpoint[],
            pending: [] as Checkpoint[],
        };

        sortedCheckpoints.forEach(cp => {
            const status = cp.status as CheckpointStatus;
            if (isCheckpointCompleted(status)) {
                result.completed.push(cp);
            } else if (status === 'in_progress' || status === 'em-progresso') {
                result.inProgress.push(cp);
            } else {
                result.pending.push(cp);
            }
        });

        return result;
    }, [sortedCheckpoints]);

    // Checkpoints do mês exibido
    const currentMonthCheckpoints = useMemo(() =>
        sortedCheckpoints.filter(cp =>
            isSameMonth(new Date(cp.dueDate), displayMonth)
        )
        , [sortedCheckpoints, displayMonth]);

    // Equipe completa (líder + membros)
    const teamMembers = useMemo(() => {
        const teamIds = [...(mission.members || []), mission.leader].filter(Boolean);
        return users.filter(user => teamIds.includes(user._id));
    }, [mission.members, mission.leader, users]);

    // Funções para navegação do calendário
    const goToPreviousMonth = () => {
        setDisplayMonth(prev => {
            const newMonth = subMonths(prev, 1);
            // Não permitir retroceder antes do mês de início da missão
            return newMonth >= startOfMonth(missionStart) ? newMonth : prev;
        });
    };

    const goToNextMonth = () => {
        setDisplayMonth(prev => {
            const newMonth = addMonths(prev, 1);
            // Não permitir avançar além do mês de término da missão
            return newMonth <= endOfMonth(missionEnd) ? newMonth : prev;
        });
    };

    // Verificar se é possível navegar para os meses anterior/seguinte
    const canGoPrevious = !isSameMonth(displayMonth, startOfMonth(missionStart));
    const canGoNext = !isSameMonth(displayMonth, startOfMonth(missionEnd));

    // Estatísticas dos checkpoints
    const checkpointStats = {
        total: missionCheckpoints.length,
        completed: checkpointsByStatus.completed.length,
        inProgress: checkpointsByStatus.inProgress.length,
        pending: checkpointsByStatus.pending.length,
    };

    // Menu de opções
    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEditMission(mission);
        handleMenuClose();
    };

    const toggleTimeline = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowTimeline(!showTimeline);
        handleMenuClose();
    };

    // Renderização do mini calendário
    const renderMiniCalendar = () => {
        return (
            <Box
                sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 2,
                }}
            >
                {/* Cabeçalho do calendário com navegação */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 1.5,
                        pl: 1,
                        pr: 1,
                        py: 1,
                        borderRadius: '8px 8px 0 0',
                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                        boxShadow: `0 1px 2px ${alpha(theme.palette.divider, 0.15)}`,
                    }}
                >
                    <IconButton
                        size="small"
                        onClick={goToPreviousMonth}
                        disabled={!canGoPrevious}
                        sx={{
                            color: canGoPrevious ? theme.palette.primary.main : alpha(theme.palette.text.disabled, 0.3),
                            bgcolor: canGoPrevious ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                            '&:hover': {
                                bgcolor: canGoPrevious ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                            },
                        }}
                    >
                        <ArrowBackIosNewIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                    </IconButton>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CalendarViewMonthIcon sx={{ fontSize: '1rem', mr: 1, color: theme.palette.primary.main }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {formatMonthYear(displayMonth)}
                            {hasMultipleMonths && (
                                <Typography
                                    component="span"
                                    variant="caption"
                                    sx={{
                                        ml: 0.5,
                                        color: theme.palette.text.secondary,
                                        backgroundColor: alpha(theme.palette.background.default, 0.7),
                                        px: 0.5,
                                        py: 0.1,
                                        borderRadius: 1,
                                    }}
                                >
                                    {eachMonthOfInterval(missionStart, missionEnd).findIndex(
                                        m => isSameMonth(m, displayMonth)
                                    ) + 1}/{totalMonths}
                                </Typography>
                            )}
                        </Typography>
                    </Box>

                    <IconButton
                        size="small"
                        onClick={goToNextMonth}
                        disabled={!canGoNext}
                        sx={{
                            color: canGoNext ? theme.palette.primary.main : alpha(theme.palette.text.disabled, 0.3),
                            bgcolor: canGoNext ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
                            '&:hover': {
                                bgcolor: canGoNext ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                            },
                        }}
                    >
                        <ArrowForwardIosIcon fontSize="small" sx={{ fontSize: '0.8rem' }} />
                    </IconButton>
                </Box>

                {/* Grade do calendário */}
                <Box
                    sx={{
                        p: 1.5,
                        pt: 1,
                        bgcolor: alpha(theme.palette.background.paper, 0.4),
                        borderRadius: '0 0 8px 8px',
                        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        borderTop: 'none',
                        position: 'relative',
                    }}
                >
                    {/* Dias da semana */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: 0.5,
                            mb: 1,
                        }}
                    >
                        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                            <Typography
                                key={index}
                                variant="caption"
                                align="center"
                                sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    color: index === 0 || index === 6
                                        ? alpha(theme.palette.error.main, 0.7)  // Domingo e Sábado destacados
                                        : alpha(theme.palette.text.primary, 0.8),
                                    py: 0.5,
                                }}
                            >
                                {day}
                            </Typography>
                        ))}
                    </Box>

                    {/* Dias do mês */}
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(7, 1fr)',
                            gap: 0.7,
                            position: 'relative',
                        }}
                    >
                        {eachDayOfInterval({
                            start: startOfMonth(displayMonth),
                            end: endOfMonth(displayMonth)
                        }).map((day: Date, index: number) => {
                            const isInMission = isWithinInterval(day, { start: missionStart, end: missionEnd });
                            const checkpoints = sortedCheckpoints.filter(cp => isSameDay(new Date(cp.dueDate), day));
                            const isCurrentDay = isToday(day);

                            // Calcular posição de efeito de início/fim de missão
                            const isFirstDay = isSameDay(day, missionStart);
                            const isLastDay = isSameDay(day, missionEnd);

                            // Determinar o status visual para o dia (priorizar checkpoints concluídos)
                            let dayStatus: "pendente" | "em-progresso" | "concluida" = "pendente";

                            if (checkpoints.length > 0) {
                                // Se todos os checkpoints estiverem concluídos
                                if (checkpoints.every(cp => isCheckpointCompleted(cp.status as CheckpointStatus))) {
                                    dayStatus = "concluida";
                                }
                                // Se pelo menos um checkpoint estiver em progresso
                                else if (checkpoints.some(cp => (cp.status as CheckpointStatus) === 'in_progress' ||
                                    (cp.status as CheckpointStatus) === 'em-progresso')) {
                                    dayStatus = "em-progresso";
                                }
                            }

                            return (
                                <Tooltip
                                    key={day.getTime()}
                                    title={
                                        <Box>
                                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                                                {format(day, 'dd/MM/yyyy')}
                                                {isFirstDay && " - Início da missão"}
                                                {isLastDay && " - Fim da missão"}
                                            </Typography>

                                            {checkpoints.length > 0 ? (
                                                <Box component="ul" sx={{ m: 0, pl: 2, mt: 0.5 }}>
                                                    {checkpoints.map((cp, idx) => (
                                                        <Box component="li" key={idx} sx={{ fontSize: '0.7rem' }}>
                                                            {cp.title} - <Box component="span" sx={{
                                                                color: statusColors[getStatusForCard(cp.status as MissionStatus)],
                                                                fontWeight: 600
                                                            }}>
                                                                {statusLabels[getStatusForCard(cp.status as MissionStatus)]}
                                                            </Box>
                                                        </Box>
                                                    ))}
                                                </Box>
                                            ) : isInMission ? (
                                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                                                    Nenhum checkpoint hoje
                                                </Typography>
                                            ) : null}
                                        </Box>
                                    }
                                    arrow
                                    placement="top"
                                    componentsProps={{
                                        tooltip: {
                                            sx: {
                                                bgcolor: alpha(theme.palette.background.paper, 0.95),
                                                color: theme.palette.text.primary,
                                                boxShadow: theme.shadows[3],
                                                borderRadius: 1.5,
                                                p: 1,
                                                '& .MuiTooltip-arrow': {
                                                    color: alpha(theme.palette.background.paper, 0.95),
                                                },
                                            }
                                        }
                                    }}
                                >
                                    <Box
                                        component={motion.div}
                                        whileHover={isInMission ? { scale: 1.15, zIndex: 5 } : {}}
                                        whileTap={isInMission && checkpoints.length > 0 ? { scale: 0.95 } : {}}
                                        sx={{
                                            width: index === 0 ? 28 : 30,
                                            height: 30,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            position: 'relative',
                                            cursor: checkpoints.length > 0 ? 'pointer' : 'default',

                                            // Estilização baseada em condições
                                            bgcolor: isInMission
                                                ? checkpoints.length > 0
                                                    ? alpha(statusColors[dayStatus], isCurrentDay ? 0.8 : 0.5)
                                                    : isCurrentDay
                                                        ? alpha(theme.palette.primary.main, 0.15)
                                                        : isFirstDay || isLastDay
                                                            ? alpha(theme.palette.info.main, 0.15)
                                                            : alpha(theme.palette.background.paper, 0.6)
                                                : 'transparent',

                                            // Borda
                                            border: isInMission
                                                ? isCurrentDay
                                                    ? `2px solid ${theme.palette.primary.main}`
                                                    : checkpoints.length > 0
                                                        ? `1px solid ${statusColors[dayStatus]}`
                                                        : isFirstDay || isLastDay
                                                            ? `1px solid ${theme.palette.info.main}`
                                                            : `1px solid ${alpha(theme.palette.divider, 0.3)}`
                                                : 'none',

                                            // Texto
                                            color: isInMission
                                                ? checkpoints.length > 0
                                                    ? '#fff'  // Contraste com fundo colorido
                                                    : isCurrentDay
                                                        ? theme.palette.primary.main
                                                        : theme.palette.text.primary
                                                : alpha(theme.palette.text.disabled, 0.7),

                                            fontWeight: isCurrentDay || checkpoints.length > 0 || isFirstDay || isLastDay ? 600 : 400,
                                            boxShadow: checkpoints.length > 0 ? `0 2px 6px ${alpha(statusColors[dayStatus], 0.4)}` : 'none',

                                            // Efeitos de hover
                                            transition: 'all 0.2s ease-in-out',
                                            '&:hover': {
                                                boxShadow: isInMission
                                                    ? `0 3px 10px ${alpha(statusColors[dayStatus], 0.5)}`
                                                    : 'none',
                                            },
                                        }}
                                    >
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                fontSize: '0.75rem',
                                                lineHeight: 1,
                                            }}
                                        >
                                            {format(day, 'd')}
                                        </Typography>

                                        {/* Badge para múltiplos checkpoints */}
                                        {checkpoints.length > 1 && (
                                            <Badge
                                                badgeContent={checkpoints.length}
                                                color="error"
                                                sx={{
                                                    position: 'absolute',
                                                    top: -5,
                                                    right: -5,
                                                    '& .MuiBadge-badge': {
                                                        fontSize: '0.6rem',
                                                        height: 14,
                                                        minWidth: 14,
                                                        px: 0.5,
                                                    }
                                                }}
                                            />
                                        )}

                                        {/* Ícone de status para um checkpoint */}
                                        {checkpoints.length === 1 && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: -3,
                                                    right: -3,
                                                    width: 14,
                                                    height: 14,
                                                    borderRadius: '50%',
                                                    bgcolor: theme.palette.background.paper,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                            >
                                                {React.cloneElement(statusIcons[dayStatus], {
                                                    sx: { fontSize: '0.6rem', color: statusColors[dayStatus] }
                                                })}
                                            </Box>
                                        )}

                                        {/* Destaque para início/fim da missão */}
                                        {(isFirstDay || isLastDay) && checkpoints.length === 0 && (
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    bottom: -2,
                                                    right: -2,
                                                    width: 10,
                                                    height: 10,
                                                    borderRadius: '50%',
                                                    bgcolor: isFirstDay ? theme.palette.warning.main : theme.palette.success.main,
                                                }}
                                            />
                                        )}
                                    </Box>
                                </Tooltip>
                            );
                        })}
                    </Box>

                    {/* Indicador de checkpoints no mês atual */}
                    {currentMonthCheckpoints.length > 0 && (
                        <Box
                            sx={{
                                mt: 1.5,
                                px: 1,
                                py: 0.75,
                                borderRadius: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(theme.palette.background.paper, 0.7),
                                border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                            }}
                        >
                            <FlagIcon sx={{ fontSize: '0.9rem', color: theme.palette.primary.main, mr: 0.5 }} />
                            <Typography variant="caption" sx={{ fontWeight: 500 }}>
                                {currentMonthCheckpoints.length} checkpoint{currentMonthCheckpoints.length !== 1 ? 's' : ''} em {formatMonthYear(displayMonth)}
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        );
    };

    // Renderização da lista de checkpoints
    const renderCheckpointList = () => (
        <List
            sx={{
                maxHeight: 250,
                overflow: 'auto',
                borderRadius: 2,
                bgcolor: alpha(theme.palette.background.paper, 0.4),
                p: 0,
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '&::-webkit-scrollbar': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: alpha(theme.palette.divider, 0.1),
                    borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: '4px',
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.3),
                    },
                },
            }}
        >
            {sortedCheckpoints.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Nenhum checkpoint definido
                    </Typography>
                </Box>
            ) : (
                <>
                    {/* Checkpoints em progresso (prioridade) */}
                    {checkpointsByStatus.inProgress.length > 0 && (
                        <>
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1,
                                    bgcolor: alpha(statusColors['em-progresso'], 0.08),
                                    backgroundImage: `linear-gradient(to right, ${alpha(statusColors['em-progresso'], 0.12)}, transparent)`,
                                    borderTop: `1px solid ${alpha(statusColors['em-progresso'], 0.2)}`,
                                    borderBottom: `1px solid ${alpha(statusColors['em-progresso'], 0.2)}`,
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        color: statusColors['em-progresso'],
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontWeight: 600
                                    }}
                                >
                                    <ScheduleIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    Em Progresso ({checkpointsByStatus.inProgress.length})
                                </Typography>
                            </Box>

                            <AnimatePresence>
                                {checkpointsByStatus.inProgress.map((checkpoint) => (
                                    <motion.div
                                        key={checkpoint.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ListItem
                                            sx={{
                                                px: 2,
                                                py: 0.75,
                                                borderLeft: `3px solid ${statusColors['em-progresso']}`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: alpha(statusColors['em-progresso'], 0.05),
                                                }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 30 }}>
                                                <ScheduleIcon fontSize="small" sx={{ color: statusColors['em-progresso'] }} />
                                            </ListItemIcon>

                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {checkpoint.title}
                                                        </Typography>

                                                        <Chip
                                                            size="small"
                                                            label={format(new Date(checkpoint.dueDate), 'dd/MM')}
                                                            sx={{
                                                                height: 20,
                                                                '& .MuiChip-label': { px: 0.8, fontSize: '0.65rem', py: 0 },
                                                                bgcolor: alpha(statusColors['em-progresso'], 0.1),
                                                                color: statusColors['em-progresso'],
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </Box>
                                                }

                                                secondary={
                                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>
                                                        {checkpoint.description && (
                                                            <Box component="span" sx={{ display: 'block', mb: 0.3 }}>
                                                                {checkpoint.description.substring(0, 60)}
                                                                {checkpoint.description.length > 60 ? '...' : ''}
                                                            </Box>
                                                        )}

                                                        <Box component="span" sx={{
                                                            display: 'inline-block',
                                                            bgcolor: alpha(statusColors['em-progresso'], 0.1),
                                                            px: 0.5,
                                                            borderRadius: 0.5,
                                                            fontSize: '0.65rem',
                                                            color: statusColors['em-progresso'],
                                                        }}>
                                                            Em andamento
                                                        </Box>
                                                    </Typography>
                                                }
                                                secondaryTypographyProps={{
                                                    variant: 'caption',
                                                    component: 'div'
                                                }}
                                            />
                                        </ListItem>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </>
                    )}

                    {/* Checkpoints pendentes */}
                    {checkpointsByStatus.pending.length > 0 && (
                        <>
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1,
                                    bgcolor: alpha(statusColors.pendente, 0.08),
                                    backgroundImage: `linear-gradient(to right, ${alpha(statusColors.pendente, 0.12)}, transparent)`,
                                    borderTop: `1px solid ${alpha(statusColors.pendente, 0.2)}`,
                                    borderBottom: `1px solid ${alpha(statusColors.pendente, 0.2)}`,
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        color: statusColors.pendente,
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontWeight: 600
                                    }}
                                >
                                    <PendingIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    Pendentes ({checkpointsByStatus.pending.length})
                                </Typography>
                            </Box>

                            <AnimatePresence>
                                {checkpointsByStatus.pending.map((checkpoint) => (
                                    <motion.div
                                        key={checkpoint.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ListItem
                                            sx={{
                                                px: 2,
                                                py: 0.75,
                                                borderLeft: `3px solid ${statusColors.pendente}`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: alpha(statusColors.pendente, 0.05),
                                                }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 30 }}>
                                                <PendingIcon fontSize="small" sx={{ color: statusColors.pendente }} />
                                            </ListItemIcon>

                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {checkpoint.title}
                                                        </Typography>

                                                        <Chip
                                                            size="small"
                                                            label={format(new Date(checkpoint.dueDate), 'dd/MM')}
                                                            sx={{
                                                                height: 20,
                                                                '& .MuiChip-label': { px: 0.8, fontSize: '0.65rem', py: 0 },
                                                                bgcolor: alpha(statusColors.pendente, 0.1),
                                                                color: statusColors.pendente,
                                                                fontWeight: 600
                                                            }}
                                                        />
                                                    </Box>
                                                }

                                                secondary={
                                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: theme.palette.text.secondary }}>
                                                        {checkpoint.description && (
                                                            <Box component="span" sx={{ display: 'block', mb: 0.3 }}>
                                                                {checkpoint.description.substring(0, 60)}
                                                                {checkpoint.description.length > 60 ? '...' : ''}
                                                            </Box>
                                                        )}

                                                        {differenceInDays(new Date(checkpoint.dueDate), new Date()) < 0 ? (
                                                            <Box component="span" sx={{
                                                                display: 'inline-block',
                                                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                                                px: 0.5,
                                                                borderRadius: 0.5,
                                                                fontSize: '0.65rem',
                                                                color: theme.palette.error.main,
                                                            }}>
                                                                Atrasado
                                                            </Box>
                                                        ) : differenceInDays(new Date(checkpoint.dueDate), new Date()) <= 3 ? (
                                                            <Box component="span" sx={{
                                                                display: 'inline-block',
                                                                bgcolor: alpha(theme.palette.warning.main, 0.1),
                                                                px: 0.5,
                                                                borderRadius: 0.5,
                                                                fontSize: '0.65rem',
                                                                color: theme.palette.warning.main,
                                                            }}>
                                                                Próximo
                                                            </Box>
                                                        ) : null}
                                                    </Typography>
                                                }
                                                secondaryTypographyProps={{
                                                    variant: 'caption',
                                                    component: 'div'
                                                }}
                                            />
                                        </ListItem>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </>
                    )}

                    {/* Checkpoints concluídos */}
                    {checkpointsByStatus.completed.length > 0 && (
                        <>
                            <Box
                                sx={{
                                    px: 2,
                                    py: 1,
                                    bgcolor: alpha(statusColors.concluida, 0.08),
                                    backgroundImage: `linear-gradient(to right, ${alpha(statusColors.concluida, 0.12)}, transparent)`,
                                    borderTop: `1px solid ${alpha(statusColors.concluida, 0.2)}`,
                                    borderBottom: `1px solid ${alpha(statusColors.concluida, 0.2)}`,
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        color: statusColors.concluida,
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontWeight: 600
                                    }}
                                >
                                    <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    Concluídos ({checkpointsByStatus.completed.length})
                                </Typography>
                            </Box>

                            <AnimatePresence>
                                {checkpointsByStatus.completed.map((checkpoint) => (
                                    <motion.div
                                        key={checkpoint.id}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ListItem
                                            sx={{
                                                px: 2,
                                                py: 0.75,
                                                borderLeft: `3px solid ${statusColors.concluida}`,
                                                transition: 'all 0.2s ease',
                                                '&:hover': {
                                                    bgcolor: alpha(statusColors.concluida, 0.05),
                                                }
                                            }}
                                        >
                                            <ListItemIcon sx={{ minWidth: 30 }}>
                                                <CheckCircleIcon fontSize="small" sx={{ color: statusColors.concluida }} />
                                            </ListItemIcon>

                                            <ListItemText
                                                primary={
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 500, textDecoration: 'line-through' }}>
                                                            {checkpoint.title}
                                                        </Typography>

                                                        <Chip
                                                            size="small"
                                                            label={format(new Date(checkpoint.dueDate), 'dd/MM')}
                                                            sx={{
                                                                height: 20,
                                                                '& .MuiChip-label': { px: 0.8, fontSize: '0.65rem', py: 0 },
                                                                bgcolor: alpha(statusColors.concluida, 0.1),
                                                                color: alpha(statusColors.concluida, 0.8),
                                                                fontWeight: 500
                                                            }}
                                                        />
                                                    </Box>
                                                }

                                                secondary={
                                                    <Typography variant="caption" sx={{
                                                        fontSize: '0.7rem',
                                                        color: alpha(theme.palette.text.secondary, 0.7),
                                                        textDecoration: 'line-through'
                                                    }}>
                                                        {checkpoint.description && (
                                                            <Box component="span" sx={{ display: 'block', mb: 0.3 }}>
                                                                {checkpoint.description.substring(0, 60)}
                                                                {checkpoint.description.length > 60 ? '...' : ''}
                                                            </Box>
                                                        )}

                                                        <Box component="span" sx={{
                                                            display: 'inline-block',
                                                            bgcolor: alpha(statusColors.concluida, 0.1),
                                                            px: 0.5,
                                                            borderRadius: 0.5,
                                                            fontSize: '0.65rem',
                                                            color: statusColors.concluida,
                                                            textDecoration: 'none'
                                                        }}>
                                                            Concluído
                                                        </Box>
                                                    </Typography>
                                                }
                                                secondaryTypographyProps={{
                                                    variant: 'caption',
                                                    component: 'div'
                                                }}
                                            />
                                        </ListItem>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </>
                    )}
                </>
            )}
        </List>
    );

    // Timeline de checkpoints em ordem cronológica
    const renderTimeline = () => {
        if (sortedCheckpoints.length === 0) {
            return (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                        Nenhum checkpoint definido para criar timeline
                    </Typography>
                </Box>
            );
        }

        return (
            <Box sx={{
                pt: 2,
                pl: 2,
                pr: 1,
                position: 'relative',
                height: 300,
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                    width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: alpha(theme.palette.divider, 0.1),
                    borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: '4px',
                    '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.3),
                    },
                },
            }}>
                {/* Linha vertical da timeline */}
                <Box
                    sx={{
                        position: 'absolute',
                        left: 34,
                        top: 0,
                        bottom: 10,
                        width: 2,
                        bgcolor: alpha(theme.palette.divider, 0.3),
                        zIndex: 0,
                    }}
                />

                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {sortedCheckpoints.map((checkpoint, index) => {
                        const status = getStatusForCard(checkpoint.status as MissionStatus);
                        const isFirst = index === 0;
                        const isLast = index === sortedCheckpoints.length - 1;
                        const checkpointDate = new Date(checkpoint.dueDate);
                        const isPast = checkpointDate < today;
                        const isToday = isSameDay(checkpointDate, today);

                        return (
                            <motion.div
                                key={checkpoint.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <Box sx={{
                                    display: 'flex',
                                    mb: 3,
                                    position: 'relative',
                                }}>
                                    {/* Marcador da timeline */}
                                    <Box sx={{
                                        width: 20,
                                        height: 20,
                                        borderRadius: '50%',
                                        bgcolor: statusColors[status],
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        ml: 1,
                                        mr: 2,
                                        boxShadow: `0 0 0 4px ${alpha(statusColors[status], 0.2)}`,
                                        zIndex: 1,
                                    }}>
                                        {status === 'concluida' && (
                                            <CheckCircleIcon sx={{ color: '#fff', fontSize: '0.8rem' }} />
                                        )}
                                        {status === 'em-progresso' && (
                                            <ScheduleIcon sx={{ color: '#fff', fontSize: '0.8rem' }} />
                                        )}
                                        {status === 'pendente' && (
                                            <PendingIcon sx={{ color: '#fff', fontSize: '0.8rem' }} />
                                        )}
                                    </Box>

                                    {/* Conteúdo */}
                                    <Box sx={{
                                        flex: 1,
                                        pb: 1.5,
                                    }}>
                                        <Paper
                                            elevation={1}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                borderLeft: `4px solid ${statusColors[status]}`,
                                                bgcolor: alpha(theme.palette.background.paper, 0.7),
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    bgcolor: theme.palette.background.paper,
                                                    boxShadow: theme.shadows[3],
                                                }
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                    {checkpoint.title}
                                                </Typography>

                                                <Chip
                                                    size="small"
                                                    label={format(checkpointDate, 'dd/MM/yyyy')}
                                                    icon={isToday ? <TodayIcon fontSize="small" /> : undefined}
                                                    sx={{
                                                        height: 22,
                                                        bgcolor: isPast
                                                            ? alpha(theme.palette.grey[500], 0.1)
                                                            : isToday
                                                                ? alpha(theme.palette.primary.main, 0.1)
                                                                : alpha(theme.palette.info.main, 0.1),
                                                        color: isPast
                                                            ? theme.palette.text.secondary
                                                            : isToday
                                                                ? theme.palette.primary.main
                                                                : theme.palette.info.main,
                                                        '& .MuiChip-label': {
                                                            px: 1,
                                                            fontSize: '0.7rem',
                                                            fontWeight: 500
                                                        }
                                                    }}
                                                />
                                            </Box>

                                            {checkpoint.description && (
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontSize: '0.85rem' }}>
                                                    {checkpoint.description}
                                                </Typography>
                                            )}

                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between'
                                            }}>
                                                <Chip
                                                    label={statusLabels[status]}
                                                    size="small"
                                                    icon={React.cloneElement(statusIcons[status], {
                                                        fontSize: 'small'
                                                    })}
                                                    sx={{
                                                        bgcolor: statusBackgroundColors[status],
                                                        color: statusColors[status],
                                                        '& .MuiChip-icon': {
                                                            color: statusColors[status]
                                                        },
                                                        fontSize: '0.75rem',
                                                        height: 24,
                                                    }}
                                                />

                                                {/* Responsável pelo checkpoint (se existir) */}
                                                {checkpoint.responsible && (
                                                    <Tooltip
                                                        title={users.find(u => u._id === checkpoint.responsible)?.username || 'Responsável'}
                                                        arrow
                                                    >
                                                        <Avatar
                                                            sx={{
                                                                width: 24,
                                                                height: 24,
                                                                fontSize: '0.75rem',
                                                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                                color: theme.palette.primary.main,
                                                            }}
                                                        >
                                                            {getResponsibleInitial(checkpoint.responsible)}
                                                        </Avatar>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </Paper>
                                    </Box>
                                </Box>
                            </motion.div>
                        );
                    })}
                </Box>
            </Box>
        );
    };

    // Renderização do card principal
    return (
        <Card
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            sx={{
                mb: 3,
                borderRadius: 3,
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.3s ease-in-out',
                boxShadow: theme.shadows[3],
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: theme.shadows[10],
                },
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.05),
            }}
        >
            {/* Barra de status no topo */}
            <Box
                sx={{
                    height: 6,
                    background: isOverdue
                        ? `linear-gradient(90deg, ${theme.palette.error.dark}, ${theme.palette.error.light})`
                        : isNearDeadline
                            ? `linear-gradient(90deg, ${theme.palette.warning.dark}, ${theme.palette.warning.light})`
                            : statusGradients[missionStatus],
                    zIndex: 1,
                }}
            />

            {/* Header com título e ações */}
            <CardHeader
                avatar={
                    <Avatar
                        sx={{
                            bgcolor: isOverdue
                                ? theme.palette.error.main
                                : statusColors[missionStatus],
                            boxShadow: `0 4px 10px ${alpha(
                                isOverdue ? theme.palette.error.main : statusColors[missionStatus],
                                0.4
                            )}`,
                            width: 45,
                            height: 45,
                        }}
                    >
                        {isOverdue ? (
                            <PriorityHighIcon />
                        ) : (
                            getResponsibleInitial(mission.leader)
                        )}
                    </Avatar>
                }

                action={
                    <>
                        <IconButton onClick={handleMenuOpen}>
                            <MoreVertIcon />
                        </IconButton>

                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                            TransitionComponent={Fade}
                            elevation={3}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            sx={{
                                '& .MuiPaper-root': {
                                    borderRadius: 2,
                                    minWidth: 180,
                                }
                            }}
                        >
                            <MenuItem onClick={handleEdit}>
                                <ListItemIcon>
                                    <EditIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2">Editar missão</Typography>
                            </MenuItem>

                            <MenuItem onClick={toggleTimeline}>
                                <ListItemIcon>
                                    <TimelineIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2">
                                    {showTimeline ? 'Ocultar timeline' : 'Ver timeline'}
                                </Typography>
                            </MenuItem>

                            <Divider />

                            <MenuItem onClick={handleMenuClose}>
                                <ListItemIcon>
                                    <AddAlertIcon fontSize="small" />
                                </ListItemIcon>
                                <Typography variant="body2">Ativar alertas</Typography>
                            </MenuItem>
                        </Menu>
                    </>
                }

                title={
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {mission.title}
                    </Typography>
                }

                subheader={
                    <Box sx={{ display: 'flex', flexDirection: 'column', mt: 0.3 }}>
                        <Typography
                            variant="body2"
                            sx={{
                                color: alpha(theme.palette.text.secondary, 0.8),
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                mb: 0.3,
                                fontSize: '0.8rem',
                            }}
                        >
                            <EventIcon fontSize="small" sx={{ fontSize: '1rem' }} />
                            {format(missionStart, 'dd/MM/yyyy')} a {format(missionEnd, 'dd/MM/yyyy')}

                            {isNearDeadline && !isOverdue && (
                                <Chip
                                    label={daysLeft === 0 ? "Hoje" : `${daysLeft} dias`}
                                    size="small"
                                    color="warning"
                                    sx={{
                                        height: 18,
                                        '& .MuiChip-label': { px: 0.8, fontSize: '0.7rem' },
                                        fontWeight: 600,
                                        ml: 0.5
                                    }}
                                />
                            )}

                            {isOverdue && (
                                <Chip
                                    label={`${Math.abs(daysLeft)} dias atrasada`}
                                    size="small"
                                    color="error"
                                    sx={{
                                        height: 18,
                                        '& .MuiChip-label': { px: 0.8, fontSize: '0.7rem' },
                                        fontWeight: 600,
                                        ml: 0.5
                                    }}
                                />
                            )}
                        </Typography>

                        <Typography
                            variant="body2"
                            sx={{
                                color: theme.palette.text.secondary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                fontSize: '0.8rem',
                            }}
                        >
                            <StarIcon fontSize="small" sx={{ fontSize: '1rem', color: statusColors[missionStatus] }} />
                            Líder: <b>{leaderUser?.username || 'N/A'}</b>
                        </Typography>
                    </Box>
                }

                sx={{
                    pb: 0.5,
                    '& .MuiCardHeader-content': { maxWidth: isMobile ? '65%' : '80%' },
                    '& .MuiCardHeader-subheader': { marginTop: -0.5 },
                }}
            />

            <CardContent sx={{ pt: 0 }}>
                {/* Descrição da missão */}
                <Typography
                    variant="body2"
                    sx={{
                        color: theme.palette.text.secondary,
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: expanded || isTablet ? 'unset' : 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: 1.5,
                    }}
                >
                    {mission.description}
                </Typography>

                {/* Estatísticas e progresso */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 2,
                        background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.default, 0.7)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
                    }}
                >
                    <Grid container spacing={2}>
                        {/* Barra de progresso */}
                        <Grid item xs={12}>
                            <Box sx={{ mb: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                    Progresso da missão
                                </Typography>
                                <Typography
                                    variant="body2"
                                    fontWeight="bold"
                                    color={
                                        progress === 100
                                            ? statusColors.concluida
                                            : progress > 50
                                                ? statusColors['em-progresso']
                                                : statusColors.pendente
                                    }
                                >
                                    {progress}%
                                </Typography>
                            </Box>

                            <Box sx={{ position: 'relative', mb: 1 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={progress}
                                    sx={{
                                        height: 10,
                                        borderRadius: 5,
                                        bgcolor: alpha(theme.palette.divider, 0.2),
                                        '& .MuiLinearProgress-bar': {
                                            borderRadius: 5,
                                            backgroundImage: isOverdue
                                                ? `linear-gradient(90deg, ${theme.palette.error.dark}, ${theme.palette.error.main})`
                                                : progress === 100
                                                    ? `linear-gradient(90deg, ${statusColors.concluida}, ${alpha(statusColors.concluida, 0.7)})`
                                                    : `linear-gradient(90deg, ${statusColors[missionStatus]}, ${alpha(statusColors[missionStatus], 0.7)})`,
                                        },
                                    }}
                                />

                                {/* Marcadores de progresso importantes */}
                                {[25, 50, 75].map(mark => (
                                    <Box
                                        key={mark}
                                        sx={{
                                            position: 'absolute',
                                            left: `${mark}%`,
                                            top: 0,
                                            height: 10,
                                            width: 2,
                                            bgcolor: alpha(theme.palette.divider, 0.3),
                                            zIndex: 1,
                                        }}
                                    />
                                ))}
                            </Box>
                        </Grid>

                        {/* Estatísticas em chips */}
                        <Grid item xs={12}>
                            <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                useFlexGap
                                sx={{
                                    '& > *': { mb: 1 }
                                }}
                            >
                                <Chip
                                    icon={<QueryBuilderIcon />}
                                    label={isOverdue
                                        ? `${Math.abs(daysLeft)} dias atrasados`
                                        : daysLeft === 0
                                            ? "Termina hoje"
                                            : `${daysLeft} dias restantes`
                                    }
                                    size="small"
                                    color={isOverdue ? "error" : isNearDeadline ? "warning" : "default"}
                                    variant={isOverdue || isNearDeadline ? "filled" : "outlined"}
                                    sx={{
                                        fontWeight: 500,
                                        '& .MuiChip-icon': {
                                            color: isOverdue || isNearDeadline ? 'inherit' : theme.palette.text.secondary,
                                        }
                                    }}
                                />

                                <Chip
                                    icon={<AssignmentTurnedInIcon />}
                                    label={`${checkpointStats.completed}/${checkpointStats.total} checkpoints`}
                                    size="small"
                                    color={
                                        checkpointStats.total > 0
                                            ? checkpointStats.completed === checkpointStats.total
                                                ? "success"
                                                : "primary"
                                            : "default"
                                    }
                                    variant={checkpointStats.total > 0 ? "filled" : "outlined"}
                                    sx={{
                                        fontWeight: 500,
                                        bgcolor: checkpointStats.total > 0
                                            ? checkpointStats.completed === checkpointStats.total
                                                ? alpha(statusColors.concluida, 0.1)
                                                : alpha(theme.palette.primary.main, 0.1)
                                            : undefined,
                                        color: checkpointStats.total > 0
                                            ? checkpointStats.completed === checkpointStats.total
                                                ? statusColors.concluida
                                                : theme.palette.primary.main
                                            : undefined,
                                        '& .MuiChip-icon': {
                                            color: 'inherit',
                                        }
                                    }}
                                />

                                <Chip
                                    icon={<GroupIcon />}
                                    label={`${teamMembers.length} membros`}
                                    size="small"
                                    variant="outlined"
                                />

                                {mission.points > 0 && (
                                    <Chip
                                        icon={<EmojiEventsIcon />}
                                        label={`${mission.points} pontos`}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                                            color: theme.palette.warning.dark,
                                            borderColor: alpha(theme.palette.warning.main, 0.2),
                                            '& .MuiChip-icon': {
                                                color: theme.palette.warning.dark,
                                            }
                                        }}
                                    />
                                )}

                                {mission.tasks?.length > 0 && (
                                    <Chip
                                        icon={<AddTaskIcon />}
                                        label={`${mission.tasks.length} tarefas`}
                                        size="small"
                                        color="secondary"
                                        variant="outlined"
                                    />
                                )}
                            </Stack>
                        </Grid>
                    </Grid>
                </Paper>

                {/* Exibição da equipe */}
                {teamMembers.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 1
                        }}>
                            <Typography variant="subtitle2" sx={{
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                color: alpha(theme.palette.text.primary, 0.9),
                                '& svg': { mr: 0.5, color: theme.palette.primary.main }
                            }}>
                                <GroupIcon fontSize="small" /> Equipe da Missão
                            </Typography>

                            <Chip
                                label={`${teamMembers.length} membros`}
                                size="small"
                                sx={{
                                    height: 20,
                                    '& .MuiChip-label': { px: 1, py: 0, fontSize: '0.7rem' },
                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                    color: theme.palette.primary.main,
                                }}
                            />
                        </Box>

                        <Box sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.background.paper, 0.4),
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        }}>
                            <AvatarGroup
                                max={isMobile ? 4 : 7}
                                sx={{
                                    justifyContent: 'center',
                                    '& .MuiAvatar-root': {
                                        width: 38,
                                        height: 38,
                                        fontSize: '1rem',
                                        border: `2px solid ${alpha(theme.palette.background.paper, 0.8)}`,
                                    }
                                }}
                            >
                                {teamMembers.map(member => (
                                    <Tooltip
                                        key={member._id}
                                        title={
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                    {member.username}
                                                </Typography>
                                                {member._id === mission.leader && (
                                                    <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center' }}>
                                                        <StarIcon sx={{ fontSize: '0.8rem', mr: 0.5 }} /> Líder da missão
                                                    </Typography>
                                                )}
                                            </Box>
                                        }
                                        arrow
                                        placement="top"
                                    >
                                        <Avatar
                                            alt={member.username}
                                            src={member.avatar}
                                            sx={{
                                                bgcolor: member._id === mission.leader
                                                    ? statusColors[missionStatus]
                                                    : undefined,
                                                boxShadow: member._id === mission.leader
                                                    ? `0 2px 8px ${alpha(statusColors[missionStatus], 0.4)}`
                                                    : undefined
                                            }}
                                        >
                                            {member.username?.charAt(0).toUpperCase()}
                                            {member._id === mission.leader && (
                                                <StarIcon
                                                    sx={{
                                                        position: 'absolute',
                                                        bottom: -2,
                                                        right: -2,
                                                        fontSize: '0.9rem',
                                                        color: 'white',
                                                        bgcolor: statusColors[missionStatus],
                                                        borderRadius: '50%',
                                                        padding: '1px',
                                                        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
                                                    }}
                                                />
                                            )}
                                        </Avatar>
                                    </Tooltip>
                                ))}
                            </AvatarGroup>
                        </Box>
                    </Box>
                )}

                {/* Timeline view */}
                <Collapse in={showTimeline}>
                    <Paper
                        elevation={0}
                        sx={{
                            mb: 2,
                            overflow: 'hidden',
                            borderRadius: 2,
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                        }}
                    >
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            px: 2,
                            py: 1,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                        }}>
                            <TimelineIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                                Timeline de Checkpoints
                            </Typography>
                        </Box>

                        {renderTimeline()}
                    </Paper>
                </Collapse>

                {/* Exibição do calendário e checkpoints (expandido) */}
                <Box sx={{ mt: 2 }}>
                    <Box
                        component={ButtonBase}
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpanded(!expanded);
                        }}
                        sx={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            py: 0.7,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.action.hover, 0.7),
                            '&:hover': {
                                bgcolor: theme.palette.action.hover
                            },
                            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        }}
                    >
                        <Typography
                            variant="button"
                            sx={{
                                fontWeight: 500,
                                fontSize: '0.8rem',
                                color: theme.palette.text.secondary,
                                mr: 1,
                            }}
                        >
                            {expanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                        </Typography>

                        {expanded ? (
                            <ExpandLessIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                        ) : (
                            <ExpandMoreIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
                        )}
                    </Box>
                </Box>

                <Collapse in={expanded}>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.4 }}
                    >
                        <Grid container spacing={3} sx={{ mt: 0.5 }}>
                            {/* Calendário */}
                            <Grid item xs={12} md={7}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        boxShadow: theme.shadows[1],
                                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                                        height: '100%',
                                    }}
                                >
                                    {renderMiniCalendar()}
                                </Paper>
                            </Grid>

                            {/* Lista de checkpoints */}
                            <Grid item xs={12} md={5}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        boxShadow: theme.shadows[1],
                                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                                        height: '100%',
                                    }}
                                >
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        px: 2,
                                        py: 1,
                                        bgcolor: alpha(theme.palette.background.default, 0.5),
                                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                                    }}>
                                        <FlagIcon sx={{ color: theme.palette.primary.main, mr: 1, fontSize: '1rem' }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                            Checkpoints ({missionCheckpoints.length})
                                        </Typography>
                                    </Box>

                                    {renderCheckpointList()}
                                </Paper>
                            </Grid>

                            {/* Estatísticas detalhadas */}
                            <Grid item xs={12}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        borderRadius: 2,
                                        bgcolor: alpha(theme.palette.background.paper, 0.8),
                                        boxShadow: theme.shadows[1],
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <PieChartIcon sx={{ color: theme.palette.primary.main, mr: 1 }} />
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                            Resumo de Status
                                        </Typography>
                                    </Box>

                                    <Grid container spacing={2}>
                                        {/* Checkpoints status */}
                                        <Grid item xs={12} sm={4}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(statusColors.concluida, 0.08),
                                                    border: `1px solid ${alpha(statusColors.concluida, 0.2)}`,
                                                    height: '100%',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <CheckCircleIcon sx={{ color: statusColors.concluida, mr: 1 }} />
                                                    <Typography variant="subtitle2" sx={{ color: statusColors.concluida, fontWeight: 600 }}>
                                                        Concluídos
                                                    </Typography>
                                                </Box>

                                                <Typography variant="h4" sx={{ fontWeight: 700, color: statusColors.concluida }}>
                                                    {checkpointsByStatus.completed.length}
                                                    <Typography component="span" variant="caption" sx={{ ml: 1, color: alpha(statusColors.concluida, 0.7) }}>
                                                        / {missionCheckpoints.length}
                                                    </Typography>
                                                </Typography>

                                                <LinearProgress
                                                    variant="determinate"
                                                    value={(checkpointsByStatus.completed.length / Math.max(1, missionCheckpoints.length)) * 100}
                                                    sx={{
                                                        mt: 1,
                                                        height: 6,
                                                        borderRadius: 3,
                                                        bgcolor: alpha(statusColors.concluida, 0.15),
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: statusColors.concluida,
                                                        }
                                                    }}
                                                />
                                            </Paper>
                                        </Grid>

                                        <Grid item xs={12} sm={4}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(statusColors['em-progresso'], 0.08),
                                                    border: `1px solid ${alpha(statusColors['em-progresso'], 0.2)}`,
                                                    height: '100%',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <ScheduleIcon sx={{ color: statusColors['em-progresso'], mr: 1 }} />
                                                    <Typography variant="subtitle2" sx={{ color: statusColors['em-progresso'], fontWeight: 600 }}>
                                                        Em Progresso
                                                    </Typography>
                                                </Box>

                                                <Typography variant="h4" sx={{ fontWeight: 700, color: statusColors['em-progresso'] }}>
                                                    {checkpointsByStatus.inProgress.length}
                                                    <Typography component="span" variant="caption" sx={{ ml: 1, color: alpha(statusColors['em-progresso'], 0.7) }}>
                                                        / {missionCheckpoints.length}
                                                    </Typography>
                                                </Typography>

                                                <LinearProgress
                                                    variant="determinate"
                                                    value={(checkpointsByStatus.inProgress.length / Math.max(1, missionCheckpoints.length)) * 100}
                                                    sx={{
                                                        mt: 1,
                                                        height: 6,
                                                        borderRadius: 3,
                                                        bgcolor: alpha(statusColors['em-progresso'], 0.15),
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: statusColors['em-progresso'],
                                                        }
                                                    }}
                                                />
                                            </Paper>
                                        </Grid>

                                        <Grid item xs={12} sm={4}>
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    bgcolor: alpha(statusColors.pendente, 0.08),
                                                    border: `1px solid ${alpha(statusColors.pendente, 0.2)}`,
                                                    height: '100%',
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <PendingIcon sx={{ color: statusColors.pendente, mr: 1 }} />
                                                    <Typography variant="subtitle2" sx={{ color: statusColors.pendente, fontWeight: 600 }}>
                                                        Pendentes
                                                    </Typography>
                                                </Box>

                                                <Typography variant="h4" sx={{ fontWeight: 700, color: statusColors.pendente }}>
                                                    {checkpointsByStatus.pending.length}
                                                    <Typography component="span" variant="caption" sx={{ ml: 1, color: alpha(statusColors.pendente, 0.7) }}>
                                                        / {missionCheckpoints.length}
                                                    </Typography>
                                                </Typography>

                                                <LinearProgress
                                                    variant="determinate"
                                                    value={(checkpointsByStatus.pending.length / Math.max(1, missionCheckpoints.length)) * 100}
                                                    sx={{
                                                        mt: 1,
                                                        height: 6,
                                                        borderRadius: 3,
                                                        bgcolor: alpha(statusColors.pendente, 0.15),
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: statusColors.pendente,
                                                        }
                                                    }}
                                                />
                                            </Paper>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>
                        </Grid>
                    </motion.div>
                </Collapse>
            </CardContent>
        </Card>
    );
};

export default MissionTimelineCard;
