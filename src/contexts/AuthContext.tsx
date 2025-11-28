import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { useData } from './DataContext';
import { fbSignIn, fbSignOut, fbOnAuthStateChanged } from '../services/firebaseService';

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
    const unsubscribe = fbOnAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
            // Tenta achar o perfil no banco (users)
            const dbUser = users.find(u => u.email === firebaseUser.email || u.id === firebaseUser.uid);
            
            if (dbUser) {
                // Usuário existe no banco -> Perfeito
                setCurrentUser({ ...dbUser, id: firebaseUser.uid });
            } else {
                // Usuário logou no Auth mas NÃO está no banco (pq foi deletado ou é novo)
                // Cria um usuário temporário na memória para permitir o fluxo (ex: ir para Setup)
                setCurrentUser({
                    id: firebaseUser.uid,
                    companyId: 'pending',
                    name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Admin',
                    email: firebaseUser.email || '',
                    role: UserRole.ADMIN, // Assume Admin se não tem DB, para permitir Setup
                    avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=Admin`
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
      console.error("Auth Error:", e);
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