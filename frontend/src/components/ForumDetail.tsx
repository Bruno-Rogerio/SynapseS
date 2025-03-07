// components/ForumDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    Typography,
    Box,
    Chip,
    CircularProgress,
} from '@mui/material';
import { Forum } from '../types';
import axios from 'axios';
import ForumChat from './ForumChat';
import { useAuth } from '../hooks/useAuth';

const ForumDetail: React.FC = () => {
    const [forum, setForum] = useState<Forum | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth(); // Usando 'user' em vez de 'currentUser'

    const fetchForumDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const forumResponse = await axios.get<Forum>(`${import.meta.env.VITE_API_BASE_URL}/api/forums/${id}`);
            setForum(forumResponse.data);
        } catch (error) {
            console.error('Error fetching forum details:', error);
            if (axios.isAxiosError(error)) {
                setError(error.response?.data?.message || 'Erro ao carregar detalhes do fórum');
            } else {
                setError('Erro desconhecido ao carregar detalhes do fórum');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForumDetails();
    }, [id]);

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Typography color="error">{error}</Typography>;
    }

    if (!forum) {
        return <Typography>Fórum não encontrado</Typography>;
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h4">{forum.title}</Typography>
                <Typography variant="body1">{forum.description}</Typography>
                <Box my={2}>
                    {forum.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" sx={{ mr: 1 }} />
                    ))}
                </Box>
                <Typography variant="subtitle1">Criado por: {forum.createdBy.username}</Typography>
                <Typography variant="subtitle2">Última atividade: {new Date(forum.lastActivity).toLocaleString()}</Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h5" sx={{ p: 2 }}>Chat do Fórum</Typography>
                {user ? (
                    <ForumChat forumId={id!} currentUser={user} />
                ) : (
                    <Typography variant="body1" sx={{ p: 2 }}>
                        Faça login para participar do chat.
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default ForumDetail;
