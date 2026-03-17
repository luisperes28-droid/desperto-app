export interface User {
  id: string;
  username: string;
  email: string;
  userType: 'client' | 'therapist' | 'admin';
  fullName: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

export interface LoginFormData {
  username: string;
  email: string;
  password: string;
  fullName: string;
  confirmPassword?: string;
}