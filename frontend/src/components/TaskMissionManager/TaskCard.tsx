import React, { useState } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Chip,
    Box,
    Avatar,
    IconButton,
    Tooltip,
    Badge,
    alpha,
    useTheme,
    LinearProgress,
    Divider
} from '@mui/material';
import { motion } from 'framer-motion';
import { Task } from '../../types';
import DateRangeIcon from '@mui/icons-material/DateRange';
import StarIcon from '@mui/icons-material/Star';
import CommentIcon from '@mui/icons-material/Comment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface TaskCardProps {
    task: Task;
    onClick: () => void;
    compact?: boolean; // Nova prop para modo compacto
}

// Paleta de cores estendida para mais opções
const colorOptions: { [key: string]: string } = {
    teal: '#009688',
    cyan: '#00bcd4',
    indigo: '#3f51b5',
    deepPurple: '#673ab7',
    pink: '#e91e63',
    amber: '#ffc107',
    green: '#4caf50',
    blue: '#2196f3',
    red: '#f44336',
    orange: '#ff9800',
    brown: '#795548',
    blueGrey: '#607d8b',
};

const statusInfo: { [key: string]: { color: string; label: string; icon: string } } = {
    pending: {
        color: '#ffa726',
        label: 'Pendente',
        icon: '⏳'
    },
    in_progress: {
        color: '#29b6f6',
        label: 'Em Progresso',
        icon: '🔄'
    },
    completed: {
        color: '#66bb6a',
        label: 'Concluída',
        icon: '✅'
    }
};

const priorityLabels = ['Baixa', 'Média', 'Alta', 'Urgente'];

