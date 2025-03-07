// components/ForumList.tsx
import React, { useState, useCallback } from 'react';
import {
    Typography,
    Box,
    Button,
    Grid,
    Paper,
    LinearProgress,
    useTheme,
    Modal,
    Fade,
    Backdrop,
    Alert,
    Pagination
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useForums } from '../hooks/useForums';
import ForumItem from './ForumItem';
import CreateForumForm from './CreateForumForm';

const ForumList: React.FC = () => {
    const { forums, loading, error, page, totalPages, fetchForums, refetchForums } = useForums();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const theme = useTheme();

    const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
    const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

    const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
        fetchForums(value);
    }, [fetchForums]);

    const handleForumCreated = useCallback(() => {
        refetchForums();
        handleCloseModal();
    }, [refetchForums, handleCloseModal]);

    if (loading) {
        return (
            <Box sx={{ width: '100%', mt: 4 }}>
                <LinearProgress />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ mt: 4 }}>Erro ao carregar fóruns: {error}</Alert>;
    }

    return (
        <Box sx={{ p: 4, bgcolor: theme.palette.background.default, minHeight: '100vh' }}>
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 4,
                borderBottom: `1px solid ${theme.palette.divider}`,
                pb: 2
            }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                    Fóruns de Brainstorming
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleOpenModal}
                    sx={{
                        borderRadius: '28px',
                        textTransform: 'none',
                        px: 3,
                        py: 1,
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                        '&:hover': {
                            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
                        }
                    }}
                >
                    Criar Novo Fórum
                </Button>
            </Box>
            {forums.length === 0 ? (
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        textAlign: 'center',
                        bgcolor: theme.palette.background.paper,
                        borderRadius: 2,
                        border: `1px dashed ${theme.palette.divider}`
                    }}
                >
                    <Typography variant="h6" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
                        Nenhum fórum encontrado
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
                        Seja o primeiro a iniciar uma discussão!
                    </Typography>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleOpenModal}
                        sx={{ borderRadius: '20px', textTransform: 'none' }}
                    >
                        Criar Primeiro Fórum
                    </Button>
                </Paper>
            ) : (
                <>
                    <Grid container spacing={3}>
                        {forums.map((forum) => (
                            <Grid item xs={12} sm={6} md={4} key={forum._id}>
                                <ForumItem forum={forum} />
                            </Grid>
                        ))}
                    </Grid>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={handlePageChange}
                            color="primary"
                        />
                    </Box>
                </>
            )}
            <Modal
                open={isModalOpen}
                onClose={handleCloseModal}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={isModalOpen}>
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '90%',
                        maxWidth: 600,
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                    }}>
                        <CreateForumForm onClose={handleCloseModal} onForumCreated={handleForumCreated} />
                    </Box>
                </Fade>
            </Modal>
        </Box>
    );
};

export default ForumList;
