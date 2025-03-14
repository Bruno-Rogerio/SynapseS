// frontend/src/components/TaskMissionManager/MissionChat.tsx
import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Popover,
    Avatar,
    Badge,
    Chip,
    Divider,
    CircularProgress,
    Paper,
    Tooltip,
    Zoom,
    useTheme,
    alpha,
    Collapse,
    Alert,
    Skeleton
} from '@mui/material';
import { motion } from 'framer-motion';
import EmojiEmotionsIcon from '@mui/icons-material/EmojiEmotions';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CheckIcon from '@mui/icons-material/Check';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReplyIcon from '@mui/icons-material/Reply';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EmojiPicker from 'emoji-picker-react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../hooks/useAuth';
import config from '../../config';
import { ChatMessage } from '../../types';
import { format, isToday, isYesterday, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
const API_BASE_URL = config.API_BASE_URL;

// Helpers
const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    if (isToday(date)) {
        return format(date, "HH:mm");
    } else if (isYesterday(date)) {
        return "Ontem " + format(date, "HH:mm");
    } else if (differenceInMinutes(now, date) < 7 * 24 * 60) {
        // Se for menos de uma semana - CORRIGIDA A LINHA 62
        // Passando locale como parte do segundo argumento
        const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return weekDays[date.getDay()] + ' ' + format(date, "HH:mm");
    } else {
        return format(date, "dd/MM/yyyy HH:mm");
    }
};

const getFileIcon = (fileUrl?: string) => {
    if (!fileUrl) return <InsertDriveFileIcon />;
    const extension = fileUrl.split('.').pop()?.toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
        return <ImageIcon />;
    } else if (extension === 'pdf') {
        return <PictureAsPdfIcon />;
    }
    return <InsertDriveFileIcon />;
};

const getFileTypeLabel = (fileName?: string) => {
    if (!fileName) return 'Arquivo';
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? extension.toUpperCase() : 'Arquivo';
};

