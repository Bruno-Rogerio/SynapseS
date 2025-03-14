import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { CircularProgress, Typography, Box, Alert, Paper, Divider, Chip } from '@mui/material';
import config from '../config';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';

const API_BASE_URL = config.API_BASE_URL;

const ProtectedComponent: React.FC = () => {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuth();

  // Função auxiliar para obter o nome da empresa com correção de tipo
  const getCompanyName = () => {
    if (!user?.company) return 'N/A';

    // Usar asserção de tipo para evitar erros de TypeScript
    if (typeof user.company === 'object' && user.company !== null) {
      const companyObj = user.company as any; // Asserção de tipo para evitar erros
      return companyObj.name || companyObj._id || 'Desconhecida';
    }

    // Se for string ou outro tipo primitivo
    return String(user.company);
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) {
        setError('Você não está autenticado. Por favor, faça login.');
        setLoading(false);
        return;
      }

      // Verificação de permissões
      const hasPermission = user?.permissions?.some(
        p => p === 'admin' || p === 'view_users' || p === 'manage_users'
      );

      if (!hasPermission) {
        setError('Você não tem permissão para acessar este recurso.');
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
  }, [isAuthenticated, user]); // Adicionado user como dependência

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <SecurityIcon color="primary" />
        <Typography variant="h4">
          Componente Protegido
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {user && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom>
            Detalhes do Usuário
          </Typography>

          <Box mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              {user.fullName || user.username}
            </Typography>

            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <BusinessIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Empresa: {getCompanyName()}
              </Typography>
            </Box>
          </Box>

          {/* Exibição das permissões */}
          {user.permissions && user.permissions.length > 0 && (
            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>
                Suas permissões:
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {user.permissions.map((permission, index) => (
                  <Chip
                    key={index}
                    label={permission}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Mantém a exibição do role se ainda existir */}
          {user.role && (
            <Typography variant="body2" color="text.secondary" mt={1}>
              Função: {user.role}
            </Typography>
          )}
        </Box>
      )}

      <Divider sx={{ mb: 3 }} />

      <Typography variant="h6" gutterBottom>
        Dados da API:
      </Typography>
      <Paper
        variant="outlined"
        sx={{
          p: 2,
          maxHeight: 400,
          overflow: 'auto',
          bgcolor: theme => theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)'
        }}
      >
        <Typography
          variant="body2"
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace'
          }}
        >
          {data}
        </Typography>
      </Paper>
    </Paper>
  );
};

export default ProtectedComponent;
