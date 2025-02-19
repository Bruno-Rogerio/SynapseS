// models/Invite.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IInvite extends Document {
  email: string;
  companyId: mongoose.Types.ObjectId;
  role: string;
  token: string;
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'expired';
}

const InviteSchema: Schema = new Schema({
  email: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  role: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' }
}, { timestamps: true });

export const Invite = mongoose.model<IInvite>('Invite', InviteSchema);
