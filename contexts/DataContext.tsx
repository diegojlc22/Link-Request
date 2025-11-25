
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Company, Unit, User, RequestTicket, Comment, UserRole, RequestStatus, FirebaseConfig } from '../types';
import { formatISO } from 'date-fns';
import { initFirebase, fbSet, fbUpdate, fbDelete, fbSubscribe, fbUpdateMulti, fbGetAll } from '../services/firebaseService';

interface SetupData {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  firebaseConfig?: FirebaseConfig; // Mantido para compatibilidade, mas ignorado se FIXED_CONFIG estiver setado
}

interface DataContextType {
  companies: Company[];
  units: Unit[];
  users: User[];
  requests: RequestTicket[];
  comments: Comment[];
  
  // System Settings
  isSetupDone: boolean;
  setupSystem: (data: SetupData) => void;

  // Firebase
  isDbConnected: boolean;
  isLoading: boolean;

  // Actions
  addRequest: (req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  updateRequest: (id: string, data: Partial<RequestTicket>) => void;
  bulkUpdateRequestStatus: (ids: string[], status: RequestStatus) => void;
  addComment: (ticketId: string, userId: string, content: string) => void;
  addUnit: (unit: Omit<Unit, 'id'>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUserPassword: (userId: string, newPassword: string) => void;
  updateUser: (userId: string, data: Partial<User>) => void;
  updateCompany: (id: string, data: Partial<Company>) => void;
  deleteUnit: (id: string) => void;
  deleteUser: (id: string) => void;
  getRequestsByUnit: (unitId: string) => RequestTicket[];
  getRequestsByCompany: (companyId: string) => RequestTicket[];
  getCommentsByRequest: (requestId: string) => Comment[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to load from localStorage (Apenas para fallback visual inicial)
const loadState = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
};

// --- SECURITY UTILS ---
const sanitizeInput = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/script/gi, "")
    .replace(/javascript:/gi, "")
    .trim();
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // System State - Assume feito se houver usuários no banco, ou carrega do cache local momentaneamente
  const [isSetupDone, setIsSetupDone] = useState<boolean>(true); // Default to true to avoid flash, validated later

  // Local Data State
  const [companies, setCompanies] = useState<Company[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RequestTicket[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  
  // Firebase State
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize Firebase automatically
  useEffect(() => {
    let unsubCompanies: () => void = () => {};
    let unsubUnits: () => void = () => {};
    let unsubUsers: () => void = () => {};
    let unsubRequests: () => void = () => {};
    let unsubComments: () => void = () => {};

    const initDb = async () => {
      // Tenta iniciar com configuração fixa ou env vars
      const success = initFirebase();
      
      if (success) {
        setIsDbConnected(true);
        console.log("System initialized in Online Mode.");

        try {
          // Busca dados iniciais
          const [
            initialCompanies,
            initialUnits,
            initialUsers,
            initialRequests,
            initialComments
          ] = await Promise.all([
            fbGetAll<Company>('companies'),
            fbGetAll<Unit>('units'),
            fbGetAll<User>('users'),
            fbGetAll<RequestTicket>('requests'),
            fbGetAll<Comment>('comments')
          ]);

          // Lógica Fundamental: Se não tem usuários no banco, o sistema não foi configurado.
          if (initialUsers.length === 0) {
            setIsSetupDone(false);
          } else {
            setIsSetupDone(true);
            setCompanies(initialCompanies);
            setUnits(initialUnits);
            setUsers(initialUsers);
            setRequests(initialRequests);
            setComments(initialComments);
          }

        } catch (err) {
          console.error("Error fetching initial data:", err);
          // Em caso de erro de rede, assume setup done pra não travar na tela de setup sem poder fazer nada
          setIsSetupDone(true); 
        } finally {
          setIsLoading(false);
        }

        // Subscriptions
        unsubCompanies = fbSubscribe<Company>('companies', (data) => { if(data) setCompanies(data); });
        unsubUnits = fbSubscribe<Unit>('units', (data) => { if(data) setUnits(data); });
        unsubUsers = fbSubscribe<User>('users', (data) => { 
            if(data) {
                setUsers(data);
                // Se recebermos usuários via stream, confirma que o setup está feito
                if(data.length > 0) setIsSetupDone(true);
            }
        });
        unsubRequests = fbSubscribe<RequestTicket>('requests', (data) => { if(Array.isArray(data)) setRequests(data); });
        unsubComments = fbSubscribe<Comment>('comments', (data) => { if(Array.isArray(data)) setComments(data); });

      } else {
        console.warn("Firebase not configured properly.");
        setIsDbConnected(false);
        setIsLoading(false);
        setIsSetupDone(false); // Força setup se não conectar
      }
    };

    initDb();

    return () => {
      if (isDbConnected) {
        unsubCompanies(); unsubUnits(); unsubUsers(); unsubRequests(); unsubComments();
      }
    };
  }, []);

  // Update Document Title
  useEffect(() => {
    if (companies.length > 0 && companies[0].name) {
      document.title = companies[0].name;
    }
  }, [companies]);

  // Sort requests
  const sortedRequests = useMemo(() => {
    if (!Array.isArray(requests)) return [];
    return [...requests].sort((a, b) => {
        const getTime = (dateStr?: string) => {
             if(!dateStr) return 0;
             try {
               const t = new Date(dateStr).getTime();
               return isNaN(t) ? 0 : t;
             } catch (e) { return 0; }
        };
        const timeA = getTime(a.updatedAt) || getTime(a.createdAt);
        const timeB = getTime(b.updatedAt) || getTime(b.createdAt);
        return timeB - timeA;
    });
  }, [requests]);

  const sortedComments = useMemo(() => {
    if (!Array.isArray(comments)) return [];
    return [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [comments]);

  // --- ACTIONS ---

  const setupSystem = useCallback((data: SetupData) => {
    // Nesta nova versão, setupSystem apenas cria os dados iniciais no banco
    // A conexão já deve ter sido estabelecida via initFirebase()
    
    const newCompany: Company = { id: 'c1', name: sanitizeInput(data.companyName), domain: 'system.local', logoUrl: '' };
    const newUnit: Unit = { id: 'u1', companyId: 'c1', name: 'Matriz', location: 'Sede Principal' };
    const newAdmin: User = {
      id: 'admin1', companyId: 'c1', name: sanitizeInput(data.adminName), email: sanitizeInput(data.adminEmail),
      password: data.adminPassword, role: UserRole.ADMIN,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizeInput(data.adminName))}&background=random`
    };

    // Salva direto no Firebase
    if (isDbConnected) {
        fbSet('companies', newCompany.id, newCompany);
        fbSet('units', newUnit.id, newUnit);
        fbSet('users', newAdmin.id, newAdmin);
    } else {
        console.error("Cannot run setup: Database not connected");
        alert("Erro: Configure o arquivo firebaseService.ts com suas credenciais primeiro.");
        return;
    }

    // Atualiza estado local para feedback imediato
    setCompanies([newCompany]);
    setUnits([newUnit]);
    setUsers([newAdmin]);
    setIsSetupDone(true);
  }, [isDbConnected]);

  const addRequest = useCallback((req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => {
    try {
      const newRequest: RequestTicket = {
        ...req,
        title: sanitizeInput(req.title),
        description: sanitizeInput(req.description),
        productUrl: sanitizeInput(req.productUrl || ''),
        id: `r${Date.now()}`,
        createdAt: formatISO(new Date()),
        updatedAt: formatISO(new Date()),
        attachments: req.attachments || [],
        viewedByAssignee: false,
      };
      
      setRequests(prev => [newRequest, ...prev]);

      if (isDbConnected) {
        fbSet('requests', newRequest.id, newRequest).catch(e => console.error("Firebase Add Request Failed", e));
      }
    } catch (e) {
      console.error("Failed to add request:", e);
    }
  }, [isDbConnected]);

  const updateRequestStatus = useCallback((id: string, status: RequestStatus) => {
    const updatedDate = formatISO(new Date());
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt: updatedDate } : r));
    if (isDbConnected) {
      fbUpdate('requests', id, { status, updatedAt: updatedDate });
    }
  }, [isDbConnected]);

  const updateRequest = useCallback((id: string, data: Partial<RequestTicket>) => {
    const updatedDate = formatISO(new Date());
    const sanitizedData = { ...data };
    
    if (sanitizedData.title) sanitizedData.title = sanitizeInput(sanitizedData.title);
    if (sanitizedData.description) sanitizedData.description = sanitizeInput(sanitizedData.description);
    if (sanitizedData.productUrl) sanitizedData.productUrl = sanitizeInput(sanitizedData.productUrl);
    
    const finalUpdate = { ...sanitizedData, updatedAt: updatedDate };

    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...finalUpdate } : r));

    if (isDbConnected) {
      fbUpdate('requests', id, finalUpdate);
    }
  }, [isDbConnected]);

  const bulkUpdateRequestStatus = useCallback((ids: string[], status: RequestStatus) => {
    const updatedDate = formatISO(new Date());
    
    setRequests(prev => prev.map(r => 
      ids.includes(r.id) ? { ...r, status, updatedAt: updatedDate } : r
    ));

    if (isDbConnected) {
      const updates: Record<string, any> = {};
      ids.forEach(id => {
        updates[`requests/${id}/status`] = status;
        updates[`requests/${id}/updatedAt`] = updatedDate;
      });
      fbUpdateMulti(updates);
    }
  }, [isDbConnected]);

  const addComment = useCallback((ticketId: string, userId: string, content: string) => {
    const newComment: Comment = {
      id: `cm${Date.now()}`,
      requestId: ticketId,
      userId,
      content: sanitizeInput(content),
      createdAt: formatISO(new Date())
    };
    const updatedDate = formatISO(new Date());

    setComments(prev => [...prev, newComment]);
    setRequests(prev => prev.map(r => r.id === ticketId ? { ...r, updatedAt: updatedDate } : r));

    if (isDbConnected) {
      fbSet('comments', newComment.id, newComment);
      fbUpdate('requests', ticketId, { updatedAt: updatedDate });
    }
  }, [isDbConnected]);

  const addUnit = useCallback((unit: Omit<Unit, 'id'>) => {
    const newUnit = { 
      ...unit, 
      name: sanitizeInput(unit.name),
      location: sanitizeInput(unit.location),
      id: `u${Date.now()}` 
    };
    
    setUnits(prev => [...prev, newUnit]);

    if (isDbConnected) {
      fbSet('units', newUnit.id, newUnit);
    }
  }, [isDbConnected]);

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    const newUser = { 
      ...user, 
      name: sanitizeInput(user.name),
      email: sanitizeInput(user.email),
      id: `user${Date.now()}` 
    };
    
    setUsers(prev => [...prev, newUser]);
    
    if (isDbConnected) {
      fbSet('users', newUser.id, newUser);
    }
  }, [isDbConnected]);

  const updateUserPassword = useCallback((userId: string, newPassword: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    
    if (isDbConnected) {
      fbUpdate('users', userId, { password: newPassword });
    }
  }, [isDbConnected]);

  const updateUser = useCallback((userId: string, data: Partial<User>) => {
    const sanitizedData = { ...data };
    if (sanitizedData.name) sanitizedData.name = sanitizeInput(sanitizedData.name);
    if (sanitizedData.email) sanitizedData.email = sanitizeInput(sanitizedData.email);
    if (sanitizedData.name && !sanitizedData.avatarUrl) {
       sanitizedData.avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizedData.name)}&background=random`;
    }

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...sanitizedData } : u));
    
    if (isDbConnected) {
      fbUpdate('users', userId, sanitizedData);
    }
  }, [isDbConnected]);

