// services/companyService.ts
import { Company, ICompany } from '../models/Company';
import { User, IUser } from '../models/User';
import { hashPassword } from '../utils/passwordUtils';

export const registerCompanyAndAdmin = async (
  companyName: string,
  plan: string,
  adminUsername: string,
  adminEmail: string,
  adminPassword: string,
  adminFullName: string
): Promise<{ company: ICompany; admin: IUser }> => {
  const company = new Company({ name: companyName, plan });
  await company.save();

  const hashedPassword = await hashPassword(adminPassword);
  const admin = new User({
    username: adminUsername,
    email: adminEmail,
    password: hashedPassword,
    fullName: adminFullName,
    role: 'admin',
    company: company._id
  });
  await admin.save();

  return { company, admin };
};
