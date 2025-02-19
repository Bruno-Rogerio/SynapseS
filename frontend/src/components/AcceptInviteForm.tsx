import React, { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

interface ErrorResponse {
  message: string;
  error?: string;
}

const AcceptInviteForm: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isTokenChecking, setIsTokenChecking] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await axios.get(`${API_BASE_URL}/api/invites/verify/${token}`);
        setIsValidToken(true);
      } catch (error) {
        setError('Convite inválido ou expirado.');
        setIsValidToken(false);
      } finally {
        setIsTokenChecking(false);
      }
    };

    if (token) {
      verifyToken();
    }
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/invites/accept/${token}`, formData);
      console.log('Resposta do servidor:', response.data);
      alert('Conta criada com sucesso! Você será redirecionado para a página inicial.');
      navigate('/');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>;
        setError(axiosError.response?.data?.message || axiosError.response?.data?.error || 'Erro ao criar conta. Tente novamente.');
      } else {
        setError('Erro desconhecido ao criar conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenChecking) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!isValidToken) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <Alert severity="error">{error || 'Convite inválido'}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ marginTop: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" gutterBottom>
            Aceitar Convite
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Nome de usuário"
              name="username"
              autoComplete="username"
              autoFocus
              value={formData.username}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="fullName"
              label="Nome completo"
              name="fullName"
              autoComplete="name"
              value={formData.fullName}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AcceptInviteForm;