const MissionChat: React.FC<{ missionId: string }> = ({ missionId }) => {
    const theme = useTheme();
    const { user } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
    const [anchorElInput, setAnchorElInput] = useState<null | HTMLElement>(null);
    const [reactAnchor, setReactAnchor] = useState<{ anchor: HTMLElement; messageId: string } | null>(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showEmptyState, setShowEmptyState] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Efeito para buscar mensagens
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get(`${API_BASE_URL}/api/chat/${missionId}`);
                setMessages(response.data);

                // Se não houver mensagens, mostrar estado vazio após um breve carregamento
                if (response.data.length === 0) {
                    setTimeout(() => setShowEmptyState(true), 500);
                }
            } catch (error) {
                console.error('Erro ao buscar mensagens de chat:', error);
                setError('Não foi possível carregar as mensagens. Tente novamente mais tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();

        // Simulação de polling ou WebSocket para receber novas mensagens
        const interval = setInterval(() => {
            fetchMessages();
        }, 30000);

        return () => clearInterval(interval);
    }, [missionId]);

    // Efeito para rolagem automática
    useEffect(() => {
        if (!loading && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            setUnreadCount(0);
        }
    }, [loading, messages.length]);

    // Efeito para detectar quando precisa mostrar o botão de rolagem
    useEffect(() => {
        const container = chatContainerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShowScrollBottom(!isNearBottom);

            // Se estiver longe do final e chegarem novas mensagens, incrementa contador
            if (!isNearBottom && messages.length > 0) {
                // Lógica para incrementar unreadCount seria aqui
                // Precisaria de um estado para rastrear quantas mensagens já foram vistas
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, [messages.length]);

    // Efeito para preview de arquivo
    useEffect(() => {
        if (selectedFile) {
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setFilePreview(e.target?.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setFilePreview(null);
            }
        } else {
            setFilePreview(null);
        }
    }, [selectedFile]);

    const handleSend = async () => {
        if ((!newMessage.trim() && !selectedFile) || sendingMessage) return;

        setSendingMessage(true);
        setError(null);

        let fileUrl = '';
        let fileName = '';

        // Upload de arquivo se existir
        if (selectedFile) {
            const formData = new FormData();
            formData.append('file', selectedFile);
            fileName = selectedFile.name;

            try {
                const uploadRes = await axios.post(`${API_BASE_URL}/api/uploads`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                fileUrl = uploadRes.data.url;
            } catch (error) {
                console.error('Erro no upload do arquivo:', error);
                setError('Falha ao enviar o arquivo. Tente novamente.');
                setSendingMessage(false);
                return;
            }
        }

        const tempId = `temp-${uuidv4()}`;
        const messageData: Partial<ChatMessage> = {
            _id: tempId,
            missionId,
            userId: user?._id || 'unknown',
            username: user?.username || 'Desconhecido',
            message: newMessage,
            fileUrl,
            fileName,
            reactions: {},
            createdAt: new Date().toISOString(),
            status: 'sending',
        };

        if (replyTo) {
            messageData.replyTo = {
                messageId: replyTo._id,
                userId: replyTo.userId,
                username: replyTo.username,
                message: replyTo.message,
            };
        }

        // Adiciona mensagem temporária enquanto envia
        setMessages(prev => [...prev, messageData as ChatMessage]);
        setNewMessage('');
        setSelectedFile(null);
        setFilePreview(null);
        setReplyTo(null);

        try {
            const response = await axios.post(`${API_BASE_URL}/api/chat/${missionId}`, messageData);

            // Atualiza mensagem temporária com dados reais
            setMessages(prev => prev.map(msg =>
                msg._id === tempId ? { ...response.data, status: 'sent' } : msg
            ));

            // Marcar como lida após um tempo
            setTimeout(() => {
                setMessages(prev => prev.map(msg =>
                    msg._id === response.data._id ? { ...msg, status: 'read' } : msg
                ));
            }, 2000);

            setShowEmptyState(false);
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);

            // Marca mensagem temporária como erro
            setMessages(prev => prev.map(msg =>
                msg._id === tempId ? { ...msg, status: 'error' } : msg
            ));

            setError('Falha ao enviar a mensagem. Clique para tentar novamente.');
        } finally {
            setSendingMessage(false);
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
        // Parar propagação para não disparar outros eventos de clique
        event.stopPropagation();
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

    const handleOpenFileSelector = () => {
        fileInputRef.current?.click();
    };

    const handleScrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setUnreadCount(0);
    };

    const handleRetry = (messageId: string) => {
        const failedMessage = messages.find(msg => msg._id === messageId);
        if (!failedMessage) return;

        // Remove a mensagem com erro
        setMessages(prev => prev.filter(msg => msg._id !== messageId));

        // Prepara para reenviar
        setNewMessage(failedMessage.message || '');
        if (failedMessage.replyTo) {
            const replyToMessage = messages.find(msg => msg._id === failedMessage.replyTo?.messageId);
            if (replyToMessage) {
                setReplyTo(replyToMessage);
            }
        }
    };

    const openInputEmoji = Boolean(anchorElInput);
    const openReact = Boolean(reactAnchor);

    // Agrupamento de mensagens por data
    const messagesByDate: { [key: string]: ChatMessage[] } = {};
    messages.forEach((msg) => {
        const date = new Date(msg.createdAt).toLocaleDateString();
        if (!messagesByDate[date]) {
            messagesByDate[date] = [];
        }
        messagesByDate[date].push(msg);
    });

    // Renderizar mensagem de status
    const renderMessageStatus = (status?: string) => {
        switch (status) {
            case 'sending':
                return <CircularProgress size={12} thickness={8} sx={{ ml: 0.5, color: alpha(theme.palette.text.secondary, 0.5) }} />;
            case 'sent':
                return <CheckIcon fontSize="small" sx={{ ml: 0.5, fontSize: 14, color: alpha(theme.palette.text.secondary, 0.5) }} />;
            case 'read':
                return <DoneAllIcon fontSize="small" sx={{ ml: 0.5, fontSize: 14, color: theme.palette.primary.main }} />;
            case 'error':
                return <ErrorOutlineIcon fontSize="small" sx={{ ml: 0.5, fontSize: 14, color: theme.palette.error.main }} />;
            default:
                return null;
        }
    };

    return (
        <Paper
            elevation={0}
            component={motion.div}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '70vh',
                maxHeight: '70vh',
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: theme.shadows[2],
            }}
        >
            {/* Cabeçalho do Chat */}
            <Box
                sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    backgroundColor: theme.palette.background.paper,
                    zIndex: 10,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                        sx={{
                            bgcolor: theme.palette.primary.main,
                            mr: 1.5,
                            width: 38,
                            height: 38
                        }}
                    >
                        <ChatBubbleOutlineIcon />
                    </Avatar>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                            Chat da Missão
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            {messages.length} {messages.length === 1 ? 'mensagem' : 'mensagens'}
                        </Typography>
                    </Box>
                </Box>

                <IconButton size="small">
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Área de Mensagens */}
            <Box
                ref={chatContainerRef}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    backgroundColor: alpha(theme.palette.background.default, 0.5),
                    position: 'relative',
                    '&::-webkit-scrollbar': {
                        width: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: 'transparent',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: alpha(theme.palette.divider, 0.2),
                        borderRadius: '4px',
                        '&:hover': {
                            background: alpha(theme.palette.divider, 0.3),
                        },
                    },
                }}
            >
                {/* Estado de carregamento */}
                {loading && (
                    <Box sx={{ p: 2 }}>
                        {[1, 2, 3].map((i) => (
                            <Box key={i} sx={{ display: 'flex', mb: 3, opacity: 1 - i * 0.2 }}>
                                <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                                <Box sx={{ width: '100%' }}>
                                    <Skeleton width="30%" />
                                    <Skeleton width={i % 2 ? '70%' : '50%'} />
                                    {i === 1 && <Skeleton width="40%" />}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                )}

                {/* Estado vazio */}
                {!loading && showEmptyState && (
                    <Box
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 3,
                            textAlign: 'center'
                        }}
                        component={motion.div}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <Avatar
                            sx={{
                                width: 80,
                                height: 80,
                                mb: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main
                            }}
                        >
                            <ChatBubbleOutlineIcon sx={{ fontSize: 40 }} />
                        </Avatar>
                        <Typography variant="h6" gutterBottom>
                            Nenhuma mensagem ainda
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 400 }}>
                            Seja o primeiro a enviar uma mensagem para a equipe da missão.
                            Compartilhe atualizações, tire dúvidas ou simplesmente diga olá!
                        </Typography>
                        <Button
                            variant="outlined"
                            startIcon={<SendIcon />}
                            onClick={() => document.getElementById('message-input')?.focus()}
                        >
                            Iniciar conversa
                        </Button>
                    </Box>
                )}

                {/* Estado de erro */}
                {!loading && error && !showEmptyState && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        action={
                            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                                Recarregar
                            </Button>
                        }
                    >
                        {error}
                    </Alert>
                )}

                {/* Mensagens agrupadas por data */}
                {!loading && Object.entries(messagesByDate).map(([date, dateMessages]) => (
                    <Box key={date} sx={{ mb: 2 }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mb: 2,
                                position: 'relative'
                            }}
                        >
                            <Divider sx={{ flex: 1 }} />
                            <Chip
                                label={
                                    isToday(new Date(date)) ? 'Hoje' :
                                        isYesterday(new Date(date)) ? 'Ontem' :
                                            // LINHA 558 CORRIGIDA - passando locale como parte do segundo argumento
                                            (() => {
                                                const dateObj = new Date(date);
                                                const day = dateObj.getDate();
                                                const months = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
                                                    'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                                                return `${day} de ${months[dateObj.getMonth()]}`;
                                            })()
                                }
                                size="small"
                                sx={{
                                    mx: 2,
                                    bgcolor: alpha(theme.palette.background.paper, 0.8),
                                    fontSize: '0.75rem',
                                    '& .MuiChip-label': { px: 1 }
                                }}
                            />
                            <Divider sx={{ flex: 1 }} />
                        </Box>

                        {dateMessages.map((msg, index) => {
                            const isCurrentUser = msg.userId === user?._id;
                            const showAvatar = index === 0 || dateMessages[index - 1]?.userId !== msg.userId;
                            const isConsecutive = index > 0 && dateMessages[index - 1]?.userId === msg.userId;

                            return (
                                <Box
                                    key={msg._id}
                                    sx={{
                                        display: 'flex',
                                        flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                                        mb: isConsecutive ? 0.5 : 2,
                                        mt: isConsecutive ? 0.5 : 2,
                                    }}
                                    component={motion.div}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    {/* Avatar - mostrado apenas na primeira mensagem de uma sequência */}
                                    {showAvatar ? (
                                        <Avatar
                                            sx={{
                                                width: 36,
                                                height: 36,
                                                mt: 0.5,
                                                ml: isCurrentUser ? 1.5 : 0,
                                                mr: isCurrentUser ? 0 : 1.5,
                                                bgcolor: isCurrentUser ? theme.palette.primary.main : theme.palette.grey[400],
                                            }}
                                        >
                                            {msg.username.charAt(0).toUpperCase()}
                                        </Avatar>
                                    ) : (
                                        <Box sx={{ width: 36, ml: isCurrentUser ? 1.5 : 0, mr: isCurrentUser ? 0 : 1.5 }} />
                                    )}

                                    <Box
                                        sx={{
                                            maxWidth: '70%',
                                            position: 'relative',
                                        }}
                                    >
                                        {/* Nome do usuário - mostrado apenas na primeira mensagem de uma sequência */}
                                        {showAvatar && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 500,
                                                    color: isCurrentUser ? theme.palette.primary.main : theme.palette.text.secondary,
                                                    mb: 0.5,
                                                    display: 'block',
                                                    ml: isCurrentUser ? 0 : 1,
                                                    mr: isCurrentUser ? 1 : 0,
                                                    textAlign: isCurrentUser ? 'right' : 'left',
                                                }}
                                            >
                                                {msg.username}
                                            </Typography>
                                        )}

                                        {/* Mensagem */}
                                        <Box
                                            sx={{
                                                position: 'relative',
                                                display: 'inline-block',
                                                maxWidth: '100%',
                                            }}
                                        >
                                            {/* Resposta a outra mensagem */}
                                            {msg.replyTo && (
                                                <Paper
                                                    elevation={0}
                                                    sx={{
                                                        p: 1,
                                                        mb: 0.5,
                                                        borderRadius: 2,
                                                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                                                        borderLeft: `3px solid ${theme.palette.primary.main}`,
                                                        mx: isCurrentUser ? 1 : 0,
                                                        opacity: 0.8,
                                                    }}
                                                >
                                                    <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                                                        {msg.replyTo.username}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontSize: '0.8rem' }}>
                                                        {msg.replyTo.message?.length > 60
                                                            ? msg.replyTo.message.substring(0, 60) + '...'
                                                            : msg.replyTo.message}
                                                    </Typography>
                                                </Paper>
                                            )}

                                            {/* Conteúdo da mensagem */}
                                            <Paper
                                                elevation={0}
                                                sx={{
                                                    p: 1.5,
                                                    borderRadius: 2,
                                                    backgroundColor: isCurrentUser
                                                        ? alpha(theme.palette.primary.main, 0.1)
                                                        : theme.palette.background.paper,
                                                    borderColor: isCurrentUser
                                                        ? alpha(theme.palette.primary.main, 0.2)
                                                        : alpha(theme.palette.divider, 0.7),
                                                    borderWidth: 1,
                                                    borderStyle: 'solid',
                                                    position: 'relative',
                                                    wordBreak: 'break-word',
                                                }}
                                                onClick={() => msg.status === 'error' && handleRetry(msg._id)}
                                            >
                                                {/* Texto da mensagem */}
                                                {msg.message && (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{
                                                            color: isCurrentUser ? theme.palette.text.primary : theme.palette.text.primary,
                                                            ...(msg.status === 'error' && {
                                                                color: theme.palette.error.main,
                                                                textDecoration: 'underline',
                                                                textDecorationStyle: 'dotted',
                                                                cursor: 'pointer'
                                                            })
                                                        }}
                                                    >
                                                        {msg.message}
                                                    </Typography>
                                                )}

                                                {/* Arquivo anexo */}
                                                {msg.fileUrl && (
                                                    <Box sx={{ mt: msg.message ? 2 : 0 }}>
                                                        {msg.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                                                            <Box
                                                                component="img"
                                                                src={msg.fileUrl}
                                                                alt="Imagem anexada"
                                                                sx={{
                                                                    maxWidth: '100%',
                                                                    maxHeight: 200,
                                                                    borderRadius: 1,
                                                                    cursor: 'pointer',
                                                                    mt: 0.5,
                                                                }}
                                                                onClick={() => window.open(msg.fileUrl, '_blank')}
                                                            />
                                                        ) : (
                                                            <Button
                                                                variant="outlined"
                                                                startIcon={getFileIcon(msg.fileUrl)}
                                                                size="small"
                                                                sx={{
                                                                    textTransform: 'none',
                                                                    mt: 0.5,
                                                                    borderColor: alpha(theme.palette.divider, 0.6),
                                                                    color: theme.palette.text.primary,
                                                                    '.MuiButton-startIcon': { mr: 0.5 }
                                                                }}
                                                                onClick={() => window.open(msg.fileUrl, '_blank')}
                                                            >
                                                                {msg.fileName || 'Anexo'}
                                                                <Typography variant="caption" component="span" sx={{ ml: 0.5 }}>
                                                                    ({getFileTypeLabel(msg.fileName)})
                                                                </Typography>
                                                            </Button>
                                                        )}
                                                    </Box>
                                                )}

                                                {/* Reações */}
                                                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                                    <Box
                                                        sx={{
                                                            mt: 1,
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: 0.5
                                                        }}
                                                    >
                                                        {Object.entries(msg.reactions).map(([emoji, count]) => (
                                                            <Chip
                                                                key={emoji}
                                                                label={`${emoji} ${count}`}
                                                                size="small"
                                                                sx={{
                                                                    height: 20,
                                                                    fontSize: '0.75rem',
                                                                    backgroundColor: alpha(theme.palette.background.default, 0.7),
                                                                    '& .MuiChip-label': { px: 1, py: 0.2 }
                                                                }}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}

                                                {/* Horário e status da mensagem (para o usuário atual) */}
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        justifyContent: 'flex-end',
                                                        alignItems: 'center',
                                                        mt: 0.5,
                                                        position: 'relative',
                                                        bottom: -3,
                                                        right: -3
                                                    }}
                                                >
                                                    <Typography
                                                        variant="caption"
                                                        sx={{
                                                            fontSize: '0.65rem',
                                                            color: alpha(theme.palette.text.secondary, 0.7),
                                                            mr: isCurrentUser ? 0 : 1
                                                        }}
                                                    >
                                                        {formatMessageTime(msg.createdAt)}
                                                    </Typography>
                                                    {isCurrentUser && renderMessageStatus(msg.status)}
                                                </Box>
                                            </Paper>

                                            {/* Botões de ação - aparecem ao passar o mouse */}
                                            <Box
                                                sx={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    [isCurrentUser ? 'left' : 'right']: -35,
                                                    transform: 'translateY(-50%)',
                                                    opacity: 0,
                                                    transition: 'opacity 0.2s',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    '&:hover': {
                                                        opacity: 1,
                                                    },
                                                    '.parent-container:hover &': {
                                                        opacity: 1,
                                                    },
                                                }}
                                                className="action-buttons"
                                            >
                                                <Tooltip title="Reagir" placement={isCurrentUser ? "left" : "right"}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => openReactPicker(e, msg._id)}
                                                        sx={{
                                                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                                                            boxShadow: 1,
                                                            mb: 1,
                                                            '&:hover': {
                                                                bgcolor: theme.palette.background.paper,
                                                            },
                                                        }}
                                                    >
                                                        <EmojiEmotionsIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Responder" placement={isCurrentUser ? "left" : "right"}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleReply(msg)}
                                                        sx={{
                                                            bgcolor: alpha(theme.palette.background.paper, 0.8),
                                                            boxShadow: 1,
                                                            mb: 1,
                                                            '&:hover': {
                                                                bgcolor: theme.palette.background.paper,
                                                            },
                                                        }}
                                                    >
                                                        <ReplyIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {isCurrentUser && (
                                                    <Tooltip title="Excluir" placement={isCurrentUser ? "left" : "right"}>
                                                        <IconButton
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha(theme.palette.background.paper, 0.8),
                                                                boxShadow: 1,
                                                                '&:hover': {
                                                                    bgcolor: alpha(theme.palette.error.light, 0.1),
                                                                    color: theme.palette.error.main,
                                                                },
                                                            }}
                                                        >
                                                            <DeleteOutlineIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            );
                        })}
                    </Box>
                ))}

                <div ref={messagesEndRef} />

                {/* Botão de rolagem para o final */}
                <Zoom in={showScrollBottom}>
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 70,
                            right: 20,
                            zIndex: 10
                        }}
                    >
                        <Badge
                            badgeContent={unreadCount > 0 ? unreadCount : null}
                            color="primary"
                            sx={{
                                '& .MuiBadge-badge': {
                                    right: 6,
                                    top: 6
                                }
                            }}
                        >
                            <IconButton
                                color="primary"
                                onClick={handleScrollToBottom}
                                sx={{
                                    bgcolor: theme.palette.background.paper,
                                    boxShadow: 3,
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.1)
                                    }
                                }}
                            >
                                <KeyboardArrowDownIcon />
                            </IconButton>
                        </Badge>
                    </Box>
                </Zoom>
            </Box>

            {/* Área de Entrada de Mensagem */}
            <Box
                sx={{
                    p: 2,
                    borderTop: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
                    backgroundColor: theme.palette.background.paper,
                    position: 'relative',
                }}
            >
                {/* Exibir mensagem à qual está respondendo */}
                <Collapse in={!!replyTo}>
                    <Box
                        sx={{
                            p: 1.5,
                            mb: 1.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            borderLeft: `3px solid ${theme.palette.primary.main}`,
                        }}
                    >
                        <Box>
                            <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                                Respondendo a {replyTo?.username}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    color: theme.palette.text.secondary,
                                    fontSize: '0.8rem',
                                    maxWidth: '90%',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {replyTo?.message}
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setReplyTo(null)} sx={{ mt: -0.5 }}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Collapse>

                {/* Prévia do arquivo selecionado */}
                <Collapse in={!!selectedFile}>
                    <Box
                        sx={{
                            p: 1.5,
                            mb: 1.5,
                            bgcolor: alpha(theme.palette.background.default, 0.5),
                            borderRadius: 1,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: `1px dashed ${alpha(theme.palette.divider, 0.5)}`,
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            {filePreview ? (
                                <Box
                                    component="img"
                                    src={filePreview}
                                    alt="Preview"
                                    sx={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 1,
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <Avatar
                                    variant="rounded"
                                    sx={{
                                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                                        color: theme.palette.primary.main,
                                        width: 40,
                                        height: 40,
                                    }}
                                >
                                    {getFileIcon(selectedFile?.name)}
                                </Avatar>
                            )}
                            <Box>
                                <Typography variant="body2" noWrap sx={{ maxWidth: 250 }}>
                                    {selectedFile?.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {(selectedFile?.size && (selectedFile.size / 1024).toFixed(1)) || 0} KB
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton size="small" onClick={() => setSelectedFile(null)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Collapse>

                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    <TextField
                        id="message-input"
                        fullWidth
                        multiline
                        maxRows={4}
                        variant="outlined"
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={sendingMessage}
                        InputProps={{
                            sx: {
                                borderRadius: 6,
                                bgcolor: alpha(theme.palette.background.default, 0.5),
                                '&:hover': {
                                    bgcolor: alpha(theme.palette.background.default, 0.8),
                                },
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: alpha(theme.palette.divider, 0.3),
                                },
                            },
                        }}
                    />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <IconButton
                            onClick={openInputEmojiPicker}
                            color="primary"
                            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                        >
                            <EmojiEmotionsIcon />
                        </IconButton>

                        <IconButton
                            onClick={handleOpenFileSelector}
                            color="primary"
                            sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}
                        >
                            <AttachFileIcon />
                            <input
                                ref={fileInputRef}
                                type="file"
                                hidden
                                onChange={handleFileChange}
                                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            />
                        </IconButton>

                        <IconButton
                            onClick={handleSend}
                            disabled={(!newMessage.trim() && !selectedFile) || sendingMessage}
                            sx={{
                                bgcolor: theme.palette.primary.main,
                                color: theme.palette.common.white,
                                '&:hover': {
                                    bgcolor: theme.palette.primary.dark,
                                },
                                '&.Mui-disabled': {
                                    bgcolor: alpha(theme.palette.primary.main, 0.3),
                                    color: alpha(theme.palette.common.white, 0.5),
                                }
                            }}
                        >
                            <SendIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            {/* Emoji Picker Popover para mensagem */}
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
                sx={{
                    '& .EmojiPickerReact': {
                        '--epr-bg-color': theme.palette.background.paper,
                        '--epr-category-label-bg-color': theme.palette.background.default,
                        '--epr-hover-bg-color': alpha(theme.palette.primary.main, 0.1),
                    }
                }}
            >
                <EmojiPicker onEmojiClick={handleEmojiSelectForInput} searchDisabled skinTonesDisabled />
            </Popover>

            {/* Emoji Picker Popover para reações */}
            <Popover
                open={openReact}
                anchorEl={reactAnchor ? reactAnchor.anchor : null}
                onClose={closeReactPicker}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center',
                }}
                sx={{
                    '& .EmojiPickerReact': {
                        '--epr-bg-color': theme.palette.background.paper,
                        '--epr-category-label-bg-color': theme.palette.background.default,
                        '--epr-hover-bg-color': alpha(theme.palette.primary.main, 0.1),
                    }
                }}
            >
                <EmojiPicker onEmojiClick={handleEmojiSelectForReact} searchDisabled skinTonesDisabled />
            </Popover>
        </Paper>
    );
};

export default MissionChat;