const getPriorityColor = (priority: number = 0): string => {
    switch (priority) {
        case 3: return '#d32f2f'; // Urgente - Vermelho
        case 2: return '#f57c00'; // Alta - Laranja
        case 1: return '#ffb74d'; // Média - Amarelo
        default: return '#81c784'; // Baixa - Verde
    }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick, compact = false }) => {
    const theme = useTheme();
    const [expanded, setExpanded] = useState(false);

    // Definir cor do card com fallback
    const cardColor = task.color && colorOptions[task.color] ? colorOptions[task.color] : colorOptions.teal;

    // Obter informações de status
    const status = task.status && statusInfo[task.status] ? statusInfo[task.status] : statusInfo.pending;

    // Calcular se a tarefa está atrasada
    const isOverdue = task.endDate && new Date(task.endDate) < new Date() && task.status !== 'completed';

    // Calcular dias restantes
    const getDaysRemaining = (): number | null => {
        if (!task.endDate) return null;
        const endDate = new Date(task.endDate);
        const today = new Date();
        // Resetar horas para comparar apenas datas
        endDate.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysRemaining = getDaysRemaining();

    // Formatar data
    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: compact ? undefined : '2-digit' // Omitir o ano no modo compacto
            });
        } catch (e) {
            return 'Data inválida';
        }
    };

    // Calcular e limitar descrição
    const description = task.description || '';
    const shortDescription = description.substring(0, expanded ? description.length : (compact ? 60 : 80));
    const hasMoreDescription = description.length > (compact ? 60 : 80);

    // Verificar se há comentários
    const commentCount = Array.isArray(task.comments) ? task.comments.length :
        typeof task.comments === 'string' ? (task.comments ? 1 : 0) : 0;

    // Verificar se há anexos
    const attachmentCount = Array.isArray(task.attachments) ? task.attachments.length : 0;

    // Calcular progresso se houver subtarefas
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const completedSubtasks = task.subtasks?.filter(st => st.completed)?.length || 0;
    const totalSubtasks = task.subtasks?.length || 0;
    const subtaskProgress = hasSubtasks ? (completedSubtasks / totalSubtasks) * 100 : 0;

    return (
        <Card
            component={motion.div}
            whileHover={{ y: compact ? -2 : -4, boxShadow: theme.shadows[compact ? 3 : 4] }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            onClick={onClick}
            sx={{
                mb: compact ? 1 : 2,
                cursor: 'pointer',
                borderRadius: compact ? 1.5 : 2,
                overflow: 'visible',
                position: 'relative',
                border: `1px solid ${alpha(cardColor, 0.3)}`,
                transition: 'all 0.3s ease',
                background: theme.palette.background.paper,
                '&:hover': {
                    transform: `translateY(${compact ? '-2px' : '-4px'})`,
                    boxShadow: compact ? '0 3px 10px 0 rgba(0,0,0,0.1)' : '0 4px 20px 0 rgba(0,0,0,0.12)',
                },
            }}
        >
            {/* Barra superior colorida */}
            <Box sx={{
                height: compact ? 3 : 4,
                background: cardColor,
                borderTopLeftRadius: compact ? 6 : 8,
                borderTopRightRadius: compact ? 6 : 8
            }} />

            {/* Indicador de prioridade (se alta) */}
            {task.priority !== undefined && task.priority > 1 && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: compact ? -4 : -6,
                        right: compact ? 12 : 16,
                        zIndex: 1
                    }}
                >
                    <Tooltip title={`Prioridade ${task.priority !== undefined ? priorityLabels[task.priority] || 'Normal' : 'Normal'}`}>
                        <Box
                            component={motion.div}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring' }}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: compact ? 16 : 20,
                                height: compact ? 16 : 20,
                                borderRadius: '50%',
                                backgroundColor: getPriorityColor(task.priority),
                                color: 'white',
                                boxShadow: 1,
                                fontSize: compact ? 10 : 12,
                                fontWeight: 'bold',
                            }}
                        >
                            {task.priority !== undefined && task.priority >= 3 ? '!' : task.priority}
                        </Box>
                    </Tooltip>
                </Box>
            )}

            <CardContent sx={{
                p: compact ? 1.25 : theme.spacing(2),
                '&:last-child': { pb: compact ? 1.25 : theme.spacing(2) }
            }}>
                {/* Status chip */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: compact ? 0.75 : 1.5,
                    alignItems: 'flex-start'
                }}>
                    <Chip
                        label={status.label}
                        size="small"
                        sx={{
                            backgroundColor: alpha(status.color, 0.15),
                            color: status.color,
                            fontWeight: 600,
                            fontSize: compact ? '0.65rem' : '0.75rem',
                            height: compact ? 20 : 24,
                            '& .MuiChip-label': { px: compact ? 0.8 : 1.2 }
                        }}
                        icon={compact ? undefined : (
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                pl: 0.5,
                                fontSize: '0.75rem'
                            }}>
                                {status.icon}
                            </Box>
                        )}
                    />

                    {/* Pontos da tarefa */}
                    {task.points > 0 && (
                        <Chip
                            icon={
                                compact ? undefined :
                                    <StarIcon sx={{ fontSize: '0.875rem !important', color: '#FFD700' }} />
                            }
                            label={compact ? `${task.points}★` : `${task.points}`}
                            size="small"
                            sx={{
                                backgroundColor: alpha('#FFD700', 0.1),
                                color: theme.palette.mode === 'dark' ? '#FFD700' : '#987200',
                                fontWeight: 'bold',
                                height: compact ? 20 : 24,
                                '& .MuiChip-label': { pl: compact ? 0.8 : 0.5, pr: compact ? 0.8 : 1 },
                                border: `1px solid ${alpha('#FFD700', 0.3)}`,
                                fontSize: compact ? '0.65rem' : '0.75rem',
                            }}
                        />
                    )}
                </Box>

                {/* Título */}
                <Typography
                    variant={compact ? "subtitle2" : "h6"}
                    component="div"
                    sx={{
                        mb: compact ? 0.75 : 1.5,
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        lineHeight: 1.3,
                        fontSize: compact ? '0.85rem' : '1rem',
                        // Limitar a duas linhas no modo compacto
                        ...(compact && {
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                        })
                    }}
                >
                    {task.title || 'Sem título'}
                </Typography>

                {/* Descrição - mostrar somente se não estiver no modo compacto ou expandido */}
                {description && !compact && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.secondary,
                            mb: 1.5,
                            lineHeight: 1.5,
                        }}
                    >
                        {shortDescription}
                        {!expanded && hasMoreDescription && '...'}
                    </Typography>
                )}

                {/* Versão super compacta da descrição (apenas para modo compacto) */}
                {description && compact && (
                    <Typography
                        variant="body2"
                        sx={{
                            color: theme.palette.text.secondary,
                            mb: 0.75,
                            lineHeight: 1.3,
                            maxHeight: '2.6rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            fontSize: '0.75rem'
                        }}
                    >
                        {description.substring(0, 60)}
                        {description.length > 60 && '...'}
                    </Typography>
                )}

                {/* Botão para expandir/contrair descrição - ocultar no modo compacto */}
                {!compact && hasMoreDescription && (
                    <Box sx={{
                        textAlign: 'center',
                        mt: -0.5,
                        mb: 1.5
                    }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                            sx={{
                                fontSize: '0.7rem',
                                color: theme.palette.text.secondary
                            }}
                        >
                            {expanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                        </IconButton>
                    </Box>
                )}

                {/* Progresso de subtarefas - simplificado no modo compacto */}
                {hasSubtasks && (
                    <Box sx={{ mb: compact ? 1 : 2 }}>
                        {!compact && (
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 0.5
                            }}>
                                <Typography
                                    variant="caption"
                                    color="textSecondary"
                                >
                                    Subtarefas
                                </Typography>
                                <Typography
                                    variant="caption"
                                    fontWeight={600}
                                >
                                    {completedSubtasks}/{totalSubtasks}
                                </Typography>
                            </Box>
                        )}
                        <LinearProgress
                            variant="determinate"
                            value={subtaskProgress}
                            sx={{
                                height: compact ? 3 : 4,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.divider, 0.3),
                                '& .MuiLinearProgress-bar': {
                                    bgcolor: cardColor
                                }
                            }}
                        />
                        {compact && (
                            <Typography
                                variant="caption"
                                sx={{
                                    fontSize: '0.65rem',
                                    display: 'block',
                                    textAlign: 'right',
                                    mt: 0.3
                                }}
                            >
                                {completedSubtasks}/{totalSubtasks}
                            </Typography>
                        )}
                    </Box>
                )}

                <Divider sx={{ mt: compact ? 0.5 : 1, mb: compact ? 0.75 : 1.5 }} />

                {/* Rodapé do card com informações extras */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    {/* Data de vencimento */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        <Tooltip title={task.endDate ? `Vencimento: ${formatDate(task.endDate)}` : 'Sem data de vencimento'}>
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                color: isOverdue ? theme.palette.error.main :
                                    daysRemaining && daysRemaining <= 2 ? theme.palette.warning.main :
                                        theme.palette.text.secondary
                            }}>
                                <DateRangeIcon
                                    fontSize="small"
                                    sx={{
                                        fontSize: compact ? '0.75rem' : '0.875rem',
                                        mr: 0.4,
                                    }}
                                />
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: isOverdue ? 600 : 400,
                                        fontSize: compact ? '0.65rem' : '0.75rem',
                                    }}
                                >
                                    {task.endDate ? formatDate(task.endDate) : 'Sem data'}
                                    {isOverdue && (compact ? '!' : ' (Atrasada)')}
                                    {!isOverdue && daysRemaining === 0 && (compact ? ' (H)' : ' (Hoje)')}
                                    {!isOverdue && daysRemaining === 1 && (compact ? ' (A)' : ' (Amanhã)')}
                                </Typography>
                            </Box>
                        </Tooltip>
                    </Box>

                    {/* Ícones de informação extra */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: compact ? 0.5 : 1 }}>
                        {/* Badge para anexos */}
                        {attachmentCount > 0 && (
                            <Tooltip title={`${attachmentCount} anexo${attachmentCount > 1 ? 's' : ''}`}>
                                <Badge
                                    badgeContent={attachmentCount}
                                    color="default"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            fontSize: '0.6rem',
                                            height: compact ? 14 : 16,
                                            minWidth: compact ? 14 : 16
                                        }
                                    }}
                                >
                                    <AttachFileIcon
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            fontSize: compact ? '0.85rem' : '1rem'
                                        }}
                                    />
                                </Badge>
                            </Tooltip>
                        )}

                        {/* Badge para comentários */}
                        {commentCount > 0 && (
                            <Tooltip title={`${commentCount} comentário${commentCount > 1 ? 's' : ''}`}>
                                <Badge
                                    badgeContent={commentCount}
                                    color="primary"
                                    sx={{
                                        '& .MuiBadge-badge': {
                                            fontSize: '0.6rem',
                                            height: compact ? 14 : 16,
                                            minWidth: compact ? 14 : 16
                                        }
                                    }}
                                >
                                    <CommentIcon
                                        sx={{
                                            color: theme.palette.text.secondary,
                                            fontSize: compact ? '0.85rem' : '1rem'
                                        }}
                                    />
                                </Badge>
                            </Tooltip>
                        )}

                        {/* Avatar da pessoa designada */}
                        {task.assignedTo && (
                            <Avatar
                                sx={{
                                    width: compact ? 20 : 24,
                                    height: compact ? 20 : 24,
                                    fontSize: compact ? '0.65rem' : '0.75rem',
                                    bgcolor: cardColor,
                                }}
                            >
                                {typeof task.assignedTo === 'string'
                                    ? task.assignedTo.charAt(0).toUpperCase()
                                    : task.assignedTo.username
                                        ? task.assignedTo.username.charAt(0).toUpperCase()
                                        : 'U'}
                            </Avatar>
                        )}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
};

export default React.memo(TaskCard);
