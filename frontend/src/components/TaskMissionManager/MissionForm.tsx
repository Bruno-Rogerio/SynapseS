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
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../hooks/useAuth';
import CheckpointForm from './CheckpointForm';
import { Mission, User, Checkpoint } from '../../types';

type MissionStatus = "pending" | "in_progress" | "completed" | "pendente" | "em-progresso" | "concluida";

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
    startDate: '',
    endDate: '',
    leader: '',
    team: [] as string[],
    tasks: [],
    checkpoints: [],
    createdBy: user?._id || '',
    status: 'pending',
    points: 0,
    comments: '',
    attachments: [],
    color: 'teal',
  });
  const [dateErrors, setDateErrors] = useState<{ startDate: string; endDate: string }>({
    startDate: '',
    endDate: '',
  });
  const [openCheckpointForm, setOpenCheckpointForm] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const createUTCDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 12)); // Setting to noon UTC
  };

  const formatDateForInput = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toISOString().split('T')[0];
  };

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

  useEffect(() => {
    if (initialMission) {
      console.log('Initial Mission:', initialMission);
      setMission({
        ...initialMission,
        team: initialMission.members || initialMission.team || [],
        status: mapStatusFromBackend(initialMission.status as MissionStatus),
        tasks: initialMission.tasks || [],
        checkpoints: Array.isArray(initialMission.checkpoints) ? initialMission.checkpoints : [],
        points: initialMission.points || 0,
        comments: initialMission.comments || '',
        attachments: initialMission.attachments || [],
        color: initialMission.color || 'teal',
      });
    } else {
      setMission({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        leader: '',
        team: [],
        tasks: [],
        checkpoints: [],
        createdBy: user?._id || '',
        status: 'pending',
        points: 0,
        comments: '',
        attachments: [],
        color: 'teal',
      });
    }
    setIsLoading(false);
  }, [initialMission, user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    if (name === 'leader') {
      setMission(prev => ({
        ...prev,
        leader: value,
        team: Array.from(new Set([value, ...(prev.team || [])])).filter(Boolean) as string[],
      }));
    } else if (name === 'startDate' || name === 'endDate') {
      if (value) {
        const utcDate = createUTCDate(value);
        setMission(prev => ({ ...prev, [name]: utcDate.toISOString() }));
        validateDates(name, utcDate.toISOString());
      }
    } else {
      setMission(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string[]>) => {
    const { name, value } = event.target;
    if (name === 'team') {
      const updatedTeam = Array.from(new Set([mission.leader, ...value])).filter(Boolean) as string[];
      setMission(prev => ({ ...prev, team: updatedTeam }));
    } else {
      setMission(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateDates = (field: string, value: string | undefined) => {
    if (!value) {
      setDateErrors(prev => ({ ...prev, [field]: 'Data é obrigatória' }));
      return false;
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const selectedDate = new Date(value);
    let errors = { ...dateErrors };
    if (selectedDate < today) {
      errors[field as keyof typeof dateErrors] = 'A data não pode ser anterior a hoje';
    } else {
      errors[field as keyof typeof dateErrors] = '';
    }
    if (field === 'endDate' && mission.startDate) {
      const startDate = new Date(mission.startDate);
      if (selectedDate < startDate) {
        errors.endDate = 'A data de término não pode ser anterior à data de início';
      }
    }
    setDateErrors(errors);
    return !errors.startDate && !errors.endDate;
  };

  const removeCheckpoint = (index: number) => {
    setMission(prev => ({
      ...prev,
      checkpoints: prev.checkpoints?.filter((_, idx) => idx !== index),
    }));
  };

  const handleCheckpointSubmit = (checkpointData: Omit<Checkpoint, 'id'>) => {
    const newCheckpoint: Checkpoint = {
      id: uuidv4(),
      ...checkpointData,
    };
    setMission(prev => ({
      ...prev,
      checkpoints: [...(prev.checkpoints || []), newCheckpoint]
    }));
    setOpenCheckpointForm(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mission.startDate && mission.endDate &&
      validateDates('startDate', mission.startDate) &&
      validateDates('endDate', mission.endDate)) {
      const submissionData: Partial<Mission> = {
        ...mission,
        status: mapStatusToBackend(mission.status as "pending" | "in_progress" | "completed"),
        members: Array.from(new Set([mission.leader, ...(mission.team || [])])).filter(Boolean) as string[],
        checkpoints: mission.checkpoints || [],
      };
      console.log('Dados da missão a serem enviados:', submissionData);
      onSubmit(submissionData);
      onClose(); // Fechar o modal após a submissão
    } else {
      setSnackbarMessage('Por favor, preencha todas as datas corretamente');
      setSnackbarOpen(true);
    }
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!mission.title || !mission.startDate || !mission.endDate || !mission.leader) {
        setSnackbarMessage('Por favor, preencha todos os campos obrigatórios');
        setSnackbarOpen(true);
        return;
      }
      if (!validateDates('startDate', mission.startDate) || !validateDates('endDate', mission.endDate)) {
        setSnackbarMessage('Por favor, corrija as datas');
        setSnackbarOpen(true);
        return;
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    if (activeStep === 1) {
      // Validar se as datas dos checkpoints estão dentro do intervalo da missão
      const invalidCheckpoints = mission.checkpoints?.filter(cp =>
        new Date(cp.dueDate) < new Date(mission.startDate!) ||
        new Date(cp.dueDate) > new Date(mission.endDate!)
      );

      if (invalidCheckpoints && invalidCheckpoints.length > 0) {
        setSnackbarMessage('Alguns checkpoints estão fora do período da missão. Por favor, ajuste-os antes de continuar.');
        setSnackbarOpen(true);
        return;
      }
    }
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  if (isLoading) {
    return <CircularProgress />;
  }

  if (!users || users.length === 0) {
    return <Typography>Não há usuários disponíveis.</Typography>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 800, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom color="primary" align="center">
        {initialMission ? 'Editar Missão' : 'Nova Missão'}
      </Typography>
      <Stepper activeStep={activeStep} sx={{ mt: 3, mb: 4 }}>
        <Step key="basic-info">
          <StepLabel>Informações Básicas</StepLabel>
        </Step>
        <Step key="checkpoints">
          <StepLabel>Checkpoints</StepLabel>
        </Step>
      </Stepper>
      <Box component="form" onSubmit={handleSubmit}>
        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Objetivo da Missão"
                name="title"
                value={mission.title}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="description"
                value={mission.description}
                onChange={handleChange}
                multiline
                rows={4}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Início"
                name="startDate"
                type="date"
                value={mission.startDate ? formatDateForInput(mission.startDate) : ''}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                error={!!dateErrors.startDate}
                helperText={dateErrors.startDate}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Término"
                name="endDate"
                type="date"
                value={mission.endDate ? formatDateForInput(mission.endDate) : ''}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                required
                error={!!dateErrors.endDate}
                helperText={dateErrors.endDate}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Líder da Missão</InputLabel>
                <Select name="leader" value={mission.leader} onChange={handleChange}>
                  {users.map(u => (
                    <MenuItem key={u._id} value={u._id}>
                      {u.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Status da Missão</InputLabel>
                <Select
                  name="status"
                  value={mission.status}
                  onChange={handleChange}
                  label="Status da Missão"
                >
                  <MenuItem value="pending">Pendente</MenuItem>
                  <MenuItem value="in_progress">Em Progresso</MenuItem>
                  <MenuItem value="completed">Concluída</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Time Responsável</InputLabel>
                <Select
                  name="team"
                  multiple
                  value={mission.team}
                  onChange={handleSelectChange}
                  input={<OutlinedInput label="Time Responsável" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(selected as string[]).map(value => (
                        <Chip key={value} label={users.find(u => u._id === value)?.username || 'Usuário'} />
                      ))}
                    </Box>
                  )}
                >
                  {users.map(u => (
                    <MenuItem key={u._id} value={u._id} disabled={u._id === mission.leader}>
                      {u.username}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
        {activeStep === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>Checkpoints</Typography>
            {mission.checkpoints && mission.checkpoints.length > 0 ? (
              mission.checkpoints.map((cp, index) => (
                <Paper key={cp.id} elevation={1} sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ flexGrow: 1 }}>
                    {cp.title} - Entrega: {new Date(cp.dueDate).toLocaleDateString()}
                  </Typography>
                  <IconButton onClick={() => removeCheckpoint(index)} size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))
            ) : (
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Nenhum checkpoint adicionado ainda.
              </Typography>
            )}
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setOpenCheckpointForm(true)}
              sx={{ mt: 2 }}
            >
              Adicionar Checkpoint
            </Button>
          </Box>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2, mt: 3 }}>
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Voltar
          </Button>
          <Box sx={{ flex: '1 1 auto' }} />
          {activeStep === 1 ? (
            <Button onClick={handleSubmit} variant="contained" color="primary">
              Finalizar
            </Button>
          ) : (
            <Button onClick={handleNext} variant="contained">
              Próximo
            </Button>
          )}
        </Box>
      </Box>
      <Modal
        open={openCheckpointForm}
        onClose={() => setOpenCheckpointForm(false)}
        aria-labelledby="modal-checkpoint-form"
      >
        <Paper
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: 500,
            maxHeight: '90vh',
            p: 4,
            overflowY: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Novo Checkpoint
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setOpenCheckpointForm(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
          <CheckpointForm
            onSubmit={handleCheckpointSubmit}
            onClose={() => setOpenCheckpointForm(false)}
            teamMembers={[
              {
                _id: mission.leader || '',
                username: users.find(u => u._id === mission.leader)?.username || 'Líder',
                email: users.find(u => u._id === mission.leader)?.email || '',
                role: users.find(u => u._id === mission.leader)?.role || 'User'
              },
              ...(mission.team || []).map(userId => {
                const user = users.find(u => u._id === userId);
                return {
                  _id: userId,
                  username: user?.username || 'Membro da equipe',
                  email: user?.email || '',
                  role: user?.role || 'User'
                };
              })
            ]}
            missionStartDate={mission.startDate || ''}
            missionEndDate={mission.endDate || ''}
          />
        </Paper>
      </Modal>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Paper>
  );
};

export default MissionForm;
