import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    Chip,
    Avatar,
    IconButton,
    Tooltip,
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import { Mission, User } from '../../types';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';

interface MissionTimelineProps {
    missions: Mission[];
    users: User[];
    onMissionClick: (mission: Mission) => void;
    onAddTask: (missionId: string) => void;
    onEditMission: (mission: Mission) => void;
}

const MissionTimeline: React.FC<MissionTimelineProps> = ({
    missions,
    users,
    onMissionClick,
    onAddTask,
    onEditMission,
}) => {
    const [status, setStatus] = useState<'all' | 'in_progress' | 'completed'>('all');

    const filteredMissions = missions.filter((mission) => {
        if (status === 'all') return true;
        return status === mission.status;
    });

    const getTimelineDotColor = (status: Mission['status']): "inherit" | "grey" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'in_progress':
                return 'primary';
            case 'completed':
                return 'success';
            default:
                return 'grey';
        }
    };

    const getChipColor = (status: Mission['status']): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
        switch (status) {
            case 'pending':
                return 'warning';
            case 'in_progress':
                return 'primary';
            case 'completed':
                return 'success';
            default:
                return 'default';
        }
    };

    return (
        <Box sx={{ width: '100%', overflowX: 'hidden' }}>
            <Paper sx={{ mb: 2, p: 2 }}>
                <Tabs value={status} onChange={(_, newValue) => setStatus(newValue as 'all' | 'in_progress' | 'completed')}>
                    <Tab label="Todas" value="all" />
                    <Tab label="Em Progresso" value="in_progress" />
                    <Tab label="Concluídas" value="completed" />
                </Tabs>
            </Paper>
            <Timeline position="alternate">
                {filteredMissions.map((mission) => (
                    <TimelineItem key={mission._id}>
                        <TimelineSeparator>
                            <TimelineDot color={getTimelineDotColor(mission.status)} />
                            <TimelineConnector />
                        </TimelineSeparator>
                        <TimelineContent>
                            <Paper elevation={3} sx={{ p: 2, cursor: 'pointer' }} onClick={() => onMissionClick(mission)}>
                                <Typography variant="h6" component="h1">
                                    {mission.title}
                                </Typography>
                                <Typography color="textSecondary">
                                    {new Date(mission.startDate).toLocaleDateString()} - {new Date(mission.endDate).toLocaleDateString()}
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Tooltip title={users.find(u => u._id === mission.leader)?.username || 'Líder'}>
                                            <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                                {users.find(u => u._id === mission.leader)?.username[0].toUpperCase()}
                                            </Avatar>
                                        </Tooltip>
                                        <Chip
                                            label={`${mission.tasks.length} tarefas`}
                                            size="small"
                                            sx={{ mr: 1 }}
                                        />
                                        <Chip
                                            label={mission.status}
                                            size="small"
                                            color={getChipColor(mission.status)}
                                        />
                                    </Box>
                                    <Box>
                                        <IconButton size="small" onClick={(e) => {
                                            e.stopPropagation();
                                            onAddTask(mission._id);
                                        }}>
                                            <AddIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton size="small" onClick={(e) => {
                                            e.stopPropagation();
                                            onEditMission(mission);
                                        }}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                </Box>
                            </Paper>
                        </TimelineContent>
                    </TimelineItem>
                ))}
            </Timeline>
        </Box>
    );
};

export default MissionTimeline;
