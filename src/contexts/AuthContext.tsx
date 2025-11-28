import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { useData } from './DataContext';
import { getFirebaseAuth, fbSignIn, fbSignOut, fbOnAuthStateChanged } from '../services/firebaseService';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: any }>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLeader: boolean;
  isLoadingAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { users } = useData();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Monitora o estado real do Firebase Auth
    const unsubscribe = fbOnAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
            // O usuário está logado no Firebase Auth.
            const dbUser = users.find(u => u.email === firebaseUser.email || u.id === firebaseUser.uid);
            
            if (dbUser) {
                const finalUser = { ...dbUser, id: firebaseUser.uid };
                setCurrentUser(finalUser);
            } else {
                setCurrentUser({
                    id: firebaseUser.uid,
                    companyId: 'unknown',
                    name: firebaseUser.displayName || firebaseUser.email || 'Usuário',
                    email: firebaseUser.email || '',
                    role: UserRole.USER,
                    avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email}`
                });
            }
        } else {
            setCurrentUser(null);
        }
        setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [users]); 

  const login = async (email: string, password: string) => {
    try {
      await fbSignIn(email, password);
      return { success: true };
    } catch (e: any) {
      console.error("Login failed details:", e);
      return { success: false, error: e };
    }
  };

  const logout = async () => {
    await fbSignOut();
    setCurrentUser(null);
  };

  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const isLeader = currentUser?.role === UserRole.LEADER;

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      login, 
      logout, 
      isAuthenticated: !!currentUser,
      isAdmin,
      isLeader,
      isLoadingAuth
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