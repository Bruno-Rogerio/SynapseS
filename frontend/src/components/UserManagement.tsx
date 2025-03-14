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
  FormControl,
  InputLabel,
  Stack,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles'; // Importação correta do alpha
import DeleteIcon from '@mui/icons-material/Delete';
import EmailIcon from '@mui/icons-material/Email';
import AddIcon from '@mui/icons-material/Add';
import FilterListIcon from '@mui/icons-material/FilterList';
import BusinessIcon from '@mui/icons-material/Business';
import RefreshIcon from '@mui/icons-material/Refresh';
import config from '../config';
import InviteUserForm from './InviteUserForm';

const API_BASE_URL = config.API_BASE_URL;

// Interface atualizada para incluir company e permissions
interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role?: string; // Opcional, mantido para compatibilidade
  permissions: string[]; // Nova propriedade
  company: any; // Pode ser string ou objeto
  inviteStatus: 'active' | 'pending' | 'accepted';
}

// Tipo para armazenar as mudanças de permissões
interface PermissionChanges {
  [userId: string]: {
    add: string[];
    remove: string[];
  }
}

// Lista de permissões disponíveis
const AVAILABLE_PERMISSIONS = [
  'admin',
  'manage_users',
  'view_users',
  'edit_users',
  'delete_users',
  'manage_content',
  'view_reports',
  'edit_settings',
];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionChanges, setPermissionChanges] = useState<PermissionChanges>({});
  const [isInviteFormOpen, setIsInviteFormOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('');
  const [permissionFilter, setPermissionFilter] = useState<string>('');
  const [availableCompanies, setAvailableCompanies] = useState<{ id: string, name: string }[]>([]);
  const [newPermission, setNewPermission] = useState<string>('');

  // Carregar usuários e empresas
  useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, []);

  // Buscar empresas disponíveis para o filtro
  const fetchCompanies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/companies`);
      setAvailableCompanies(response.data.map((company: any) => ({
        id: company._id,
        name: company.name
      })));
    } catch (err) {
      console.error('Erro ao carregar empresas:', err);
    }
  };

  // Buscar usuários com mapeamento atualizado
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/users`);
      const usersData = response.data.map((user: any) => ({
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [], // Adicionar propriedade permissions
        company: user.company, // Adicionar propriedade company
        inviteStatus: user.inviteStatus,
      }));
      console.log('Usuários recebidos:', usersData);
      setUsers(usersData);
      setLoading(false);
    } catch (err) {
      setError('Erro ao carregar usuários');
      setLoading(false);
    }
  };

  // Obter nome da empresa (considerando que pode ser string ou objeto)
  const getCompanyName = (company: any): string => {
    if (!company) return 'N/A';
    if (typeof company === 'object' && company !== null) {
      return company.name || company._id || 'Desconhecida';
    }
    return String(company);
  };

  // Gerenciar adição de permissão
  const handleAddPermission = (userId: string, permission: string) => {
    if (!permission) return;

    setPermissionChanges(prev => {
      const userChanges = prev[userId] || { add: [], remove: [] };

      // Verificar se a permissão já está em "remove" e removê-la
      let newRemove = [...userChanges.remove];
      if (newRemove.includes(permission)) {
        newRemove = newRemove.filter(p => p !== permission);
      }

      // Adicionar à lista "add" se não estiver lá
      const newAdd = userChanges.add.includes(permission)
        ? userChanges.add
        : [...userChanges.add, permission];

      return {
        ...prev,
        [userId]: {
          add: newAdd,
          remove: newRemove
        }
      };
    });

    setNewPermission('');
  };

  // Gerenciar remoção de permissão
  const handleRemovePermission = (userId: string, permission: string) => {
    setPermissionChanges(prev => {
      const userChanges = prev[userId] || { add: [], remove: [] };

      // Verificar se a permissão já está em "add" e removê-la
      let newAdd = [...userChanges.add];
      if (newAdd.includes(permission)) {
        newAdd = newAdd.filter(p => p !== permission);
      }

      // Se a permissão não estava em "add", adicioná-la em "remove"
      const user = users.find(u => u.id === userId);
      const isExistingPermission = user?.permissions.includes(permission);

      let newRemove = [...userChanges.remove];
      if (isExistingPermission && !newRemove.includes(permission)) {
        newRemove = [...newRemove, permission];
      }

      return {
        ...prev,
        [userId]: {
          add: newAdd,
          remove: newRemove
        }
      };
    });
  };

  // Salvar alterações de permissões
  const saveChanges = async () => {
    console.log('Salvando alterações de permissões:', permissionChanges);
    setLoading(true);

    try {
      await Promise.all(
        Object.entries(permissionChanges).map(([userId, changes]) => {
          const user = users.find(u => u.id === userId);
          if (!user) return null;

          // Calcular novas permissões baseadas nas mudanças
          const currentPermissions = [...user.permissions];

          // Remover permissões
          const withRemovals = currentPermissions.filter(p => !changes.remove.includes(p));

          // Adicionar novas permissões (sem duplicar)
          const newPermissions = [...withRemovals];
          changes.add.forEach(p => {
            if (!newPermissions.includes(p)) {
              newPermissions.push(p);
            }
          });

          // Enviar para API
          return axios.put(`${API_BASE_URL}/api/users/${userId}`, {
            permissions: newPermissions
          });
        })
      );

      setPermissionChanges({});
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

  // Excluir usuário
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

  // Reenviar convite
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

  // Verificar se há alterações pendentes para um usuário
  const hasChanges = (userId: string): boolean => {
    const changes = permissionChanges[userId];
    if (!changes) return false;
    return changes.add.length > 0 || changes.remove.length > 0;
  };

  // Obter permissões atuais considerando as alterações
  const getCurrentPermissions = (user: User): string[] => {
    const changes = permissionChanges[user.id];
    if (!changes) return user.permissions;

    // Remover permissões marcadas para remoção
    const withRemovals = user.permissions.filter(p => !changes.remove.includes(p));

    // Adicionar novas permissões
    return [...withRemovals, ...changes.add.filter(p => !withRemovals.includes(p))];
  };

  // Filtrar os usuários de acordo com os filtros aplicados
  const filteredUsers = users.filter(user => {
    // Filtro por empresa
    const companyMatch = !companyFilter ||
      (user.company &&
        (typeof user.company === 'string'
          ? user.company === companyFilter
          : user.company._id === companyFilter));

    // Filtro por permissão
    const permissionMatch = !permissionFilter ||
      user.permissions.includes(permissionFilter);

    return companyMatch && permissionMatch;
  });

  // Renderização para estados de carregamento e erro
  if (loading && users.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && users.length === 0) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Gerenciamento de Usuários
        </Typography>

        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsInviteFormOpen(true)}
            sx={{ mr: 1 }}
          >
            Convidar Usuário
          </Button>

          <Tooltip title="Atualizar lista">
            <IconButton onClick={fetchUsers} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : <RefreshIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <FilterListIcon sx={{ mr: 1 }} /> Filtros
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="company-filter-label">Filtrar por empresa</InputLabel>
            <Select
              labelId="company-filter-label"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              label="Filtrar por empresa"
            >
              <MenuItem value="">Todas as empresas</MenuItem>
              {availableCompanies.map(company => (
                <MenuItem key={company.id} value={company.id}>
                  {company.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="permission-filter-label">Filtrar por permissão</InputLabel>
            <Select
              labelId="permission-filter-label"
              value={permissionFilter}
              onChange={(e) => setPermissionFilter(e.target.value)}
              label="Filtrar por permissão"
            >
              <MenuItem value="">Todas as permissões</MenuItem>
              {AVAILABLE_PERMISSIONS.map(permission => (
                <MenuItem key={permission} value={permission}>
                  {permission}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Tabela de Usuários */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome de Usuário</TableCell>
              <TableCell>Nome Completo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Empresa</TableCell> {/* Nova coluna */}
              <TableCell>Permissões</TableCell> {/* Alterado de "Função" */}
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum usuário encontrado com os filtros aplicados.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  sx={{
                    backgroundColor: hasChanges(user.id) ? alpha('#3f51b5', 0.1) : 'inherit'
                  }}
                >
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>

                  {/* Célula da empresa */}
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <BusinessIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                      {getCompanyName(user.company)}
                    </Box>
                  </TableCell>

                  {/* Célula de permissões */}
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                      {getCurrentPermissions(user).map(permission => (
                        <Chip
                          key={permission}
                          label={permission}
                          size="small"
                          onDelete={user.inviteStatus === 'pending' ? undefined : () => handleRemovePermission(user.id, permission)}
                          color={permissionChanges[user.id]?.add.includes(permission) ? 'primary' : 'default'}
                          sx={{
                            textDecoration: permissionChanges[user.id]?.remove.includes(permission) ? 'line-through' : 'none',
                          }}
                        />
                      ))}
                    </Box>

                    {user.inviteStatus !== 'pending' && (
                      <FormControl size="small" sx={{ width: '100%', maxWidth: 200 }}>
                        <Select
                          value={newPermission}
                          onChange={(e) => setNewPermission(e.target.value)}
                          displayEmpty
                          renderValue={() => "Adicionar permissão"}
                          sx={{ fontSize: '0.8rem' }}
                        >
                          <MenuItem value="" disabled>Selecione uma permissão</MenuItem>
                          {AVAILABLE_PERMISSIONS
                            .filter(p => !getCurrentPermissions(user).includes(p))
                            .map(permission => (
                              <MenuItem
                                key={permission}
                                value={permission}
                                onClick={() => handleAddPermission(user.id, permission)}
                              >
                                {permission}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    )}
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
                      <Tooltip title="Reenviar convite">
                        <IconButton onClick={() => resendInvite(user.id)}>
                          <EmailIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Excluir usuário">
                        <IconButton onClick={() => deleteUser(user.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Botão de salvar alterações */}
      {Object.keys(permissionChanges).length > 0 && (
        <Button
          variant="contained"
          color="primary"
          onClick={saveChanges}
          sx={{ mt: 2 }}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ mr: 1 }} />
          ) : null}
          Salvar Alterações
        </Button>
      )}

      {/* Modal para convidar usuário */}
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
          borderRadius: 1
        }}>
          <Typography id="invite-modal-title" variant="h6" component="h2" gutterBottom>
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

      {/* Snackbar para mensagens */}
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
