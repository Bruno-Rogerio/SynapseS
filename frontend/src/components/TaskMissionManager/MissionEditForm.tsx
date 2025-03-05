// frontend/src/components/TaskMissionManager/MissionEditForm.tsx
import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    OutlinedInput,
    SelectChangeEvent,
} from '@mui/material';
import { Mission, User } from '../../types';

interface MissionEditFormProps {
    mission: Mission;
    users: User[];
    onSubmit: (updatedMission: Partial<Mission>) => void;
    onClose: () => void;
}

const MissionEditForm: React.FC<MissionEditFormProps> = ({ mission, users, onSubmit, onClose }) => {
    const [leader, setLeader] = useState(mission.leader);
    const [members, setMembers] = useState<string[]>(mission.members || []);
    const [endDate, setEndDate] = useState(mission.endDate.split('T')[0]); // Assume formato 'YYYY-MM-DD'
    const [status, setStatus] = useState(mission.status);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit({
            leader,
            members,
            endDate,
            status,
        });
    };

    const handleMemberChange = (event: SelectChangeEvent<string[]>) => {
        setMembers(event.target.value as string[]);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <FormControl fullWidth margin="normal">
                <InputLabel>Líder</InputLabel>
                <Select
                    value={leader}
                    onChange={(e) => setLeader(e.target.value)}
                    label="Líder"
                >
                    {users.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                            {user.username}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
                <InputLabel>Membros da Equipe</InputLabel>
                <Select
                    multiple
                    value={members}
                    onChange={handleMemberChange}
                    input={<OutlinedInput label="Membros da Equipe" />}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                                <Chip key={value} label={users.find(u => u._id === value)?.username || value} />
                            ))}
                        </Box>
                    )}
                >
                    {users.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                            {user.username}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField
                fullWidth
                margin="normal"
                label="Data de Conclusão"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{
                    shrink: true,
                }}
            />
            <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Mission['status'])}
                    label="Status"
                >
                    <MenuItem value="pendente">Pendente</MenuItem>
                    <MenuItem value="em-progresso">Em Progresso</MenuItem>
                    <MenuItem value="concluida">Concluída</MenuItem>
                </Select>
            </FormControl>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button onClick={onClose} sx={{ mr: 1 }}>
                    Cancelar
                </Button>
                <Button type="submit" variant="contained" color="primary">
                    Salvar Alterações
                </Button>
            </Box>
        </Box>
    );
};

export default MissionEditForm;
