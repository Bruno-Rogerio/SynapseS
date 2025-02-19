import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  IconButton,
  Modal,
  Snackbar,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import AddIcon from '@mui/icons-material/Add';
import config from '../config';
import InviteUserForm from './InviteUserForm';

const API_BASE_URL = config.API_BASE_URL;

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: string;
  inviteStatus: 'active' | 'pending' | 'accepted';
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [changes, setChanges] = useState<{ [key: string]: string }>({});
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      const usersData = response.data.map((user: any) => ({
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        inviteStatus: user.inviteStatus,
      }));
      console.log('Usuários recebidos:', usersData);  // Log dos usuários recebidos
      setUsers(usersData);
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar usuários');
      setLoading(false);
    }
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    console.log(`Alterando função do usuário ${userId} para ${newRole}`);
    setChanges(prevChanges => ({ ...prevChanges, [userId]: newRole }));
  };

  const saveChanges = async () => {
    console.log('Salvando alterações:', changes);
    setLoading(true);
    try {
      await Promise.all(
        Object.entries(changes).map(([userId, newRole]) =>
          axios.put(`${API_BASE_URL}/api/users/${userId}`, { role: newRole })
        )
      );
      setChanges({});
      await fetchUsers();
      setSnackbarMessage('Alterações salvas com sucesso!');
      setSnackbarOpen(true);
    } catch (err) {
      setError('Erro ao salvar alterações');
      setSnackbarMessage('Erro ao salvar alterações. Tente novamente.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await axios.delete(`${API_BASE_URL}/api/users/${userId}`);
        await fetchUsers();
        setSnackbarMessage('Usuário excluído com sucesso!');
        setSnackbarOpen(true);
      } catch (err) {
        setError('Erro ao excluir usuário');
        setSnackbarMessage('Erro ao excluir usuário. Tente novamente.');
        setSnackbarOpen(true);
      }
    }
  };

  const resendInvite = async (userId: string) => {
    try {
      await axios.post(`${API_BASE_URL}/api/invites/resend/${userId}`);
      setSnackbarMessage('Convite reenviado com sucesso!');
      setSnackbarOpen(true);
    } catch (err) {
      setError('Erro ao reenviar convite');
      setSnackbarMessage('Erro ao reenviar convite. Tente novamente.');
      setSnackbarOpen(true);
    }
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Gerenciamento de Usuários
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => setIsInviteFormOpen(true)}
        sx={{ mb: 2 }}
      >
        Convidar Novo Usuário
      </Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome de Usuário</TableCell>
              <TableCell>Nome Completo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Função</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.fullName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={changes[user.id] || user.role}
                    onChange={(e) => {
                      console.log('Selecionado:', e.target.value, 'para usuário:', user.id);
                      handleRoleChange(user.id, e.target.value as string);
                    }}
                    disabled={user.inviteStatus === 'pending'}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="manager">Manager</MenuItem>
                    <MenuItem value="user">User</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.inviteStatus}
                    color={
                      user.inviteStatus === 'active'
                        ? 'success'
                        : user.inviteStatus === 'pending'
                          ? 'warning'
                          : 'default'
                    }
                  />
                </TableCell>
                <TableCell>
                  {user.inviteStatus === 'pending' ? (
                    <IconButton onClick={() => resendInvite(user.id)}>
                      <EmailIcon />
                    </IconButton>
                  ) : (
                    <IconButton onClick={() => deleteUser(user.id)}>
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {Object.keys(changes).length > 0 && (
        <Button
          variant="contained"
          color="primary"
          onClick={saveChanges}
          sx={{ mt: 2 }}
        >
          Salvar Alterações
        </Button>
      )}
      <Modal
        open={isInviteFormOpen}
        onClose={() => setIsInviteFormOpen(false)}
        aria-labelledby="invite-modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
        }}>
          <Typography id="invite-modal-title" variant="h6" component="h2">
            Convidar Novo Usuário
          </Typography>
          <InviteUserForm onInviteSent={() => {
            setIsInviteFormOpen(false);
            fetchUsers();
            setSnackbarMessage('Convite enviado com sucesso!');
            setSnackbarOpen(true);
          }} />
        </Box>
      </Modal>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default UserManagement;
