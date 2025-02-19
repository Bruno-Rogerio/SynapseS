// models/Company.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  plan: string;
  // Adicione outros campos conforme necessário
}

const CompanySchema: Schema = new Schema({
  name: { type: String, required: true },
  plan: { type: String, required: true },
  // Adicione outros campos conforme necessário
}, { timestamps: true });

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
