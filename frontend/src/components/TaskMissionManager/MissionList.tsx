import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Grid,
    Card,
    CardContent,
    CardActions,
    LinearProgress
} from '@mui/material';
import MissionDetails from './MissionDetails';
import { Mission, User, Task } from '../../types';

interface MissionListProps {
    missions: Mission[];
    users: User[];
}

const MissionList: React.FC<MissionListProps> = ({ missions, users }) => {
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

    const handleSaveMission = (updatedMission: Mission) => {
        console.log('Mission saved:', updatedMission);
        // Implementar a lógica para salvar a missão atualizada
        // Por exemplo, fazer uma chamada API para atualizar a missão no backend
        setSelectedMission(null);
    };

    const handleDeleteMission = () => {
        if (selectedMission) {
            console.log('Mission deleted:', selectedMission._id);
            // Implementar a lógica para deletar a missão
            // Por exemplo, fazer uma chamada API para deletar a missão no backend
        }
        setSelectedMission(null);
    };

    const handleCloseMissionDetails = () => {
        setSelectedMission(null);
    };

    const handleTaskClick = (task: Task) => {
        console.log('Task clicked:', task);
        // Implementar a lógica para lidar com o clique na tarefa
        // Por exemplo, abrir um modal com os detalhes da tarefa
    };

    const calculateProgress = (mission: Mission) => {
        const completedTasks = mission.tasks.filter(task => task.status === 'completed').length;
        return (completedTasks / mission.tasks.length) * 100;
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>Missões</Typography>
            {missions.length === 0 ? (
                <Typography>Nenhuma missão encontrada.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {missions.map(mission => (
                        <Grid item xs={12} sm={6} md={4} key={mission._id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">{mission.title}</Typography>
                                    <Typography color="textSecondary" gutterBottom>
                                        Líder: {users.find(user => user._id === mission.leader)?.username}
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={calculateProgress(mission)}
                                        sx={{ mt: 2, mb: 1 }}
                                    />
                                    <Typography variant="body2">
                                        Progresso: {Math.round(calculateProgress(mission))}%
                                    </Typography>
                                </CardContent>
                                <CardActions>
                                    <Button size="small" onClick={() => setSelectedMission(mission)}>
                                        Ver Detalhes
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
            {selectedMission && (
                <MissionDetails
                    mission={selectedMission}
                    users={users}
                    onSave={handleSaveMission}
                    onDelete={handleDeleteMission}
                    onClose={handleCloseMissionDetails}
                    onTaskClick={handleTaskClick}
                />
            )}
        </Box>
    );
};

export default MissionList;
