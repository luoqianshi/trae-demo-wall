import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userService } from '@/lib/services';
import type { User, LoginRequest } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const normalizeUser = (account: any): User => {
    const user: User = {
      ...account,
      name: account.doctorInfo?.name || account.patientInfo?.name || account.loginName || '',
      role: account.userType === 'DOCTOR' ? 'doctor' : account.userType === 'PATIENT' ? 'patient' : 'admin',
      dept: account.doctorInfo?.dept || account.department?.name || '',
    };
    return user;
  };

  const login = async (credentials: LoginRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await userService.login(credentials);
      const account = response.account || response.user;
      if (response.success && account) {
        const normalized = normalizeUser(account);
        setUser(normalized);
        localStorage.setItem('user', JSON.stringify(normalized));
        return { success: true };
      } else {
        return { success: false, error: response.error || '登录失败' };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '网络错误，请稍后重试' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
