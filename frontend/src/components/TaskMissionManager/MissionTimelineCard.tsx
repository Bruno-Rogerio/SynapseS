// frontend/src/components/TaskMissionManager/MissionTimelineCard.tsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    Card,
    CardActionArea,
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
} from '@mui/material';
import { Mission, Checkpoint, User } from '../../types';
import { format, differenceInDays, isSameDay, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GroupIcon from '@mui/icons-material/Group';
import FlagIcon from '@mui/icons-material/Flag';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PendingIcon from '@mui/icons-material/Pending';

type CheckpointStatus = 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida' | 'concluída';
type MissionStatus = 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida' | 'concluída';

const formatMonthYear = (date: Date): string => {
    const months = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
};

const eachMonthOfInterval = (start: Date, end: Date): Date[] => {
    const months: Date[] = [];
    let currentDate = new Date(start);
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
    pendente: '#FF6666',
    'em-progresso': '#00AFF0',
    concluida: '#1DB954',
};

const statusBackgroundColors: Record<"pendente" | "em-progresso" | "concluida", string> = {
    pendente: 'rgba(255, 102, 102, 0.15)',
    'em-progresso': 'rgba(0, 175, 240, 0.15)',
    concluida: 'rgba(29, 185, 84, 0.15)',
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
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date(mission.startDate));
    const calendarRef = useRef<HTMLDivElement>(null);
    const missionCheckpoints: Checkpoint[] = mission.checkpoints || [];
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
    const missionStart = new Date(mission.startDate);
    const missionEnd = new Date(mission.endDate);
    const daysLeft = differenceInDays(missionEnd, new Date());

    const getResponsibleInitial = (userId: string | undefined) => {
        if (!userId) return '?';
        const user = users.find(u => u._id === userId);
        return user ? user.username.charAt(0).toUpperCase() : '?';
    };

    const sortedCheckpoints = useMemo(() =>
        [...missionCheckpoints].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        , [missionCheckpoints]);

    useEffect(() => {
        const handleScroll = () => {
            if (calendarRef.current) {
                const { scrollTop, scrollHeight, clientHeight } = calendarRef.current;
                const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
                const totalMonths = differenceInDays(missionEnd, missionStart) / 30;
                const currentMonthIndex = Math.floor(scrollPercentage * totalMonths);
                const newCurrentMonth = addMonths(missionStart, currentMonthIndex);
                setCurrentMonth(newCurrentMonth);
            }
        };

        const calendarElement = calendarRef.current;
        if (calendarElement) {
            calendarElement.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (calendarElement) {
                calendarElement.removeEventListener('scroll', handleScroll);
            }
        };
    }, [missionStart, missionEnd]);

    const renderMiniCalendar = () => {
        const months = eachMonthOfInterval(missionStart, missionEnd);
        return (
            <Box>
                <Typography variant="subtitle1" align="center" sx={{ mb: 1, position: 'sticky', top: 0, bgcolor: 'background.paper', zIndex: 1 }}>
                    {formatMonthYear(currentMonth)}
                </Typography>
                <Box
                    ref={calendarRef}
                    sx={{
                        maxHeight: 300,
                        overflowY: 'auto',
                        '&::-webkit-scrollbar': {
                            width: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                            backgroundColor: 'rgba(0,0,0,0.1)',
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            borderRadius: '4px',
                        },
                    }}
                >
                    {months.map((month: Date, monthIndex: number) => (
                        <Box key={monthIndex}>
                            <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>
                                {formatMonthYear(month)}
                            </Typography>
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(7, 1fr)',
                                    gap: 0.5,
                                    p: 1,
                                }}
                            >
                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, index) => (
                                    <Typography key={index} variant="caption" align="center">{day}</Typography>
                                ))}
                                {eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) }).map((day: Date) => {
                                    const isInMission = isWithinInterval(day, { start: missionStart, end: missionEnd });
                                    const checkpoints = sortedCheckpoints.filter(cp => isSameDay(new Date(cp.dueDate), day));
                                    return (
                                        <Tooltip
                                            key={day.getTime()}
                                            title={checkpoints.length > 0 ? `${checkpoints.length} checkpoint(s)` : ''}
                                            arrow
                                        >
                                            <Box
                                                sx={{
                                                    width: 24,
                                                    height: 24,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    borderRadius: '50%',
                                                    bgcolor: isInMission ? (checkpoints.length > 0 ? statusColors[getStatusForCard(checkpoints[0].status as MissionStatus)] : 'transparent') : 'transparent',
                                                    border: isInMission ? `1px solid ${theme.palette.divider}` : 'none',
                                                    color: isInMission ? (checkpoints.length > 0 ? 'white' : 'inherit') : theme.palette.text.disabled,
                                                    position: 'relative',
                                                }}
                                            >
                                                <Typography variant="caption">{format(day, 'd')}</Typography>
                                                {checkpoints.length > 1 && (
                                                    <Box
                                                        sx={{
                                                            position: 'absolute',
                                                            top: -2,
                                                            right: -2,
                                                            width: 12,
                                                            height: 12,
                                                            borderRadius: '50%',
                                                            bgcolor: theme.palette.error.main,
                                                            color: 'white',
                                                            fontSize: '0.6rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    >
                                                        {checkpoints.length}
                                                    </Box>
                                                )}
                                            </Box>
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>
        );
    };

    const renderCheckpointList = () => (
        <List sx={{ maxHeight: 300, overflow: 'auto' }}>
            {sortedCheckpoints.map((checkpoint) => (
                <ListItem key={checkpoint.id}>
                    <ListItemIcon>
                        {statusIcons[getStatusForCard(checkpoint.status as MissionStatus)]}
                    </ListItemIcon>
                    <ListItemText
                        primary={checkpoint.title}
                        secondary={`${format(new Date(checkpoint.dueDate), 'dd/MM/yyyy')} - ${statusLabels[getStatusForCard(checkpoint.status as MissionStatus)]}`}
                    />
                </ListItem>
            ))}
        </List>
    );

    return (
        <Card
            sx={{
                mb: 3,
                borderRadius: 2,
                boxShadow: 3,
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                    transform: 'translateY(-5px)',
                    boxShadow: 6,
                },
            }}
        >
            <CardActionArea onClick={() => onEditMission(mission)}>
                <Box sx={{ height: 8, bgcolor: statusBackgroundColors[missionStatus] }} />
                <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {mission.title}
                        </Typography>
                        <Chip
                            icon={statusIcons[missionStatus]}
                            label={statusLabels[missionStatus]}
                            sx={{
                                bgcolor: statusBackgroundColors[missionStatus],
                                color: statusColors[missionStatus],
                                fontWeight: 600,
                                '& .MuiChip-icon': {
                                    color: statusColors[missionStatus],
                                },
                            }}
                        />
                    </Stack>
                    <Typography variant="body2" sx={{ mb: 2, color: theme.palette.text.secondary }}>
                        {mission.description}
                    </Typography>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Tooltip title="Líder da Missão">
                            <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                {getResponsibleInitial(mission.leader)}
                            </Avatar>
                        </Tooltip>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Líder: {users.find(u => u._id === mission.leader)?.username || 'N/A'}
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={progress}
                                sx={{
                                    mt: 1,
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: theme.palette.grey[200],
                                    '& .MuiLinearProgress-bar': {
                                        borderRadius: 3,
                                        backgroundColor: statusColors[missionStatus],
                                    },
                                }}
                            />
                        </Box>
                        <Typography variant="h6" color={statusColors[missionStatus]}>
                            {progress}%
                        </Typography>
                    </Stack>
                    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                        <Chip
                            icon={<AccessTimeIcon />}
                            label={`${daysLeft} dias restantes`}
                            variant="outlined"
                            size="small"
                        />
                        <Chip
                            icon={<GroupIcon />}
                            label={`${mission.members?.length || 0} membros`}
                            variant="outlined"
                            size="small"
                        />
                        <Chip
                            icon={<FlagIcon />}
                            label={`${missionCheckpoints.length} checkpoints`}
                            variant="outlined"
                            size="small"
                        />
                    </Stack>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mt: 2 }}>
                        <Box sx={{ width: '60%' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Calendário da Missão
                            </Typography>
                            {renderMiniCalendar()}
                        </Box>
                        <Box sx={{ width: '40%' }}>
                            <Typography variant="subtitle2" sx={{ mb: 1 }}>
                                Checkpoints
                            </Typography>
                            {renderCheckpointList()}
                        </Box>
                    </Stack>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

export default MissionTimelineCard;
