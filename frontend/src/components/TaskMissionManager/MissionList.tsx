import React, { useState } from 'react';
import {
    Grid,
    Card,
    CardContent,
    Typography,
    Modal,
    Box,
} from '@mui/material';
import { Mission, User, Task } from '../../types';
import MissionDetails from './MissionDetails';

interface MissionListProps {
    missions: Mission[];
    users: User[];
    tasks: Task[];
    onMissionClick: (mission: Mission) => void;
    onSave: (updatedMission: Mission) => void;
    onDelete: (missionId: string) => void;
    onTaskClick: (task: Task) => void;
    onCreateTask: (task: Omit<Task, '_id'>) => void;
}

const MissionList: React.FC<MissionListProps> = ({
    missions,
    users,
    tasks,
    onMissionClick,
    onSave,
    onDelete,
    onTaskClick,
    onCreateTask,
}) => {
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);

    const handleMissionClick = (mission: Mission) => {
        setSelectedMission(mission);
        onMissionClick(mission);
    };

    const handleClose = () => {
        setSelectedMission(null);
    };

    const handleDelete = () => {
        if (selectedMission) {
            onDelete(selectedMission._id);
            handleClose();
        }
    };

    return (
        <>
            <Grid container spacing={2}>
                {missions.map((mission) => (
                    <Grid item xs={12} sm={6} md={4} key={mission._id}>
                        <Card
                            onClick={() => handleMissionClick(mission)}
                            sx={{
                                cursor: 'pointer',
                                '&:hover': { boxShadow: 6 }
                            }}
                        >
                            <CardContent>
                                <Typography variant="h6">{mission.title}</Typography>
                                <Typography color="textSecondary">{mission.description}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            <Modal
                open={!!selectedMission}
                onClose={handleClose}
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '80%',
                    maxWidth: 600,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                }}>
                    {selectedMission && (
                        <MissionDetails
                            mission={selectedMission}
                            users={users}
                            tasks={tasks}
                            onDelete={handleDelete}
                            onClose={handleClose}
                            onTaskClick={onTaskClick}
                            onCreateTask={onCreateTask}
                        />
                    )}
                </Box>
            </Modal>
        </>
    );
};

export default MissionList;
