
import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';
import { useData } from './DataContext';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLeader: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users } = useData();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const login = (email: string, password: string) => {
    const user = users.find(u => u.email === email);
    if (user && user.password === password) {
      setCurrentUser(user);
      return true;
    } else {
      return false;
    }
  };

  const logout = () => setCurrentUser(null);

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isLeader = currentUser?.role === UserRole.LEADER;

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      logout, 
      isAuthenticated: !!currentUser,
      isAdmin,
      isLeader
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
