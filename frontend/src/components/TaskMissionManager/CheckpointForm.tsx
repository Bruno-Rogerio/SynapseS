// frontend/src/components/TaskMissionManager/CheckpointForm.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    TextField,
    Button,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Alert,
    Stack,
    InputAdornment,
    FormHelperText,
    Chip,
    useTheme,
    alpha,
    Divider,
    Avatar,
    Card,
    CardContent,
    Tooltip,
    IconButton,
    Collapse,
    LinearProgress,
    SelectChangeEvent
} from '@mui/material';
import { motion } from 'framer-motion';
import { Checkpoint, User } from '../../types';
import { format, differenceInDays, addDays, isWeekend, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

// Ícones
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PendingIcon from '@mui/icons-material/Pending';
import LoopIcon from '@mui/icons-material/Loop';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import InfoIcon from '@mui/icons-material/Info';

interface CheckpointFormProps {
    onSubmit: (checkpoint: Omit<Checkpoint, 'id'>) => void;
    onClose: () => void;
    initialCheckpoint?: Partial<Checkpoint>;
    teamMembers: User[];
    missionStartDate: string;
    missionEndDate: string;
}

type FormState = {
    title: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'completed';
    assignedTo: string;
};

type FormErrors = {
    title?: string;
    dueDate?: string;
    assignedTo?: string;
};

const CheckpointForm: React.FC<CheckpointFormProps> = ({
    onSubmit,
    onClose,
    initialCheckpoint,
    teamMembers,
    missionStartDate,
    missionEndDate
}) => {
    const theme = useTheme();

    // Conversão de tipos de status
    const parseStatus = (status: string | undefined): 'pending' | 'in_progress' | 'completed' => {
        if (!status) return 'pending';
        if (status === 'in_progress' || status === 'em-progresso') return 'in_progress';
        if (status === 'completed' || status === 'concluida' || status === 'concluída') return 'completed';
        return 'pending';
    };

    // Formatar data para o input
    const formatDateForInput = (dateString: string | undefined): string => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch {
            return '';
        }
    };

    // Estados do formulário
    const [formState, setFormState] = useState<FormState>({
        title: initialCheckpoint?.title || '',
        dueDate: formatDateForInput(initialCheckpoint?.dueDate) || '',
        status: parseStatus(initialCheckpoint?.status),
        assignedTo: initialCheckpoint?.assignedTo || ''
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [dateConstraints, setDateConstraints] = useState<{ start: string, end: string }>({
        start: '',
        end: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDateInfo, setShowDateInfo] = useState(false);

    // Status colors
    const statusColor = {
        pending: theme.palette.warning.main,
        in_progress: theme.palette.info.main,
        completed: theme.palette.success.main
    };

    // Calculando as datas de restrição
    useEffect(() => {
        try {
            const missionStart = new Date(missionStartDate);
            const missionEnd = new Date(missionEndDate);

            if (isNaN(missionStart.getTime()) || isNaN(missionEnd.getTime())) {
                throw new Error("Datas da missão inválidas");
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Usar a data maior entre hoje e data de início da missão
            const effectiveStart = isAfter(today, missionStart) ? today : missionStart;

            setDateConstraints({
                start: effectiveStart.toISOString().split('T')[0],
                end: missionEnd.toISOString().split('T')[0]
            });

            // Se não houver data definida ou estiver fora do intervalo, definir para hoje
            if (!formState.dueDate) {
                setFormState(prev => ({
                    ...prev,
                    dueDate: effectiveStart.toISOString().split('T')[0]
                }));
            }

            // Atribuir ao primeiro membro da equipe se não houver ninguém atribuído
            if (!formState.assignedTo && teamMembers.length > 0) {
                setFormState(prev => ({
                    ...prev,
                    assignedTo: teamMembers[0]._id
                }));
            }
        } catch (error) {
            console.error("Erro ao processar datas:", error);
            setErrors(prev => ({
                ...prev,
                dueDate: 'Datas da missão inválidas'
            }));
        }
    }, [missionStartDate, missionEndDate, teamMembers, formState.assignedTo, formState.dueDate]);

    // Validação de formulário
    const validateForm = useCallback((): boolean => {
        const newErrors: FormErrors = {};

        if (!formState.title.trim()) {
            newErrors.title = 'O título é obrigatório';
        }

        if (!formState.dueDate) {
            newErrors.dueDate = 'A data de entrega é obrigatória';
        } else {
            const selectedDate = new Date(formState.dueDate);
            const startDate = dateConstraints.start ? new Date(dateConstraints.start) : null;
            const endDate = dateConstraints.end ? new Date(dateConstraints.end) : null;

            if (startDate && selectedDate < startDate) {
                newErrors.dueDate = 'A data não pode ser anterior à data de início da missão';
            } else if (endDate && selectedDate > endDate) {
                newErrors.dueDate = 'A data não pode ser posterior à data de término da missão';
            }
        }

        if (!formState.assignedTo) {
            newErrors.assignedTo = 'É necessário atribuir o checkpoint a alguém';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formState, dateConstraints]);

    // Handles
    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setFormState(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when field is edited
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    // Handler específico para Select
    const handleSelectChange = (e: SelectChangeEvent<unknown>) => {
        const { name, value } = e.target;

        if (!name) return;

        setFormState(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when field is edited
        if (errors[name as keyof FormErrors]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // Simular um pequeno delay para mostrar o feedback visual
            await new Promise(resolve => setTimeout(resolve, 500));

            // Certificar-se que a data está no formato correto
            const dueDate = formState.dueDate;
            const dueDateWithTime = new Date(dueDate);
            dueDateWithTime.setUTCHours(12, 0, 0, 0);

            onSubmit({
                title: formState.title,
                dueDate: dueDateWithTime.toISOString(),
                status: formState.status,
                assignedTo: formState.assignedTo
            });
        } catch (error) {
            console.error('Erro ao salvar checkpoint:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculando informações úteis sobre a data
    const dateInfo = React.useMemo(() => {
        if (!formState.dueDate || !dateConstraints.start || !dateConstraints.end) {
            return null;
        }

        try {
            const selectedDate = new Date(formState.dueDate);
            const startDate = new Date(dateConstraints.start);
            const endDate = new Date(dateConstraints.end);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (isNaN(selectedDate.getTime()) || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                return null;
            }

            const isWeekendDay = isWeekend(selectedDate);
            const daysFromToday = differenceInDays(selectedDate, today);
            const daysFromStart = differenceInDays(selectedDate, startDate);
            const daysToEnd = differenceInDays(endDate, selectedDate);

            // Para determinar se está perto da data limite
            const totalMissionDays = differenceInDays(endDate, startDate) || 1;
            const isCloseToDealine = daysToEnd <= Math.min(7, Math.round(totalMissionDays * 0.1));

            // Porcentagem da missão onde o checkpoint está posicionado
            const positionPercentage = Math.round(
                (daysFromStart / (totalMissionDays || 1)) * 100
            );

            return {
                isWeekendDay,
                daysFromToday,
                daysFromStart,
                daysToEnd,
                isCloseToDealine,
                positionPercentage,
                totalMissionDays
            };
        } catch (error) {
            console.error("Erro ao calcular informações da data:", error);
            return null;
        }
    }, [formState.dueDate, dateConstraints]);

    const shouldShowDateWarning = dateInfo?.isWeekendDay || dateInfo?.isCloseToDealine;

    // Renderização de responsável atribuído
    const renderAssignedUser = () => {
        const assignedUser = teamMembers.find(user => user._id === formState.assignedTo);

        if (!assignedUser) return null;

        return (
            <Card variant="outlined" sx={{
                mt: 2,
                borderRadius: 2,
                boxShadow: 'none',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
            }}>
                <CardContent sx={{
                    p: 2,
                    '&:last-child': { pb: 2 },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2
                }}>
                    <Avatar
                        src={assignedUser.avatar}
                        sx={{
                            width: 50,
                            height: 50,
                            bgcolor: theme.palette.primary.main,
                            border: `2px solid ${theme.palette.background.paper}`,
                            boxShadow: theme.shadows[2]
                        }}
                    >
                        {assignedUser.username.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box>
                        <Typography variant="subtitle2">
                            {assignedUser.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {assignedUser.role || 'Membro da equipe'}
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    return (
        <Box
            component={motion.form}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleSubmit}
        >
            {isSubmitting && (
                <LinearProgress
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        borderRadius: '4px 4px 0 0'
                    }}
                />
            )}

            <Stack spacing={3}>
                {/* Título do checkpoint */}
                <TextField
                    fullWidth
                    label="Título do Checkpoint"
                    name="title"
                    value={formState.title}
                    onChange={handleInputChange}
                    required
                    error={!!errors.title}
                    helperText={errors.title}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <AssignmentIcon color="primary" />
                            </InputAdornment>
                        ),
                    }}
                    placeholder="Ex: Finalizar protótipo da interface"
                    disabled={isSubmitting}
                />

                {/* Data de entrega */}
                <FormControl error={!!errors.dueDate}>
                    <TextField
                        label="Data de Entrega"
                        name="dueDate"
                        type="date"
                        value={formState.dueDate}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        error={!!errors.dueDate}
                        helperText={errors.dueDate}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CalendarMonthIcon color={errors.dueDate ? "error" : "primary"} />
                                </InputAdornment>
                            ),
                        }}
                        inputProps={{
                            min: dateConstraints.start,
                            max: dateConstraints.end
                        }}
                        InputLabelProps={{ shrink: true }}
                        fullWidth
                        required
                    />

                    {/* Informações adicionais sobre a data */}
                    {formState.dueDate && dateInfo && (
                        <Box sx={{ mt: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                    }}
                                >
                                    <AccessTimeIcon fontSize="small" />
                                    {dateInfo.daysFromToday === 0
                                        ? "Hoje"
                                        : dateInfo.daysFromToday < 0
                                            ? `${Math.abs(dateInfo.daysFromToday)} dias atrás`
                                            : `Em ${dateInfo.daysFromToday} dias`}
                                </Typography>

                                <IconButton
                                    size="small"
                                    onClick={() => setShowDateInfo(!showDateInfo)}
                                    sx={{ color: shouldShowDateWarning ? theme.palette.warning.main : theme.palette.primary.main }}
                                >
                                    {shouldShowDateWarning ? (
                                        <ErrorOutlineIcon fontSize="small" />
                                    ) : (
                                        <InfoIcon fontSize="small" />
                                    )}
                                </IconButton>
                            </Box>

                            <Collapse in={showDateInfo}>
                                <Box
                                    sx={{
                                        mt: 1,
                                        pt: 1,
                                        borderTop: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1
                                    }}
                                >
                                    {/* Barra de progresso da missão */}
                                    <Box sx={{ position: 'relative', mt: 1, mb: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={dateInfo.positionPercentage}
                                            sx={{
                                                height: 8,
                                                borderRadius: 5,
                                                bgcolor: alpha(theme.palette.divider, 0.2),
                                                '& .MuiLinearProgress-bar': {
                                                    borderRadius: 5,
                                                },
                                            }}
                                        />
                                        <Tooltip title="Este checkpoint">
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    left: `${dateInfo.positionPercentage}%`,
                                                    top: '50%',
                                                    width: 12,
                                                    height: 12,
                                                    bgcolor: theme.palette.primary.main,
                                                    border: `2px solid ${theme.palette.background.paper}`,
                                                    borderRadius: '50%',
                                                    transform: 'translate(-50%, -50%)',
                                                    zIndex: 1,
                                                    boxShadow: 1
                                                }}
                                            />
                                        </Tooltip>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                                            <Typography variant="caption" color="text.secondary">
                                                Início
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {dateInfo.positionPercentage}%
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Fim
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Informações adicionais */}
                                    <Stack spacing={0.5}>
                                        {dateInfo.isWeekendDay && (
                                            <Alert
                                                icon={<EventBusyIcon fontSize="inherit" />}
                                                severity="warning"
                                                sx={{ py: 0, borderRadius: 1 }}
                                            >
                                                <Typography variant="caption">
                                                    Este checkpoint está programado para um fim de semana
                                                </Typography>
                                            </Alert>
                                        )}

                                        {dateInfo.isCloseToDealine && (
                                            <Alert
                                                severity="info"
                                                sx={{ py: 0, borderRadius: 1 }}
                                                icon={<HourglassEmptyIcon fontSize="inherit" />}
                                            >
                                                <Typography variant="caption">
                                                    Próximo ao fim da missão (restam {dateInfo.daysToEnd} dias)
                                                </Typography>
                                            </Alert>
                                        )}
                                    </Stack>
                                </Box>
                            </Collapse>
                        </Box>
                    )}
                </FormControl>

                {/* Status */}
                <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                        name="status"
                        value={formState.status}
                        onChange={handleSelectChange}
                        label="Status"
                        disabled={isSubmitting}
                    >
                        <MenuItem value="pending">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PendingIcon sx={{ color: statusColor.pending }} />
                                <Typography>Pendente</Typography>
                            </Box>
                        </MenuItem>
                        <MenuItem value="in_progress">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LoopIcon sx={{ color: statusColor.in_progress }} />
                                <Typography>Em Progresso</Typography>
                            </Box>
                        </MenuItem>
                        <MenuItem value="completed">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckCircleIcon sx={{ color: statusColor.completed }} />
                                <Typography>Concluído</Typography>
                            </Box>
                        </MenuItem>
                    </Select>
                </FormControl>

                {/* Responsável */}
                <FormControl fullWidth error={!!errors.assignedTo} required>
                    <InputLabel>Atribuído a</InputLabel>
                    <Select
                        name="assignedTo"
                        value={formState.assignedTo}
                        onChange={handleSelectChange}
                        label="Atribuído a"
                        disabled={isSubmitting || teamMembers.length === 0}
                        startAdornment={
                            <InputAdornment position="start">
                                <PersonIcon color={errors.assignedTo ? "error" : "primary"} />
                            </InputAdornment>
                        }
                    >
                        {teamMembers.map((member) => (
                            <MenuItem key={member._id} value={member._id}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Avatar
                                        src={member.avatar}
                                        sx={{
                                            width: 24,
                                            height: 24,
                                            bgcolor: theme.palette.primary.main
                                        }}
                                    >
                                        {member.username.charAt(0).toUpperCase()}
                                    </Avatar>
                                    <Typography>{member.username}</Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.assignedTo && (
                        <FormHelperText>{errors.assignedTo}</FormHelperText>
                    )}

                    {teamMembers.length === 0 && (
                        <FormHelperText error>
                            Não há membros na equipe para atribuição
                        </FormHelperText>
                    )}
                </FormControl>

                {/* Preview do responsável */}
                {formState.assignedTo && renderAssignedUser()}

                {/* Botões de ação */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 2,
                        mt: 3
                    }}
                >
                    <Button
                        variant="outlined"
                        onClick={onClose}
                        startIcon={<CloseIcon />}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={isSubmitting}
                        sx={{
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        Salvar
                    </Button>
                </Box>
            </Stack>
        </Box>
    );
};

export default CheckpointForm;
