// src/models/User.ts
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { IRole } from './Role';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullName: string;
  // Modificamos o tipo do role
  role: mongoose.Types.ObjectId | IRole; // Pode ser populado
  company: mongoose.Types.ObjectId;
  inviteStatus: 'pending' | 'accepted' | 'expired';
  bookmarks: mongoose.Types.ObjectId[];
  // Novos campos para permissões personalizadas
  additionalPermissions: string[];
  restrictedPermissions: string[];
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

interface IUserModel extends mongoose.Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

const UserSchema: Schema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  // Modificação aqui: de string para ObjectId com referência
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  inviteStatus: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Forum', default: [] }],
  // Novos campos
  additionalPermissions: [{ type: String, default: [] }],
  restrictedPermissions: [{ type: String, default: [] }]
}, { timestamps: true });

// Métodos existentes permanecem iguais
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.statics.findByEmail = function (email: string): Promise<IUser | null> {
  return this.findOne({ email });
};

export const User = mongoose.model<IUser, IUserModel>('User', UserSchema);
