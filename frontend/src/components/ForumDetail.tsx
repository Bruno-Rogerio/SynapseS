// components/ForumDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Typography, Button, List, ListItem, ListItemText, Divider, Box, Chip } from '@mui/material';
import { Forum, ForumPost } from '../types';
import axios from 'axios';

const ForumDetail: React.FC = () => {
    const [forum, setForum] = useState<Forum | null>(null);
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const { id } = useParams<{ id: string }>();

    useEffect(() => {
        const fetchForumDetails = async () => {
            try {
                const forumResponse = await axios.get<Forum>(`${import.meta.env.VITE_API_BASE_URL}/forums/${id}`);
                setForum(forumResponse.data);

                const postsResponse = await axios.get<ForumPost[]>(`${import.meta.env.VITE_API_BASE_URL}/forums/${id}/posts`);
                setPosts(postsResponse.data);
            } catch (error) {
                console.error('Error fetching forum details:', error);
            }
        };

        fetchForumDetails();
    }, [id]);

    if (!forum) {
        return <Typography>Carregando...</Typography>;
    }

    return (
        <Box>
            <Typography variant="h4">{forum.title}</Typography>
            <Typography variant="body1">{forum.description}</Typography>
            <Box my={2}>
                {forum.tags.map((tag) => (
                    <Chip key={tag} label={tag} size="small" sx={{ mr: 1 }} />
                ))}
            </Box>
            <Typography variant="subtitle1">Criado por: {forum.createdBy.username}</Typography>
            <Typography variant="subtitle2">Última atividade: {new Date(forum.lastActivity).toLocaleString()}</Typography>

            <Box mt={4}>
                <Typography variant="h5">Posts</Typography>
                <Button component={Link} to={`/forum/${id}/create-post`} variant="contained" color="primary" sx={{ my: 2 }}>
                    Criar Novo Post
                </Button>
                <List>
                    {posts.map((post) => (
                        <React.Fragment key={post._id}>
                            <ListItem alignItems="flex-start">
                                <ListItemText
                                    primary={post.title}
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2" color="text.primary">
                                                {post.author.username}
                                            </Typography>
                                            {` — ${post.content.substring(0, 100)}...`}
                                        </>
                                    }
                                />
                            </ListItem>
                            <Divider component="li" />
                        </React.Fragment>
                    ))}
                </List>
            </Box>
        </Box>
    );
};

export default ForumDetail;
