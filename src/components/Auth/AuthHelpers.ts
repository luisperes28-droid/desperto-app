import { User } from './AuthTypes';

// Production environment - users must register through proper channels
export const defaultUsers: any[] = [];

export function validateCredentials(username: string, password: string) {
  // In production, all authentication should go through Supabase
  // This function is kept for backward compatibility but returns null
  return null;
}

export function isStaffUser(userType: string): boolean {
  return userType === 'admin' || userType === 'therapist';
}

export function createUserData(foundUser: typeof defaultUsers[0]): User {
  return {
    id: foundUser.id,
    username: foundUser.username,
    email: foundUser.email,
    userType: foundUser.userType,
    fullName: foundUser.fullName
  };
}