// src/components/UnauthorizedPage.tsx
import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="sm">
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '80vh',
                    textAlign: 'center',
                    gap: 3
                }}
            >
                <Typography variant="h3" component="h1" gutterBottom>
                    Acesso Negado
                </Typography>

                <Typography variant="body1">
                    Você não tem permissão para acessar esta página.
                </Typography>

                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/dashboard')}
                >
                    Voltar para o Dashboard
                </Button>
            </Box>
        </Container>
    );
};

export default UnauthorizedPage;
