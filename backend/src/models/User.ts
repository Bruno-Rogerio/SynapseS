import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: 'admin' | 'gestor' | 'usuario'; // Ou use 'admin' | 'manager' | 'user' para corresponder ao enum
  company: mongoose.Types.ObjectId;
  inviteStatus: 'pending' | 'accepted' | 'expired';
  bookmarks: mongoose.Types.ObjectId[]; // Nova propriedade para fóruns favoritos
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
  role: { type: String, enum: ['admin', 'manager', 'user'], default: 'user' },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  inviteStatus: { type: String, enum: ['pending', 'accepted', 'expired'], default: 'pending' },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Forum', default: [] }], // Campo para armazenar favoritos
}, { timestamps: true });

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
