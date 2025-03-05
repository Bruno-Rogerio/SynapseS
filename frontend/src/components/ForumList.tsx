// components/ForumList.tsx
import React from 'react';
import {
    Typography,
    Box,
    Button,
    Grid,
    Paper,
    LinearProgress,
    useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { useForums } from '../hooks/useForums';
import ForumItem from './ForumItem';

const ForumList: React.FC = () => {
    const { forums, loading, error } = useForums();
    const navigate = useNavigate();
    const theme = useTheme();

    const handleCreateForum = () => {
        navigate('/create-forum');
    };

    if (loading) return <LinearProgress />;
    if (error) return <Typography color="error">Erro ao carregar fóruns: {error}</Typography>;

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                    Fóruns de Brainstorming
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleCreateForum}
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        px: 3
                    }}
                >
                    Criar Novo Fórum
                </Button>
            </Box>
            <Paper elevation={3} sx={{ p: 2, borderRadius: 2 }}>
                {forums.length === 0 ? (
                    <Typography variant="body1" sx={{ textAlign: 'center', color: theme.palette.text.secondary, py: 4 }}>
                        Nenhum fórum encontrado. Seja o primeiro a criar um!
                    </Typography>
                ) : (
                    <Grid container spacing={2}>
                        {forums.map((forum) => (
                            <Grid item xs={12} sm={6} md={4} key={forum._id}>
                                <ForumItem forum={forum} />
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Paper>
        </Box>
    );
};

export default ForumList;
