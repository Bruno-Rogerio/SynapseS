// frontend/src/components/TaskMissionManager/HorizontalMissionTimeline.tsx
import React from 'react';
import { Box, Typography, IconButton, Paper, Avatar } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { Mission, User } from '../../types';

interface HorizontalMissionTimelineProps {
    missions: Mission[];
    users: User[];
    onMissionClick: (mission: Mission) => void;
    onAddTask: (missionId: string) => void;
    onEditMission: (mission: Mission) => void;
}

const HorizontalMissionTimeline: React.FC<HorizontalMissionTimelineProps> = ({
    missions,
    users,
    onMissionClick,
    onAddTask,
    onEditMission,
}) => {
    // Ordena as missões pela data de início
    const sortedMissions = [...missions].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );

    return (
        <Box sx={{ overflowX: 'auto', whiteSpace: 'nowrap', p: 2, position: 'relative' }}>
            {/* Linha horizontal de base */}
            <Box sx={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 2, bgcolor: 'grey.300' }} />
            {sortedMissions.map((mission, index) => (
                <Box
                    key={mission._id}
                    sx={{
                        display: 'inline-flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        mx: 2,
                        position: 'relative',
                    }}
                >
                    <Box
                        onClick={() => onMissionClick(mission)}
                        sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor:
                                mission.status === 'pending'
                                    ? 'warning.main'
                                    : mission.status === 'in_progress'
                                        ? 'primary.main'
                                        : 'success.main',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            border: '2px solid white',
                        }}
                    >
                        <Typography variant="caption">{index + 1}</Typography>
                    </Box>
                    <Typography variant="caption" sx={{ mt: 1, textAlign: 'center', maxWidth: 80 }}>
                        {mission.title}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onAddTask(mission._id);
                            }}
                        >
                            <AddIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEditMission(mission);
                            }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default HorizontalMissionTimeline;
