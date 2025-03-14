// services/companyService.ts
import { Company, ICompany } from '../models/Company';
import { User, IUser } from '../models/User';
import { Role } from '../models/Role';
import { hashPassword } from '../utils/passwordUtils';

export const registerCompanyAndAdmin = async (
  companyName: string,
  plan: string,
  adminUsername: string,
  adminEmail: string,
  adminPassword: string,
  adminFullName: string
): Promise<{ company: ICompany; admin: IUser }> => {
  // Criar a empresa
  const company = new Company({ name: companyName, plan });
  await company.save();

  // Buscar o papel de admin
  const adminRole = await Role.findOne({ name: 'admin' });
  if (!adminRole) {
    throw new Error('Papel de administrador não encontrado. Execute a inicialização de papéis primeiro.');
  }

  // Criar o admin
  const hashedPassword = await hashPassword(adminPassword);
  const admin = new User({
    username: adminUsername,
    email: adminEmail,
    password: hashedPassword,
    fullName: adminFullName,
    role: adminRole._id, // Usando o ObjectId do papel
    company: company._id,
    inviteStatus: 'accepted' // Admin já começa com conta ativa
  });

  await admin.save();
  return { company, admin };
};
