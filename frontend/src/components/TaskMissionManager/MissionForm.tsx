// frontend/src/components/TaskMissionManager/MissionForm.tsx
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Typography,
  IconButton,
  Modal,
  Snackbar,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid,
  useTheme,
  alpha,
  Avatar,
  Tooltip,
  Divider,
  Card,
  CardContent,
  Stack,
  InputAdornment,
  Fade,
  LinearProgress,
  AlertTitle
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../hooks/useAuth';
import CheckpointForm from './CheckpointForm';
import { Mission, User, Checkpoint } from '../../types';
// Ícones
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import TitleIcon from '@mui/icons-material/Title';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import GroupIcon from '@mui/icons-material/Group';
import FlagIcon from '@mui/icons-material/Flag';
import InfoIcon from '@mui/icons-material/Info';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import LoopIcon from '@mui/icons-material/Loop';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';

type MissionStatus = "pending" | "in_progress" | "completed" | "pendente" | "em-progresso" | "concluida";
type NormalizedStatus = "pending" | "in_progress" | "completed";

// Função para normalizar os vários tipos de status para um formato padrão
const normalizeStatus = (status: string | undefined): NormalizedStatus => {
  if (!status) return "pending";
  const statusLower = status.toLowerCase();
  if (statusLower === "completed" || statusLower === "concluida" || statusLower === "concluída") {
    return "completed";
  } else if (statusLower === "in_progress" || statusLower === "em-progresso") {
    return "in_progress";
  } else {
    return "pending";
  }
};

interface MissionFormProps {
  users: User[];
  onSubmit: (mission: Partial<Mission>) => void;
  onClose: () => void;
  initialMission?: Mission;
}

