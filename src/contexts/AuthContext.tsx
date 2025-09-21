import { createContext, useState, useEffect } from 'react';
import ApiService from '../lib/api';

interface User {
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

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  country: 'mozambique' | 'rwanda';
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('umapesa_token');
        const savedUser = localStorage.getItem('umapesa_user');
        
        if (token && savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        ApiService.logout();
        setUser(null);
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Demo authentication - any email + any password works
      if (!email || !password) {
        return false;
      }

      // Determine user role based on email
      const isAdmin = email === 'admin@umapesa.com';
      
      // Create demo user object
      const demoUser = {
        id: isAdmin ? 'admin-123' : 'user-123',
        email: isAdmin ? 'admin@example.com' : 'user@example.com',
        firstName: isAdmin ? 'Admin' : 'Demo',
        lastName: isAdmin ? 'User' : 'User',
        phone: isAdmin ? '+258841234567' : '+258841234568',
        country: 'mozambique' as const,
        role: isAdmin ? 'admin' as const : 'user' as const,
        isVerified: true,
        kycStatus: 'approved' as const,
        createdAt: new Date().toISOString(),
        token: 'demo-jwt-token'
      };

      // Store demo user data
      localStorage.setItem('umapesa_token', 'demo-jwt-token');
      localStorage.setItem('umapesa_user', JSON.stringify(demoUser));
      
      setUser(demoUser);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      // Demo registration - any data works
      const demoUser = {
        id: 'demo-user-' + Date.now(),
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        country: userData.country,
        role: 'user' as const,
        isVerified: true,
        kycStatus: 'approved' as const,
        createdAt: new Date().toISOString(),
        token: 'demo-jwt-token'
      };

      // Store demo user data
      localStorage.setItem('umapesa_token', 'demo-jwt-token');
      localStorage.setItem('umapesa_user', JSON.stringify(demoUser));
      
      setUser(demoUser);
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const logout = () => {
    ApiService.logout();
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>): Promise<boolean> => {
    try {
      if (!user) return false;
      
      // Demo profile update
      const updatedUser = { ...user, ...data };
      localStorage.setItem('umapesa_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// useAuth hook has been moved to src/hooks/useAuth.ts