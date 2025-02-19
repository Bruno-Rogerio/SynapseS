import React, { useState } from 'react';
import { TextField, Button, Select, MenuItem, FormControl, InputLabel, Box, Typography } from '@mui/material';
import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';

interface InviteUserFormProps {
  onInviteSent: () => void;
}

const InviteUserForm: React.FC<InviteUserFormProps> = ({ onInviteSent }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);
    try {
      console.log('Iniciando envio de convite para:', { email, role });
      const response = await axios.post(`${apiBaseUrl}/api/invites/create`, { email, role });
      console.log('Resposta completa do servidor:', response);
      
      if (response.status === 201) {
        setMessage('Convite enviado com sucesso!');
        setEmail('');
        setRole('');
        onInviteSent();
      } else {
        throw new Error('Resposta inesperada do servidor');
      }
    } catch (error) {
      console.error('Erro detalhado ao enviar convite:', error);
      if (axios.isAxiosError(error)) {
        console.error('Detalhes do erro Axios:', error.response?.data, error.response?.status, error.response?.headers);
        setMessage(`Erro ao enviar convite: ${error.response?.data?.message || error.message}`);
      } else {
        setMessage('Erro ao enviar convite. Por favor, tente novamente.');
      }
    } finally {
      setIsLoading(false);
      console.log('Finalizado o processo de envio de convite');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400 }}>
      <TextField
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        fullWidth
        margin="normal"
        disabled={isLoading}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel>Função</InputLabel>
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value as string)}
          required
          disabled={isLoading}
        >
          <MenuItem value="admin">Administrador</MenuItem>
          <MenuItem value="user">Usuário</MenuItem>
        </Select>
      </FormControl>
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 2 }}
        disabled={isLoading}
      >
        {isLoading ? 'Enviando...' : 'Enviar Convite'}
      </Button>
      {message && (
        <Typography
          color={message.includes('sucesso') ? 'success' : 'error'}
          sx={{ mt: 2 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default InviteUserForm;
