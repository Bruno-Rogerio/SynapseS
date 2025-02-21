import mongoose, { Document, Schema } from 'mongoose';

export interface IReplyTo {
    messageId: mongoose.Types.ObjectId;
    userId: string;
    username: string;
    message: string;
}

export interface IChatMessage extends Document {
    missionId: mongoose.Types.ObjectId;
    userId: string;
    username: string;
    message: string;
    fileUrl?: string;
    reactions: Record<string, number>;
    createdAt: Date;
    replyTo?: IReplyTo;
}

const ReplyToSchema: Schema = new Schema({
    messageId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    message: { type: String, required: true },
}, { _id: false });

const ChatMessageSchema: Schema = new Schema(
    {
        missionId: { type: Schema.Types.ObjectId, ref: 'Mission', required: true },
        userId: { type: String, required: true },
        username: { type: String, required: true },
        message: { type: String, required: true },
        fileUrl: { type: String },
        reactions: { type: Schema.Types.Mixed, default: {} },
        createdAt: { type: Date, default: Date.now },
        replyTo: ReplyToSchema,
    },
    { versionKey: false }
);

export default mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
