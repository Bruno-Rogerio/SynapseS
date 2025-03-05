import React, { useState } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    Paper,
    Container,
    Chip,
    Stack,
    IconButton,
    useTheme,
    InputAdornment
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const CreateForumForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tag, setTag] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const navigate = useNavigate();
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
        try {
            await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/forums`, {
                title,
                description,
                tags
            });
            navigate('/forums');
        } catch (error) {
            console.error('Error creating forum:', error);
        }
    };

    return (
        <Container maxWidth="sm">
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    mt: 4,
                    borderRadius: 2,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <IconButton onClick={() => navigate('/forums')} sx={{ mr: 2 }}>
                        <ArrowBackIcon />
                    </IconButton>
                    <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
                        Criar Novo Fórum
                    </Typography>
                </Box>
                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Título do Fórum"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        margin="normal"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Descrição"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        multiline
                        rows={4}
                        margin="normal"
                        variant="outlined"
                        sx={{ mb: 2 }}
                    />
                    <TextField
                        fullWidth
                        label="Adicionar Tag"
                        value={tag}
                        onChange={(e) => setTag(e.target.value)}
                        margin="normal"
                        variant="outlined"
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleAddTag} edge="end">
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
                                sx={{
                                    bgcolor: theme.palette.primary.light,
                                    color: theme.palette.primary.contrastText,
                                    '&:hover': { bgcolor: theme.palette.primary.main },
                                }}
                            />
                        ))}
                    </Stack>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                        size="large"
                        sx={{
                            borderRadius: '20px',
                            py: 1.5,
                            textTransform: 'none',
                            fontSize: '1rem'
                        }}
                    >
                        Criar Fórum
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default CreateForumForm;