  const updateCompany = useCallback((id: string, data: Partial<Company>) => {
    const sanitizedData = { ...data };
    if (sanitizedData.name) sanitizedData.name = sanitizeInput(sanitizedData.name);
    
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...sanitizedData } : c));
    
    if (isDbConnected) {
      fbUpdate('companies', id, sanitizedData);
    }
  }, [isDbConnected]);

  const deleteUnit = useCallback((id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    if (isDbConnected) fbDelete('units', id);
  }, [isDbConnected]);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (isDbConnected) fbDelete('users', id);
  }, [isDbConnected]);

  // --- GETTERS ---
  const getRequestsByUnit = useCallback((unitId: string) => sortedRequests.filter(r => r.unitId === unitId), [sortedRequests]);
  const getRequestsByCompany = useCallback((companyId: string) => sortedRequests.filter(r => r.companyId === companyId), [sortedRequests]);
  const getCommentsByRequest = useCallback((requestId: string) => sortedComments.filter(c => c.requestId === requestId), [sortedComments]);

  const value = useMemo(() => ({
    companies, units, users, requests: sortedRequests, comments: sortedComments,
    isDbConnected, isLoading,
    addRequest, updateRequestStatus, updateRequest, bulkUpdateRequestStatus, addComment,
    addUnit, addUser, updateUserPassword, updateUser, updateCompany, deleteUnit, deleteUser,
    getRequestsByUnit, getRequestsByCompany, getCommentsByRequest,
    isSetupDone, setupSystem
  }), [
    companies, units, users, sortedRequests, sortedComments,
    isDbConnected, isLoading, isSetupDone,
    addRequest, updateRequestStatus, updateRequest, bulkUpdateRequestStatus, addComment,
    addUnit, addUser, updateUserPassword, updateUser, updateCompany, deleteUnit, deleteUser,
    getRequestsByUnit, getRequestsByCompany, getCommentsByRequest, setupSystem
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
