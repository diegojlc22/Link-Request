import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { useData } from './DataContext';
import { getFirebaseAuth, fbSignIn, fbSignOut, fbOnAuthStateChanged } from '../services/firebaseService';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
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
            // Agora precisamos achar os dados dele no nosso Realtime Database (Role, Unit, etc)
            // Se a lista 'users' já estiver carregada via DataContext:
            const dbUser = users.find(u => u.email === firebaseUser.email || u.id === firebaseUser.uid);
            
            if (dbUser) {
                // Sincroniza ID se necessário (migração)
                const finalUser = { ...dbUser, id: firebaseUser.uid };
                setCurrentUser(finalUser);
            } else {
                // Usuário existe no Auth mas não no DB (ou DB ainda carregando)
                // Cria um objeto temporário
                setCurrentUser({
                    id: firebaseUser.uid,
                    companyId: 'unknown',
                    name: firebaseUser.displayName || firebaseUser.email || 'Usuário',
                    email: firebaseUser.email || '',
                    role: UserRole.USER, // Default seguro
                    avatarUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.email}`
                });
            }
        } else {
            setCurrentUser(null);
        }
        setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [users]); // Re-executa quando a lista de usuários do DB é atualizada

  const login = async (email: string, password: string) => {
    try {
      await fbSignIn(email, password);
      return true;
    } catch (e) {
      console.error("Login failed", e);
      return false;
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