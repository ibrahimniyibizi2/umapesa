import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: 'mozambique' | 'rwanda';
  role: 'user' | 'admin';
  isVerified: boolean;
  kycStatus: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  token: string;
}

export const useAuth = () => {
  const authContext = useContext(AuthContext);
  
  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return authContext;
};
