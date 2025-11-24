
import React, { createContext, useContext, useState, useEffect } from 'react';
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
  
  // Initialize with persisted user if available
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('link_req_curr_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Error reading auth state", e);
      return null;
    }
  });

  // Persist session changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('link_req_curr_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('link_req_curr_user');
    }
  }, [currentUser]);

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
