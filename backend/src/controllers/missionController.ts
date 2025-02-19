import { Request, Response } from 'express';
import { Mission } from '../models/Mission';

export const createMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, startDate, endDate, createdBy, tasks, comments, attachments } = req.body;
        const mission = new Mission({ title, description, startDate, endDate, createdBy, tasks, comments, attachments });
        await mission.save();
        res.status(201).json({ message: 'Mission created successfully', mission });
    } catch (error) {
        res.status(400).json({
            message: 'Error creating mission',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const getMissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const missions = await Mission.find({ createdBy: req.user?.userId }).populate('tasks');
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
        const mission = await Mission.findByIdAndUpdate(missionId, req.body, { new: true, runValidators: true });
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
