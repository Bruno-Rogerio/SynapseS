import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Checkbox,
    ListItemText,
    OutlinedInput,
    TextareaAutosize,
    Input,
    SelectChangeEvent
} from '@mui/material';
import { Mission, User } from '../../types';

interface MissionFormProps {
    users: User[];
    onSubmit: (mission: Mission) => void;
    onClose: () => void;
}

const MissionForm: React.FC<MissionFormProps> = ({ users, onSubmit }) => {
    const [newMission, setNewMission] = useState<Mission>({
        _id: '',
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        leader: '',
        team: [],
        category: '',
        createdBy: '',
        tasks: [],
        comments: '',
        attachments: [],
    });

    // Manipulação de inputs de texto
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewMission(prev => ({ ...prev, [name]: value }));
    };

    // Manipulação de selects normais
    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        setNewMission(prev => ({ ...prev, leader: e.target.value }));
    };

    // Manipulação de selects múltiplos (equipe)
    const handleTeamChange = (e: SelectChangeEvent<string[]>) => {
        setNewMission(prev => ({ ...prev, team: e.target.value as string[] }));
    };

    // Manipulação de arquivos
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileUrls = Array.from(e.target.files).map(file => URL.createObjectURL(file));
            setNewMission(prev => ({ ...prev, attachments: fileUrls }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(newMission);
    };

    return (
        <Box>
            <form onSubmit={handleSubmit}>
                <TextField
                    label="Título"
                    name="title"
                    value={newMission.title}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Descrição"
                    name="description"
                    value={newMission.description}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Data de Início"
                    name="startDate"
                    type="date"
                    value={newMission.startDate}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                />
                <TextField
                    label="Data de Conclusão"
                    name="endDate"
                    type="date"
                    value={newMission.endDate}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                />

                {/* Seleção do líder */}
                <FormControl fullWidth margin="dense">
                    <InputLabel>Líder da Missão</InputLabel>
                    <Select
                        value={newMission.leader}
                        onChange={handleSelectChange}
                        input={<OutlinedInput label="Líder da Missão" />}
                    >
                        {users.map((user) => (
                            <MenuItem key={user._id} value={user._id}>
                                {user.username}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Seleção da equipe */}
                <FormControl fullWidth margin="dense">
                    <InputLabel>Equipe</InputLabel>
                    <Select
                        multiple
                        value={newMission.team}
                        onChange={handleTeamChange}
                        input={<OutlinedInput label="Equipe" />}
                        renderValue={(selected) => (selected as string[])
                            .map((id) => users.find((user) => user._id === id)?.username)
                            .join(', ')}
                    >
                        {users.map((user) => (
                            <MenuItem key={user._id} value={user._id}>
                                <Checkbox checked={newMission.team.includes(user._id)} />
                                <ListItemText primary={user.username} />
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                {/* Categoria */}
                <TextField
                    label="Categoria/Tag"
                    name="category"
                    value={newMission.category}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                />

                {/* Comentários */}
                <TextareaAutosize
                    name="comments"
                    value={newMission.comments}
                    onChange={handleInputChange}
                    placeholder="Comentários/Anotações"
                    style={{ width: '100%', marginTop: '16px', padding: '8px' }}
                />

                {/* Upload de arquivos */}
                <Input
                    type="file"
                    inputProps={{ multiple: true }}
                    onChange={handleFileChange}
                    style={{ marginTop: '16px' }}
                />

                {/* Botão de submissão */}
                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                    Criar Missão
                </Button>
            </form>
        </Box>
    );
};

export default MissionForm;
