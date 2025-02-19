import React, { useState } from 'react';
import { TextField, Button, Box, Typography, Link, CircularProgress } from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { Link as RouterLink } from 'react-router-dom';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(email, password);
      onLoginSuccess();
    } catch (error) {
      console.error('Login failed:', error);
      setError('Falha no login. Por favor, verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, margin: 'auto' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Login
      </Typography>
      {error && (
        <Typography color="error" variant="body2" gutterBottom>
          {error}
        </Typography>
      )}
      <TextField
        fullWidth
        type="email"
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isLoading}
      />
      <TextField
        fullWidth
        type="password"
        label="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        disabled={isLoading}
      />
      <Button 
        type="submit" 
        variant="contained" 
        color="primary" 
        fullWidth 
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Entrar'}
      </Button>
      <Box mt={2}>
        <Typography variant="body2" align="center">
          Não tem uma conta?{' '}
          <Link component={RouterLink} to="/register-company">
            Registre sua empresa
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default LoginForm;
