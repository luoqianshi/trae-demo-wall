import React, { createContext, useContext, useState } from 'react';

type Role = 'admin' | 'child';

interface AuthState {
  role: Role;
  childId: string | null;
  childName: string | null;
  switchToAdmin: (password: string) => boolean;
  switchToChild: (childId: string, childName: string) => void;
}

const ADMIN_PASSWORD = '123456';

const AuthContext = createContext<AuthState>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('admin');
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string | null>(null);

  const switchToAdmin = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setRole('admin');
      setChildId(null);
      setChildName(null);
      return true;
    }
    return false;
  };

  const switchToChild = (id: string, name: string) => {
    setRole('child');
    setChildId(id);
    setChildName(name);
  };

  return (
    <AuthContext.Provider value={{ role, childId, childName, switchToAdmin, switchToChild }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);