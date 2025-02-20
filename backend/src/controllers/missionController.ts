import { Request, Response } from 'express';
import { Mission } from '../models/Mission';

export const createMission = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Received mission data:', req.body);
        const {
            title,
            description,
            startDate,
            endDate,
            leader,
            team,
            tasks,
            createdBy,
            status,
            points,
            comments,
            attachments,
            color
        } = req.body;

        // Use o ID do usuário autenticado se createdBy não for fornecido
        const actualCreatedBy = createdBy || req.user?.userId;

        if (!actualCreatedBy) {
            res.status(400).json({
                message: 'createdBy is required',
                error: 'User ID is missing'
            });
            return;
        }

        const mission = new Mission({
            title,
            description,
            startDate,
            endDate,
            leader,
            team,
            tasks,
            createdBy: actualCreatedBy,
            status,
            points,
            comments,
            attachments,
            color
        });

        const validationError = mission.validateSync();
        if (validationError) {
            console.log('Validation error:', validationError);
            res.status(400).json({
                message: 'Validation error',
                error: validationError.message
            });
            return;
        }

        await mission.save();
        res.status(201).json({ message: 'Mission created successfully', mission });
    } catch (error) {
        console.error('Error creating mission:', error);
        res.status(400).json({
            message: 'Error creating mission',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};


export const getMissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const missions = await Mission.find({ createdBy: req.user?.userId })
            .populate('tasks')
            .populate('leader', 'username')
            .populate('team', 'username');
        res.json(missions);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching missions',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const updateMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        const mission = await Mission.findByIdAndUpdate(missionId, req.body, { new: true, runValidators: true })
            .populate('tasks')
            .populate('leader', 'username')
            .populate('team', 'username');
        if (!mission) {
            res.status(404).json({ message: 'Mission not found' });
            return;
        }
        res.json(mission);
    } catch (error) {
        res.status(500).json({
            message: 'Error updating mission',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const deleteMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        const mission = await Mission.findByIdAndDelete(missionId);
        if (!mission) {
            res.status(404).json({ message: 'Mission not found' });
            return;
        }
        res.json({ message: 'Mission deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting mission',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const getMissionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        const mission = await Mission.findById(missionId)
            .populate('tasks')
            .populate('leader', 'username')
            .populate('team', 'username');

        if (!mission) {
            res.status(404).json({ message: 'Mission not found' });
            return;
        }

        res.json(mission);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching mission',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
