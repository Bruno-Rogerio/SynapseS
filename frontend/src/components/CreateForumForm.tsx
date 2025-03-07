// components/CreateForumForm.tsx
import React, { useState } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    Chip,
    Stack,
    IconButton,
    useTheme,
    InputAdornment,
    Divider,
    CircularProgress
} from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

interface CreateForumFormProps {
    onClose: () => void;
    onForumCreated: () => void;
}

const CreateForumForm: React.FC<CreateForumFormProps> = ({ onClose, onForumCreated }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tag, setTag] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const theme = useTheme();

    const handleAddTag = () => {
        if (tag && !tags.includes(tag)) {
            setTags([...tags, tag]);
            setTag('');
        }
    };

    const handleDeleteTag = (tagToDelete: string) => {
        setTags(tags.filter((t) => t !== tagToDelete));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const forumData = { title, description, tags };
        console.log('Sending forum data:', forumData);

        try {
            console.log('Request URL:', `${import.meta.env.VITE_API_BASE_URL}/api/forums`);
            console.log('Request headers:', axios.defaults.headers);

            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/forums`, forumData, {
                withCredentials: true
            });

            console.log('Forum created successfully:', response.data);
            onForumCreated();
            onClose();
        } catch (error) {
            console.error('Error creating forum:', error);
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    console.error('Error response:', error.response.data);
                    setError(`Erro ao criar fórum: ${error.response.data.message || 'Erro desconhecido'}`);
                } else if (error.request) {
                    console.error('No response received:', error.request);
                    setError('Erro ao criar fórum: Nenhuma resposta recebida do servidor');
                } else {
                    console.error('Error setting up request:', error.message);
                    setError(`Erro ao criar fórum: ${error.message}`);
                }
            } else {
                setError('Erro desconhecido ao criar fórum');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                    Criar Novo Fórum
                </Typography>
                <IconButton onClick={onClose} size="small" disabled={isSubmitting}>
                    <CloseIcon />
                </IconButton>
            </Box>
            <Divider sx={{ mb: 3 }} />
            <Box component="form" onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Título do Fórum"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    variant="outlined"
                    sx={{ mb: 3 }}
                    disabled={isSubmitting}
                />
                <TextField
                    fullWidth
                    label="Descrição"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    multiline
                    rows={4}
                    variant="outlined"
                    sx={{ mb: 3 }}
                    disabled={isSubmitting}
                />
                <TextField
                    fullWidth
                    label="Adicionar Tag"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    variant="outlined"
                    disabled={isSubmitting}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleAddTag} edge="end" disabled={isSubmitting}>
                                    <AddIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                        }
                    }}
                    sx={{ mb: 2 }}
                />
                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 3 }}>
                    {tags.map((t) => (
                        <Chip
                            key={t}
                            label={t}
                            onDelete={() => handleDeleteTag(t)}
                            disabled={isSubmitting}
                            sx={{
                                bgcolor: theme.palette.primary.light,
                                color: theme.palette.primary.contrastText,
                                '&:hover': { bgcolor: theme.palette.primary.main },
                            }}
                        />
                    ))}
                </Stack>
                {error && (
                    <Typography color="error" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={isSubmitting}
                    sx={{
                        borderRadius: '28px',
                        py: 1.5,
                        textTransform: 'none',
                        fontSize: '1rem',
                        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                        '&:hover': {
                            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)',
                        }
                    }}
                >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Criar Fórum'}
                </Button>
            </Box>
        </Box>
    );
};

export default CreateForumForm;
