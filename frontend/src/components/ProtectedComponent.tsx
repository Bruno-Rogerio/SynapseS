import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { CircularProgress, Typography, Box } from '@mui/material';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const ProtectedComponent: React.FC = () => {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setError('Você não está autenticado. Por favor, faça login.');
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/users`);
        setData(JSON.stringify(response.data, null, 2));
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Erro ao buscar dados. Você pode não ter permissão para acessar este recurso.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Componente Protegido
      </Typography>
      {user && (
        <Typography variant="subtitle1" gutterBottom>
          Bem-vindo, {user.fullName} ({user.role})
        </Typography>
      )}
      <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
        {data}
      </Typography>
    </Box>
  );
};

export default ProtectedComponent;