const MissionForm: React.FC<MissionFormProps> = ({ users, onSubmit, onClose, initialMission }) => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [mission, setMission] = useState<Partial<Mission>>({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    leader: '',
    team: [] as string[],
    tasks: [],
    checkpoints: [],
    createdBy: user?._id || '',
    status: 'pending',
    points: 0,
    comments: '',
    attachments: []
  });
  const [dateErrors, setDateErrors] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  });
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    leader?: string;
    checkpoints?: string;
  }>({});
  const [openCheckpointForm, setOpenCheckpointForm] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(true);

  // Duração da missão em dias
  const missionDuration = mission.startDate && mission.endDate
    ? Math.ceil((new Date(mission.endDate).getTime() - new Date(mission.startDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Checkpoints por status
  const checkpointsByStatus = React.useMemo(() => {
    const checkpoints = mission.checkpoints || [];
    return {
      completed: checkpoints.filter(cp => normalizeStatus(cp.status) === "completed").length,
      inProgress: checkpoints.filter(cp => normalizeStatus(cp.status) === "in_progress").length,
      pending: checkpoints.filter(cp => normalizeStatus(cp.status) === "pending").length,
      total: checkpoints.length
    };
  }, [mission.checkpoints]);

  const progressPercent = checkpointsByStatus.total > 0
    ? Math.round((checkpointsByStatus.completed / checkpointsByStatus.total) * 100)
    : 0;

  const statusColor = {
    pending: theme.palette.warning.main,
    in_progress: theme.palette.info.main,
    completed: theme.palette.success.main
  };

  // Função para criar datas UTC
  const createUTCDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12)).toISOString(); // Setting to noon UTC
  };

  // Função para formatar datas para inputs
  const formatDateForInput = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  };

  // Mapear status entre frontend e backend
  const mapStatusFromBackend = (status: MissionStatus): "pending" | "in_progress" | "completed" => {
    switch (status) {
      case "em-progresso": return "in_progress";
      case "pendente": return "pending";
      case "concluida": return "completed";
      default: return status as "pending" | "in_progress" | "completed";
    }
  };

  const mapStatusToBackend = (status: "pending" | "in_progress" | "completed"): MissionStatus => {
    switch (status) {
      case "in_progress": return "em-progresso";
      case "pending": return "pendente";
      case "completed": return "concluida";
    }
  };

  // Carregar dados iniciais da missão ou criar nova
  useEffect(() => {
    if (initialMission) {
      setMission({
        ...initialMission,
        team: initialMission.members || initialMission.team || [],
        status: mapStatusFromBackend(initialMission.status as MissionStatus),
        tasks: initialMission.tasks || [],
        checkpoints: Array.isArray(initialMission.checkpoints) ? initialMission.checkpoints : [],
        points: initialMission.points || 0,
        comments: initialMission.comments || '',
        attachments: initialMission.attachments || [],
        startDate: initialMission.startDate ? formatDateForInput(initialMission.startDate) : '',
        endDate: initialMission.endDate ? formatDateForInput(initialMission.endDate) : '',
      });
    } else {
      // Preparar uma nova missão com data inicial
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      setMission({
        title: '',
        description: '',
        startDate: today.toISOString().split('T')[0],
        endDate: nextWeek.toISOString().split('T')[0],
        leader: '',
        team: [],
        tasks: [],
        checkpoints: [],
        createdBy: user?._id || '',
        status: 'pending',
        points: 0,
        comments: '',
        attachments: []
      });
    }
    setIsLoading(false);
  }, [initialMission, user]);

  // Manipulação de mudanças em campos
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    if (name === 'leader') {
      // Ao mudar o líder, adicionar à equipe automaticamente
      setMission(prev => ({
        ...prev,
        leader: value,
        team: Array.from(new Set([value, ...(prev.team || [])])).filter(Boolean) as string[],
      }));
      // Limpar erro do líder
      setFormErrors(prev => ({ ...prev, leader: undefined }));
    } else if (name === 'title' && value) {
      // Limpar erro do título quando tiver valor
      setFormErrors(prev => ({ ...prev, title: undefined }));
      setMission(prev => ({ ...prev, [name]: value }));
    } else if (name === 'startDate' || name === 'endDate') {
      // Processar datas
      if (value) {
        setMission(prev => ({ ...prev, [name]: value }));
        validateDates(name, value);
      } else {
        setMission(prev => ({ ...prev, [name]: '' }));
      }
    } else {
      // Campos padrão
      setMission(prev => ({ ...prev, [name]: value }));
    }
  };

  // Seleção múltipla para membros da equipe
  const handleSelectChange = (event: SelectChangeEvent<string[]>) => {
    const { name, value } = event.target;
    if (name === 'team') {
      const updatedTeam = Array.from(new Set([
        ...(typeof value === 'string' ? [value] : value),
        mission.leader
      ])).filter(Boolean) as string[];
      setMission(prev => ({ ...prev, team: updatedTeam }));
    } else {
      setMission(prev => ({ ...prev, [name]: value }));
    }
  };

  // Validação de datas
  const validateDates = (field: string, value: string) => {
    if (!value) {
      setDateErrors(prev => ({ ...prev, [field]: 'Data é obrigatória' }));
      return false;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(value);
    let errors = { ...dateErrors };
    // Não verificamos se a data é anterior a hoje, pois pode-se estar editando uma missão antiga
    if (field === 'endDate' && mission.startDate) {
      const startDate = new Date(mission.startDate);
      if (selectedDate < startDate) {
        errors.endDate = 'A data de término não pode ser anterior à data de início';
      } else {
        errors.endDate = '';
      }
    } else {
      errors[field as keyof typeof dateErrors] = '';
    }
    setDateErrors(errors);
    return !errors.startDate && !errors.endDate;
  };

  // Gerenciamento de checkpoints
  const editCheckpoint = (checkpoint: Checkpoint) => {
    setSelectedCheckpoint(checkpoint);
    setOpenCheckpointForm(true);
  };

  const addNewCheckpoint = () => {
    setSelectedCheckpoint(null);
    setOpenCheckpointForm(true);
  };

  const removeCheckpoint = (index: number) => {
    setMission(prev => {
      const updatedCheckpoints = [...(prev.checkpoints || [])];
      updatedCheckpoints.splice(index, 1);
      return { ...prev, checkpoints: updatedCheckpoints };
    });
    // Notificar o usuário
    showSnackbar('Checkpoint removido com sucesso', 'success');
  };

  const handleCheckpointSubmit = (checkpointData: Omit<Checkpoint, 'id'>) => {
    if (selectedCheckpoint) {
      // Editar checkpoint existente
      setMission(prev => ({
        ...prev,
        checkpoints: (prev.checkpoints || []).map(cp =>
          cp.id === selectedCheckpoint.id
            ? { ...checkpointData, id: selectedCheckpoint.id }
            : cp
        )
      }));
      showSnackbar('Checkpoint atualizado com sucesso', 'success');
    } else {
      // Adicionar novo checkpoint
      const newCheckpoint: Checkpoint = {
        id: uuidv4(),
        ...checkpointData,
      };
      setMission(prev => ({
        ...prev,
        checkpoints: [...(prev.checkpoints || []), newCheckpoint]
      }));
      showSnackbar('Checkpoint adicionado com sucesso', 'success');
    }
    setOpenCheckpointForm(false);
    setSelectedCheckpoint(null);
    // Limpar erro de checkpoints
    if (formErrors.checkpoints) {
      setFormErrors(prev => ({ ...prev, checkpoints: undefined }));
    }
  };

  // Exibir mensagem ao usuário
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Validação de formulário
  const validateForm = (): boolean => {
    const errors: {
      title?: string;
      leader?: string;
      checkpoints?: string;
    } = {};
    if (!mission.title) {
      errors.title = 'O título da missão é obrigatório';
    }
    if (!mission.leader) {
      errors.leader = 'O líder da missão é obrigatório';
    }
    // Se for a etapa de checkpoints e não tiver nenhum, mostrar alerta
    if (activeStep === 1 && (!mission.checkpoints || mission.checkpoints.length === 0)) {
      errors.checkpoints = 'Adicione pelo menos um checkpoint para a missão';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submissão do formulário
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validar datas e campos obrigatórios
    if (!validateForm()) {
      showSnackbar('Por favor, corrija os erros no formulário', 'error');
      return;
    }
    if (mission.startDate && mission.endDate &&
      validateDates('startDate', mission.startDate) &&
      validateDates('endDate', mission.endDate)) {
      // Converter datas para ISO
      const submissionData: Partial<Mission> = {
        ...mission,
        startDate: createUTCDate(mission.startDate),
        endDate: createUTCDate(mission.endDate),
        status: mapStatusToBackend(mission.status as "pending" | "in_progress" | "completed"),
        members: mission.team,
      };
      onSubmit(submissionData);
      onClose();
      showSnackbar(
        initialMission ? 'Missão atualizada com sucesso' : 'Nova missão criada com sucesso',
        'success'
      );
    } else {
      showSnackbar('Por favor, corrija as datas', 'error');
    }
  };

  // Navegação entre etapas
  const handleNext = () => {
    if (!validateForm()) {
      return;
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  // Renderização do status com ícone
  const renderStatus = (status: string) => {
    let icon = <PendingIcon />;
    let color = statusColor.pending;
    let label = "Pendente";
    switch (status) {
      case 'in_progress':
        icon = <LoopIcon />;
        color = statusColor.in_progress;
        label = "Em Progresso";
        break;
      case 'completed':
        icon = <CheckCircleIcon />;
        color = statusColor.completed;
        label = "Concluída";
        break;
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="span" sx={{ color }}>{icon}</Box>
        <Box component="span">{label}</Box>
      </Box>
    );
  };

  // Mostrar loading enquanto carrega dados
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Verificar se há usuários disponíveis
  if (!users || users.length === 0) {
    return (
      <Alert severity="warning" sx={{ mb: 2 }}>
        Não há usuários disponíveis para criar uma missão.
      </Alert>
    );
  }

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      sx={{ width: '100%' }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 0,
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: theme.shadows[2],
          position: 'relative',
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        {/* Cabeçalho colorido */}
        <Box
          sx={{
            p: 3,
            pb: 7,
            background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Elementos decorativos */}
          <Box
            sx={{
              position: 'absolute',
              width: '200px',
              height: '200px',
              borderRadius: '50%',
              background: alpha('#fff', 0.1),
              top: -100,
              right: -50,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: alpha('#fff', 0.05),
              bottom: -40,
              left: '30%',
            }}
          />
          <Typography
            variant="h4"
            fontWeight="700"
            sx={{
              mb: 1,
              position: 'relative',
              textShadow: '0px 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            {initialMission ? 'Editar Missão' : 'Nova Missão'}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              opacity: 0.9,
              position: 'relative',
              maxWidth: '600px',
            }}
          >
            {initialMission
              ? 'Modifique os detalhes da missão e os checkpoints para acompanhar o progresso do projeto.'
              : 'Crie uma nova missão e adicione checkpoints para acompanhar o progresso do projeto.'}
          </Typography>
        </Box>
        {/* Conteúdo principal */}
        <Box sx={{
          p: 3,
          mt: -5,
          borderRadius: '16px 16px 0 0',
          bgcolor: 'background.paper',
          position: 'relative',
        }}>
          {/* Stepper horizontal moderno */}
          <Stepper
            activeStep={activeStep}
            sx={{
              pt: 2,
              pb: 4,
              '& .MuiStepLabel-iconContainer': {
                '& .MuiStepIcon-root': {
                  color: theme.palette.primary.main,
                  '&.Mui-active': {
                    color: theme.palette.primary.main,
                  },
                },
              },
            }}
          >
            <Step key="basic-info">
              <StepLabel StepIconProps={{
                icon: <InfoIcon />,
              }}>
                <Typography variant="subtitle2">Informações Básicas</Typography>
              </StepLabel>
            </Step>
            <Step key="checkpoints">
              <StepLabel StepIconProps={{
                icon: <PlaylistAddCheckIcon />,
              }}>
                <Typography variant="subtitle2">Checkpoints</Typography>
              </StepLabel>
            </Step>
          </Stepper>
          {/* Conteúdo do formulário */}
          <Box component="form" onSubmit={handleSubmit}>
            {/* Etapa 1: Informações Básicas */}
            {activeStep === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Grid container spacing={3}>
                  {/* Título da Missão */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Título da Missão"
                      name="title"
                      value={mission.title}
                      onChange={handleChange}
                      required
                      error={!!formErrors.title}
                      helperText={formErrors.title}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <TitleIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      placeholder="Digite um título claro e objetivo para a missão"
                    />
                  </Grid>
                  {/* Descrição da Missão */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Descrição Detalhada"
                      name="description"
                      value={mission.description}
                      onChange={handleChange}
                      multiline
                      rows={4}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                            <DescriptionIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ '& .MuiInputAdornment-root': { alignSelf: 'flex-start', mt: 2 } }}
                      placeholder="Descreva os objetivos, requisitos e contexto desta missão"
                    />
                  </Grid>
                  {/* Datas */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Data de Início"
                      name="startDate"
                      type="date"
                      value={mission.startDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      required
                      error={!!dateErrors.startDate}
                      helperText={dateErrors.startDate}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarTodayIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Data de Término"
                      name="endDate"
                      type="date"
                      value={mission.endDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      required
                      error={!!dateErrors.endDate}
                      helperText={dateErrors.endDate}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EventIcon color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  {/* Duração da missão (informativo) */}
                  {mission.startDate && mission.endDate && !dateErrors.startDate && !dateErrors.endDate && (
                    <Grid item xs={12}>
                      <Fade in={true}>
                        <Alert
                          severity="info"
                          variant="outlined"
                          sx={{ '& .MuiAlert-message': { width: '100%' } }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <Typography variant="body2">
                              Duração da missão: <strong>{missionDuration} dias</strong>
                            </Typography>
                            {missionDuration > 90 && (
                              <Typography variant="caption" color="text.secondary">
                                Missão de longo prazo (recomendamos checkpoints intermediários)
                              </Typography>
                            )}
                          </Box>
                        </Alert>
                      </Fade>
                    </Grid>
                  )}
                  {/* Líder da Missão */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required error={!!formErrors.leader}>
                      <InputLabel>Líder da Missão</InputLabel>
                      <Select
                        name="leader"
                        value={mission.leader || ''}
                        onChange={handleChange}
                        startAdornment={
                          <InputAdornment position="start">
                            <PersonIcon color="primary" />
                          </InputAdornment>
                        }
                      >
                        {users.map(u => (
                          <MenuItem key={u._id} value={u._id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                src={u.avatar || undefined}
                                sx={{ width: 24, height: 24 }}
                              >
                                {u.username.charAt(0)}
                              </Avatar>
                              <Typography>{u.username}</Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.leader && (
                        <Typography color="error" variant="caption" sx={{ mt: 0.5, ml: 2 }}>
                          {formErrors.leader}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                  {/* Status da Missão */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Status da Missão</InputLabel>
                      <Select
                        name="status"
                        value={mission.status || "pending"}
                        onChange={handleChange}
                        label="Status da Missão"
                      >
                        <MenuItem value="pending">
                          {renderStatus("pending")}
                        </MenuItem>
                        <MenuItem value="in_progress">
                          {renderStatus("in_progress")}
                        </MenuItem>
                        <MenuItem value="completed">
                          {renderStatus("completed")}
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* Time Responsável */}
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Time Responsável</InputLabel>
                      <Select
                        name="team"
                        multiple
                        value={mission.team || []}
                        onChange={handleSelectChange}
                        input={<OutlinedInput label="Time Responsável" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map(value => {
                              const selectedUser = users.find(u => u._id === value);
                              return (
                                <Chip
                                  key={value}
                                  label={selectedUser?.username || 'Usuário'}
                                  sx={{
                                    bgcolor: value === mission.leader ? alpha(theme.palette.primary.main, 0.1) : undefined,
                                    border: value === mission.leader ? `1px solid ${theme.palette.primary.main}` : undefined,
                                    fontWeight: value === mission.leader ? 600 : 400,
                                  }}
                                  avatar={
                                    <Avatar
                                      src={selectedUser?.avatar || undefined}
                                      sx={{
                                        bgcolor: value === mission.leader ? theme.palette.primary.main : undefined,
                                      }}
                                    >
                                      {selectedUser?.username.charAt(0)}
                                    </Avatar>
                                  }
                                />
                              );
                            })}
                          </Box>
                        )}
                        startAdornment={
                          <InputAdornment position="start">
                            <GroupIcon color="primary" />
                          </InputAdornment>
                        }
                      >
                        {users.map(u => (
                          <MenuItem
                            key={u._id}
                            value={u._id}
                            disabled={u._id === mission.leader}
                            sx={{
                              bgcolor: u._id === mission.leader ? alpha(theme.palette.primary.main, 0.05) : undefined,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, width: '100%' }}>
                              <Avatar
                                src={u.avatar || undefined}
                                sx={{ width: 24, height: 24 }}
                              >
                                {u.username.charAt(0)}
                              </Avatar>
                              <Typography sx={{ flex: 1 }}>{u.username}</Typography>
                              {u._id === mission.leader && (
                                <Chip
                                  label="Líder"
                                  size="small"
                                  color="primary"
                                  sx={{ height: 20, '& .MuiChip-label': { px: 1, py: 0.5, fontSize: '0.7rem' } }}
                                />
                              )}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </motion.div>
            )}
            {/* Etapa 2: Checkpoints */}
            {activeStep === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Área de estatísticas */}
                <Box
                  sx={{
                    mb: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.background.default, 0.5),
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  }}
                >
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <Stack spacing={1}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Progresso da Missão
                        </Typography>
                        <Box sx={{ position: 'relative', pt: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={progressPercent}
                                sx={{
                                  height: 8,
                                  borderRadius: 5,
                                  bgcolor: alpha(theme.palette.divider, 0.2),
                                  '& .MuiLinearProgress-bar': {
                                    borderRadius: 5,
                                  },
                                }}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">{`${progressPercent}%`}</Typography>
                            </Box>
                          </Box>
                        </Box>
                      </Stack>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Stack direction="row" spacing={2} justifyContent="space-around">
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight="bold" color={statusColor.completed}>
                            {checkpointsByStatus.completed}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Concluídos
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight="bold" color={statusColor.in_progress}>
                            {checkpointsByStatus.inProgress}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Em Progresso
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" fontWeight="bold" color={statusColor.pending}>
                            {checkpointsByStatus.pending}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Pendentes
                          </Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
                {/* Lista de checkpoints */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        fontWeight: 600,
                      }}
                    >
                      <FlagIcon color="primary" />
                      Checkpoints
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={addNewCheckpoint}
                      size="small"
                      color="primary"
                      sx={{ borderRadius: 6, px: 2 }}
                    >
                      Adicionar
                    </Button>
                  </Box>
                  {formErrors.checkpoints && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {formErrors.checkpoints}
                    </Alert>
                  )}
                  {mission.checkpoints && mission.checkpoints.length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Grid container spacing={2}>
                        {mission.checkpoints.map((cp, index) => {
                          const normalizedStatus = normalizeStatus(cp.status);
                          return (
                            <Grid item xs={12} sm={6} md={4} key={cp.id}>
                              <Card
                                variant="outlined"
                                sx={{
                                  height: '100%',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  borderRadius: 2,
                                  transition: 'all 0.2s ease-in-out',
                                  position: 'relative',
                                  overflow: 'visible',
                                  borderColor:
                                    normalizedStatus === "completed"
                                      ? statusColor.completed
                                      : normalizedStatus === "in_progress"
                                        ? statusColor.in_progress
                                        : theme.palette.divider,
                                  '&:hover': {
                                    boxShadow: theme.shadows[2],
                                    transform: 'translateY(-4px)',
                                  }
                                }}
                              >
                                {/* Indicador de status */}
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    top: -8,
                                    right: -8,
                                    zIndex: 1,
                                    boxShadow: 1,
                                    borderRadius: '50%',
                                    bgcolor: 'background.paper',
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      bgcolor:
                                        normalizedStatus === "completed"
                                          ? statusColor.completed
                                          : normalizedStatus === "in_progress"
                                            ? statusColor.in_progress
                                            : statusColor.pending,
                                    }}
                                  >
                                    {normalizedStatus === "completed"
                                      ? <CheckCircleIcon sx={{ fontSize: 16 }} />
                                      : normalizedStatus === "in_progress"
                                        ? <LoopIcon sx={{ fontSize: 16 }} />
                                        : <PendingIcon sx={{ fontSize: 16 }} />
                                    }
                                  </Avatar>
                                </Box>
                                <CardContent sx={{ pt: 2, pb: '16px !important', flex: 1 }}>
                                  <Typography variant="subtitle1" fontWeight={500} gutterBottom noWrap>
                                    {cp.title}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <CalendarTodayIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(cp.dueDate).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                  {cp.assignedTo && (
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                      <PersonIcon fontSize="small" sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                                      <Typography variant="caption" color="text.secondary">
                                        {users.find(u => u._id === cp.assignedTo)?.username || 'Responsável'}
                                      </Typography>
                                    </Box>
                                  )}
                                </CardContent>
                                <Divider />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1 }}>
                                  <Tooltip title="Editar checkpoint">
                                    <IconButton
                                      size="small"
                                      onClick={() => editCheckpoint(cp)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Remover checkpoint">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => removeCheckpoint(index)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    </motion.div>
                  ) : (
                    <Card
                      variant="outlined"
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        borderStyle: 'dashed',
                        borderWidth: 2,
                        borderRadius: 2,
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      }}
                    >
                      <FlagIcon
                        sx={{
                          fontSize: 40,
                          color: alpha(theme.palette.primary.main, 0.5),
                          mb: 1
                        }}
                      />
                      <Typography variant="subtitle1" gutterBottom>
                        Nenhum checkpoint adicionado
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Checkpoints ajudam a dividir a missão em etapas mais gerenciáveis.
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={addNewCheckpoint}
                        color="primary"
                      >
                        Adicionar Checkpoint
                      </Button>
                    </Card>
                  )}
                </Box>
                {/* Dicas para checkpoints */}
                {mission.checkpoints && mission.checkpoints.length > 0 && missionDuration > 30 && (
                  <Alert severity="info" variant="outlined" sx={{ mt: 3 }}>
                    <AlertTitle>Dica</AlertTitle>
                    Para missões de longa duração ({missionDuration} dias), é recomendável adicionar
                    checkpoints intermediários para melhor acompanhamento do progresso.
                  </Alert>
                )}
              </motion.div>
            )}
            {/* Botões de navegação */}
            <Box sx={{ display: 'flex', flexDirection: 'row', pt: 3, mt: 2, borderTop: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={onClose}
                startIcon={<CloseIcon />}
              >
                Cancelar
              </Button>
              <Box sx={{ flex: '1 1 auto' }} />
              {activeStep > 0 && (
                <Button
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                  startIcon={<NavigateBeforeIcon />}
                  variant="outlined"
                >
                  Voltar
                </Button>
              )}
              {activeStep === 0 ? (
                <Button
                  onClick={handleNext}
                  variant="contained"
                  endIcon={<NavigateNextIcon />}
                >
                  Próximo
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                >
                  {initialMission ? 'Salvar Alterações' : 'Criar Missão'}
                </Button>
              )}
            </Box>
          </Box>
        </Box>
      </Paper>
      {/* Modal para formulário de checkpoint */}
      <Modal
        open={openCheckpointForm}
        onClose={() => setOpenCheckpointForm(false)}
        aria-labelledby="modal-checkpoint-form"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflowY: 'auto',
            bgcolor: 'background.paper',
            borderRadius: 3,
            boxShadow: 24,
            p: 0,
          }}
        >
          <Box
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: `1px solid ${theme.palette.divider}`,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            }}
          >
            <Typography variant="h6" component="h2">
              {selectedCheckpoint ? "Editar Checkpoint" : "Novo Checkpoint"}
            </Typography>
            <IconButton onClick={() => setOpenCheckpointForm(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ p: 3 }}>
            <CheckpointForm
              onSubmit={handleCheckpointSubmit}
              onClose={() => setOpenCheckpointForm(false)}
              initialCheckpoint={selectedCheckpoint || undefined}
              teamMembers={[
                // Correção aqui: Adicionando company e permissions aos usuários
                {
                  _id: mission.leader || '',
                  username: users.find(u => u._id === mission.leader)?.username || 'Líder',
                  email: users.find(u => u._id === mission.leader)?.email || '',
                  role: users.find(u => u._id === mission.leader)?.role || 'User',
                  company: users.find(u => u._id === mission.leader)?.company || '',
                  permissions: users.find(u => u._id === mission.leader)?.permissions || [],
                  avatar: users.find(u => u._id === mission.leader)?.avatar
                },
                ...(mission.team || []).map(userId => {
                  const user = users.find(u => u._id === userId);
                  return {
                    _id: userId,
                    username: user?.username || 'Membro da equipe',
                    email: user?.email || '',
                    role: user?.role || 'User',
                    company: user?.company || '',
                    permissions: user?.permissions || [],
                    avatar: user?.avatar
                  };
                })
              ].filter((member, index, self) =>
                // Remover duplicatas (caso o líder também esteja na lista de membros)
                index === self.findIndex(m => m._id === member._id)
              )}
              missionStartDate={mission.startDate || ''}
              missionEndDate={mission.endDate || ''}
            />
          </Box>
        </Box>
      </Modal>
      {/* Snackbar para notificações */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MissionForm;
