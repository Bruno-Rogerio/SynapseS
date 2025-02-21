// frontend/src/components/TaskMissionManager/MissionsTimeline.tsx
import React from 'react';
import { Box } from '@mui/material';
import MissionTimelineCard from './MissionTimelineCard';
import { Mission, Task, User } from '../../types';

interface MissionsTimelineProps {
    missions: Mission[];
    tasks: Task[];
    users: User[];
    onEditMission: (mission: Mission) => void;
    onDeleteMission: (missionId: string) => void;
    onAddTask: (missionId: string) => void;
    onTaskClick: (task: Task) => void;
}

const MissionsTimeline: React.FC<MissionsTimelineProps> = ({
    missions,
    tasks,
    users,
    onEditMission,
    onDeleteMission,
    onAddTask,
    onTaskClick,
}) => {
    return (
        <Box sx={{ p: 2 }}>
            {missions.map(mission => (
                <MissionTimelineCard
                    key={mission._id}
                    mission={mission}
                    tasks={tasks}
                    users={users}
                    onEditMission={onEditMission}
                    onDeleteMission={onDeleteMission}
                    onAddTask={onAddTask}
                    onTaskClick={onTaskClick}
                />
            ))}
        </Box>
    );
};

export default MissionsTimeline;
