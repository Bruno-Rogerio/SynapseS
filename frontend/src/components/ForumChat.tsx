// components/ForumChat.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
    Box,
    TextField,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Typography,
    Menu,
    MenuItem,
    Chip
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReplyIcon from '@mui/icons-material/Reply';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { ForumMessage, User } from '../types';
import { useForumChat } from '../hooks/useForumChat';

interface ForumChatProps {
    forumId: string;
    currentUser: User;
}

const ForumChat: React.FC<ForumChatProps> = ({ forumId, currentUser }) => {
    const {
        messages,
        loading,
        error,
        isTyping,
        isConnected,
        sendChatMessage,
        editChatMessage,
        deleteChatMessage,
        reactToChatMessage,
        notifyTyping
    } = useForumChat({ forumId, currentUser });

    const [newMessage, setNewMessage] = useState('');
    const [editingMessage, setEditingMessage] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        try {
            await sendChatMessage(newMessage, replyingTo || undefined);
            setNewMessage('');
            setReplyingTo(null);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleEditMessage = async (messageId: string, newContent: string) => {
        try {
            await editChatMessage(messageId, newContent);
            setEditingMessage(null);
        } catch (error) {
            console.error('Error editing message:', error);
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        try {
            await deleteChatMessage(messageId);
        } catch (error) {
            console.error('Error deleting message:', error);
        }
    };

    const handleReaction = async (messageId: string, reactionType: 'like' | 'dislike') => {
        try {
            await reactToChatMessage(messageId, reactionType);
        } catch (error) {
            console.error('Error reacting to message:', error);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, messageId: string) => {
        setAnchorEl(event.currentTarget);
        setSelectedMessage(messageId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedMessage(null);
    };

    if (loading) return <Typography>Carregando chat...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;
    if (!isConnected) return <Typography>Conectando ao chat...</Typography>;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <List sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                {messages.map((message) => (
                    <ListItem key={message._id} alignItems="flex-start">
                        <ListItemAvatar>
                            <Avatar alt={message.author.username} src={message.author.avatar} />
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Typography component="span" variant="body1">
                                    {message.author.username}
                                    <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                                        {new Date(message.createdAt).toLocaleString()}
                                    </Typography>
                                </Typography>
                            }
                            secondary={
                                <>
                                    {editingMessage === message._id ? (
                                        <TextField
                                            fullWidth
                                            value={message.content}
                                            onChange={(e) => {
                                                // Não é necessário atualizar o estado aqui, pois é gerenciado pelo hook
                                            }}
                                            onBlur={() => handleEditMessage(message._id, message.content)}
                                        />
                                    ) : (
                                        <Typography component="span" variant="body2" color="text.primary">
                                            {message.content}
                                        </Typography>
                                    )}
                                    {message.replyTo && (
                                        <Chip
                                            label={`Reply to: ${messages.find(m => m._id === message.replyTo)?.author.username || 'Unknown'}`}
                                            size="small"
                                            sx={{ mt: 1 }}
                                        />
                                    )}
                                    <Box sx={{ mt: 1 }}>
                                        <IconButton size="small" onClick={() => handleReaction(message._id, 'like')}>
                                            <ThumbUpIcon fontSize="small" />
                                        </IconButton>
                                        <Typography component="span" variant="caption" sx={{ mx: 1 }}>
                                            {message.reactions.likes || 0}
                                        </Typography>
                                        <IconButton size="small" onClick={() => handleReaction(message._id, 'dislike')}>
                                            <ThumbDownIcon fontSize="small" />
                                        </IconButton>
                                        <Typography component="span" variant="caption" sx={{ mx: 1 }}>
                                            {message.reactions.dislikes || 0}
                                        </Typography>
                                        <IconButton size="small" onClick={() => setReplyingTo(message._id)}>
                                            <ReplyIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </>
                            }
                        />
                        {currentUser._id === message.author._id && (
                            <IconButton edge="end" onClick={(e) => handleMenuOpen(e, message._id)}>
                                <MoreVertIcon />
                            </IconButton>
                        )}
                    </ListItem>
                ))}
                <div ref={messagesEndRef} />
            </List>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                <MenuItem onClick={() => {
                    setEditingMessage(selectedMessage);
                    handleMenuClose();
                }}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} />
                    Editar
                </MenuItem>
                <MenuItem onClick={() => {
                    if (selectedMessage) handleDeleteMessage(selectedMessage);
                    handleMenuClose();
                }}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                    Excluir
                </MenuItem>
            </Menu>
            {isTyping && (
                <Typography variant="caption" sx={{ p: 1 }}>
                    Alguém está digitando...
                </Typography>
            )}
            <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                {replyingTo && (
                    <Chip
                        label={`Respondendo para: ${messages.find(m => m._id === replyingTo)?.author.username || 'Desconhecido'}`}
                        onDelete={() => setReplyingTo(null)}
                        sx={{ mb: 1 }}
                    />
                )}
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => {
                        setNewMessage(e.target.value);
                        notifyTyping();
                    }}
                    InputProps={{
                        endAdornment: (
                            <IconButton type="submit" edge="end" color="primary">
                                <SendIcon />
                            </IconButton>
                        ),
                    }}
                />
            </Box>
        </Box>
    );
};

export default ForumChat;
