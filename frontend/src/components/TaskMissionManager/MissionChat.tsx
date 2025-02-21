// frontend/src/components/TaskMissionManager/MissionChat.tsx
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    TextField,
    Button,
    IconButton,
    Popover,
} from '@mui/material';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../hooks/useAuth';
import config from '../../config';
import { ChatMessage } from '../../types';

const API_BASE_URL = config.API_BASE_URL;

const MissionChat: React.FC<{ missionId: string }> = ({ missionId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [anchorElInput, setAnchorElInput] = useState<null | HTMLElement>(null);
    const [reactAnchor, setReactAnchor] = useState<{ anchor: HTMLElement; messageId: string } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/api/chat/${missionId}`);
                setMessages(response.data);
            } catch (error) {
                console.error('Erro ao buscar mensagens de chat:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchMessages();
    }, [missionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim() && !selectedFile) return;

        let fileUrl = '';
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            try {
                const uploadRes = await axios.post(`${API_BASE_URL}/api/uploads`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                fileUrl = uploadRes.data.url;
            } catch (error) {
                console.error('Erro no upload do arquivo:', error);
            }
        }

        const messageData: Partial<ChatMessage> = {
            _id: uuidv4(),
            missionId,
            userId: user?._id || 'unknown',
            username: user?.username || 'Desconhecido',
            message: newMessage,
            fileUrl,
            reactions: {},
            createdAt: new Date().toISOString(),
        };

        if (replyTo) {
            messageData.replyTo = {
                messageId: replyTo._id,
                userId: replyTo.userId,
                username: replyTo.username,
                message: replyTo.message,
            };
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/api/chat/${missionId}`, messageData);
            setMessages(prev => [...prev, response.data]);
            setNewMessage('');
            setSelectedFile(null);
            setReplyTo(null);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    };

    const handleReact = async (messageId: string, emoji: string) => {
        try {
            const response = await axios.patch(`${API_BASE_URL}/api/chat/${missionId}/${messageId}/react`, {
                emoji,
                userId: user?._id,
            });
            setMessages(prev => prev.map(msg => (msg._id === messageId ? response.data : msg)));
        } catch (error) {
            console.error('Erro ao reagir à mensagem:', error);
        }
    };

    const openInputEmojiPicker = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElInput(event.currentTarget);
    };

    const closeInputEmojiPicker = () => {
        setAnchorElInput(null);
    };

    const handleEmojiSelectForInput = (emojiData: any) => {
        setNewMessage(prev => prev + emojiData.emoji);
        closeInputEmojiPicker();
    };

    const openReactPicker = (event: React.MouseEvent<HTMLElement>, messageId: string) => {
        setReactAnchor({ anchor: event.currentTarget, messageId });
    };

    const closeReactPicker = () => {
        setReactAnchor(null);
    };

    const handleEmojiSelectForReact = (emojiData: any) => {
        if (reactAnchor) {
            handleReact(reactAnchor.messageId, emojiData.emoji);
            closeReactPicker();
        }
    };

    const handleReply = (message: ChatMessage) => {
        setReplyTo(message);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const openInputEmoji = Boolean(anchorElInput);
    const openReact = Boolean(reactAnchor);

    if (loading) return <Typography>Carregando chat...</Typography>;

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h6">Comunicação</Typography>
            <List sx={{ maxHeight: 300, overflowY: 'auto', bgcolor: 'background.paper', p: 1 }}>
                {messages.map(msg => (
                    <ListItem key={msg._id} alignItems="flex-start" divider>
                        <ListItemAvatar>
                            <Avatar>{msg.username.charAt(0).toUpperCase()}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={`${msg.username} - ${new Date(msg.createdAt).toLocaleTimeString()}`}
                            secondary={
                                <React.Fragment>
                                    {msg.replyTo && (
                                        <Box
                                            sx={{
                                                borderLeft: '4px solid #1976d2',
                                                bgcolor: 'rgba(25, 118, 210, 0.08)',
                                                p: 1,
                                                borderRadius: 1,
                                                mb: 1,
                                            }}
                                        >
                                            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                                                {msg.replyTo.username}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                                                {msg.replyTo.message}
                                            </Typography>
                                        </Box>
                                    )}
                                    <Typography component="span" variant="body1">
                                        {msg.message}
                                    </Typography>
                                    {msg.fileUrl && (
                                        <Box component="img" src={msg.fileUrl} alt="Anexo" sx={{ maxWidth: 200, mt: 1 }} />
                                    )}
                                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5 }}>
                                            {Object.entries(msg.reactions).map(([emoji, count]) => (
                                                <Box
                                                    key={emoji}
                                                    sx={{
                                                        bgcolor: '#eee',
                                                        px: 0.5,
                                                        borderRadius: 1,
                                                        fontSize: '0.75rem',
                                                    }}
                                                >
                                                    {emoji} {count}
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                        <IconButton size="small" onClick={(e) => openReactPicker(e, msg._id)}>
                                            <EmojiEmotionsIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={() => handleReply(msg)}>
                                            <ChatBubbleOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </React.Fragment>
                            }
                        />
                    </ListItem>
                ))}
                <div ref={messagesEndRef} />
            </List>

            {replyTo && (
                <Box
                    sx={{
                        p: 1.5,
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                        borderRadius: 1,
                        mb: 1,
                        borderLeft: '4px solid #1976d2',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                    }}
                >
                    <Box>
                        <Typography
                            variant="subtitle2"
                            sx={{
                                color: '#1976d2',
                                fontWeight: 600
                            }}
                        >
                            Respondendo a {replyTo.username}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'text.secondary',
                                mt: 0.5,
                                maxWidth: '90%',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {replyTo.message}
                        </Typography>
                    </Box>
                    <IconButton
                        size="small"
                        onClick={() => setReplyTo(null)}
                        sx={{ mt: -0.5, mr: -0.5 }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    size="small"
                    placeholder="Digite sua mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <IconButton onClick={openInputEmojiPicker}>
                    <EmojiEmotionsIcon />
                </IconButton>
                <IconButton component="label">
                    <AttachFileIcon />
                    <input type="file" hidden onChange={handleFileChange} />
                </IconButton>
                <Button variant="contained" onClick={handleSend}>
                    Enviar
                </Button>
            </Box>

            <Popover
                open={openInputEmoji}
                anchorEl={anchorElInput}
                onClose={closeInputEmojiPicker}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <EmojiPicker onEmojiClick={handleEmojiSelectForInput} searchDisabled skinTonesDisabled />
            </Popover>

            <Popover
                open={openReact}
                anchorEl={reactAnchor ? reactAnchor.anchor : null}
                onClose={closeReactPicker}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
            >
                <EmojiPicker onEmojiClick={handleEmojiSelectForReact} searchDisabled skinTonesDisabled />
            </Popover>
        </Box>
    );
};

export default MissionChat;
