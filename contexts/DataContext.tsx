import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Company, Unit, User, RequestTicket, Comment, UserRole, RequestStatus, FirebaseConfig } from '../types';
import { formatISO } from 'date-fns';
import { initFirebase, fbSet, fbUpdate, fbDelete, fbSubscribe, fbSubscribeRecent, fbUpdateMulti, fbGetAll } from '../services/firebaseService';

interface SetupData {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  firebaseConfig?: FirebaseConfig;
}

interface DataContextType {
  companies: Company[];
  units: Unit[];
  users: User[];
  requests: RequestTicket[];
  comments: Comment[];
  isSetupDone: boolean;
  setupSystem: (data: SetupData) => void;
  enableDemoMode: () => void;
  isDbConnected: boolean;
  isLoading: boolean;
  addRequest: (req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  updateRequest: (id: string, data: Partial<RequestTicket>) => void;
  bulkUpdateRequestStatus: (ids: string[], status: RequestStatus) => void;
  deleteRequest: (id: string) => void;
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

// SECURITY FIX: Enhanced sanitization
const sanitizeInput = (str: string): string => {
  if (!str) return '';
  return str
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/script/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "") // remove event handlers like onclick=
    .trim();
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSetupDone, setIsSetupDone] = useState<boolean>(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RequestTicket[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Constants for Query Limits
  // Alterado: Removemos o limite das requests para garantir sincronização total em tempo real
  const COMMENTS_LIMIT = 2000;

  useEffect(() => {
    let unsubCompanies: () => void = () => {};
    let unsubUnits: () => void = () => {};
    let unsubUsers: () => void = () => {};
    let unsubRequests: () => void = () => {};
    let unsubComments: () => void = () => {};
    let isMounted = true; // MEMORY LEAK FIX

    const initDb = async () => {
      const success = initFirebase();
      
      if (success) {
        if(isMounted) setIsDbConnected(true);
        try {
          // Check if system is setup by fetching users only (lightweight)
          const initialUsers = await fbGetAll<User>('users');
          
          if (!isMounted) return;

          if (initialUsers.length === 0) {
            setIsSetupDone(false);
            setIsLoading(false);
          } else {
            setIsSetupDone(true);
            setUsers(initialUsers);
            
            // Fetch initial chunks for others
            const [initCos, initUnits] = await Promise.all([
                fbGetAll<Company>('companies'),
                fbGetAll<Unit>('units')
            ]);
            
            if (isMounted) {
                setCompanies(initCos);
                setUnits(initUnits);
                setIsLoading(false);
            }
          }
        } catch (err) {
          console.error("Error fetching initial data:", err);
          if (isMounted) {
            setIsSetupDone(true); // Fallback to avoid lockout
            setIsLoading(false);
          }
        }

        // Subscriptions
        unsubCompanies = fbSubscribe<Company>('companies', (data) => isMounted && data && setCompanies(data));
        unsubUnits = fbSubscribe<Unit>('units', (data) => isMounted && data && setUnits(data));
        unsubUsers = fbSubscribe<User>('users', (data) => { 
            if(isMounted && data) {
                setUsers(data);
                if(data.length > 0) setIsSetupDone(true);
            }
        });

        // CORREÇÃO DE SINCRONIZAÇÃO:
        // Trocamos fbSubscribeRecent por fbSubscribe.
        // O limitToLast pode causar problemas de sincronia entre clientes com horários diferentes
        // ou quando a chave gerada não entra no intervalo da query do outro cliente.
        // Ao usar fbSubscribe, garantimos que TODOS os clientes ouçam TODAS as mudanças na lista.
        unsubRequests = fbSubscribe<RequestTicket>('requests', (data) => {
            if(isMounted && Array.isArray(data)) setRequests(data);
        });

        // Comentários geralmente são muitos, mantemos o recent aqui se necessário, 
        // mas requests precisam de consistência total.
        unsubComments = fbSubscribeRecent<Comment>('comments', COMMENTS_LIMIT, (data) => {
            if(isMounted && Array.isArray(data)) setComments(data);
        });

      } else {
        if (isMounted) {
            setIsDbConnected(false);
            setIsLoading(false);
            setIsSetupDone(false);
        }
      }
    };

    initDb();

    return () => {
      isMounted = false; // Cleanup
      if (isDbConnected) {
        unsubCompanies(); unsubUnits(); unsubUsers(); unsubRequests(); unsubComments();
      }
    };
  }, []); // Run once on mount

  useEffect(() => {
    if (companies.length > 0 && companies[0].name) {
      document.title = companies[0].name;
    }
  }, [companies]);

  // Memoized Sort to prevent calculation on every render
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
        // Safe date parsing
        const getTime = (dateStr?: string) => {
             if(!dateStr) return 0;
             const t = new Date(dateStr).getTime();
             return isNaN(t) ? 0 : t;
        };
        const timeA = getTime(a.updatedAt) || getTime(a.createdAt);
        const timeB = getTime(b.updatedAt) || getTime(b.createdAt);
        return timeB - timeA;
    });
  }, [requests]);

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [comments]);

  // --- ACTIONS (Mantidas idênticas, apenas encapsulamento de erros) ---

  const setupSystem = useCallback((data: SetupData) => {
    const newCompany: Company = { id: 'c1', name: sanitizeInput(data.companyName), domain: 'system.local', logoUrl: '' };
    const newUnit: Unit = { id: 'u1', companyId: 'c1', name: 'Matriz', location: 'Sede Principal' };
    const newAdmin: User = {
      id: 'admin1', companyId: 'c1', name: sanitizeInput(data.adminName), email: sanitizeInput(data.adminEmail),
      password: data.adminPassword, role: UserRole.ADMIN,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizeInput(data.adminName))}&background=random`
    };

    if (isDbConnected) {
        fbSet('companies', newCompany.id, newCompany);
        fbSet('units', newUnit.id, newUnit);
        fbSet('users', newAdmin.id, newAdmin);
    } else {
        alert("Erro: Banco de dados não conectado.");
        return;
    }
    setCompanies([newCompany]); setUnits([newUnit]); setUsers([newAdmin]); setIsSetupDone(true);
  }, [isDbConnected]);

  const enableDemoMode = useCallback(() => {
    const demoCompany: Company = { id: 'c-demo', name: 'Empresa Demo', domain: 'demo.com', logoUrl: '' };
    const demoUnit: Unit = { id: 'u-demo', companyId: 'c-demo', name: 'Matriz Demo', location: 'Demo City, DC' };
    const demoAdmin: User = {
        id: 'admin-demo', companyId: 'c-demo', name: 'Admin Demo', email: 'admin@demo.com',
        password: '123', role: UserRole.ADMIN,
        avatarUrl: `https://ui-avatars.com/api/?name=Admin+Demo&background=random`
    };
    
    setCompanies([demoCompany]);
    setUnits([demoUnit]);
    setUsers([demoAdmin]);
    setRequests([]); // Start empty for demo
    
    setIsDbConnected(true); // Mock connection
    setIsSetupDone(true); // Mock setup done
    setIsLoading(false);
  }, []);

  const addRequest = useCallback((req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => {
    const newRequest: RequestTicket = {
      ...req,
      title: sanitizeInput(req.title),
      description: sanitizeInput(req.description),
      productUrl: sanitizeInput(req.productUrl || ''),
      id: `r${Date.now()}`, // Timestamp garante ordenação natural pelo ID/Key no Firebase
      createdAt: formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      attachments: req.attachments || [],
      viewedByAssignee: false,
    };
    
    // Optimistic Update
    setRequests(prev => [newRequest, ...prev]);

    if (isDbConnected) {
      fbSet('requests', newRequest.id, newRequest).catch(e => console.error("Firebase Add Request Failed", e));
    }
  }, [isDbConnected]);

  const updateRequestStatus = useCallback((id: string, status: RequestStatus) => {
    const updatedAt = formatISO(new Date());
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt } : r));
    if (isDbConnected) fbUpdate('requests', id, { status, updatedAt });
  }, [isDbConnected]);

  const updateRequest = useCallback((id: string, data: Partial<RequestTicket>) => {
    const updatedAt = formatISO(new Date());
    const sanitized = { ...data, updatedAt };
    if (sanitized.title) sanitized.title = sanitizeInput(sanitized.title);
    if (sanitized.description) sanitized.description = sanitizeInput(sanitized.description);
    
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...sanitized } : r));
    if (isDbConnected) fbUpdate('requests', id, sanitized);
  }, [isDbConnected]);

  const bulkUpdateRequestStatus = useCallback((ids: string[], status: RequestStatus) => {
    const updatedAt = formatISO(new Date());
    setRequests(prev => prev.map(r => ids.includes(r.id) ? { ...r, status, updatedAt } : r));
    if (isDbConnected) {
      const updates: Record<string, any> = {};
      ids.forEach(id => {
        updates[`requests/${id}/status`] = status;
        updates[`requests/${id}/updatedAt`] = updatedAt;
      });
      fbUpdateMulti(updates);
    }
  }, [isDbConnected]);

  const deleteRequest = useCallback((id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    if (isDbConnected) fbDelete('requests', id);
  }, [isDbConnected]);

  const addComment = useCallback((ticketId: string, userId: string, content: string) => {
    const newComment: Comment = {
      id: `cm${Date.now()}`,
      requestId: ticketId,
      userId,
      content: sanitizeInput(content),
      createdAt: formatISO(new Date())
    };
    const updatedAt = formatISO(new Date());

    setComments(prev => [...prev, newComment]);
    setRequests(prev => prev.map(r => r.id === ticketId ? { ...r, updatedAt } : r));

    if (isDbConnected) {
      fbSet('comments', newComment.id, newComment);
      fbUpdate('requests', ticketId, { updatedAt });
    }
  }, [isDbConnected]);

  const addUnit = useCallback((unit: Omit<Unit, 'id'>) => {
    const newUnit = { ...unit, name: sanitizeInput(unit.name), location: sanitizeInput(unit.location), id: `u${Date.now()}` };
    setUnits(prev => [...prev, newUnit]);
    if (isDbConnected) fbSet('units', newUnit.id, newUnit);
  }, [isDbConnected]);

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    const newUser = { ...user, name: sanitizeInput(user.name), email: sanitizeInput(user.email), id: `user${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
    if (isDbConnected) fbSet('users', newUser.id, newUser);
  }, [isDbConnected]);

  const updateUserPassword = useCallback((userId: string, pass: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: pass } : u));
    if (isDbConnected) fbUpdate('users', userId, { password: pass });
  }, [isDbConnected]);

  const updateUser = useCallback((userId: string, data: Partial<User>) => {
    const sanitized = { ...data };
    if (sanitized.name) sanitized.name = sanitizeInput(sanitized.name);
    if (sanitized.email) sanitized.email = sanitizeInput(sanitized.email);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...sanitized } : u));
    if (isDbConnected) fbUpdate('users', userId, sanitized);
  }, [isDbConnected]);

  const updateCompany = useCallback((id: string, data: Partial<Company>) => {
    const sanitized = { ...data };
    if (sanitized.name) sanitized.name = sanitizeInput(sanitized.name);
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...sanitized } : c));
    if (isDbConnected) fbUpdate('companies', id, sanitized);
  }, [isDbConnected]);

  const deleteUnit = useCallback((id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    if (isDbConnected) fbDelete('units', id);
  }, [isDbConnected]);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (isDbConnected) fbDelete('users', id);
  }, [isDbConnected]);

  const getRequestsByUnit = useCallback((unitId: string) => sortedRequests.filter(r => r.unitId === unitId), [sortedRequests]);
  const getRequestsByCompany = useCallback((companyId: string) => sortedRequests.filter(r => r.companyId === companyId), [sortedRequests]);
  const getCommentsByRequest = useCallback((requestId: string) => sortedComments.filter(c => c.requestId === requestId), [sortedComments]);

  const value = useMemo(() => ({
    companies, units, users, requests: sortedRequests, comments: sortedComments,
    isDbConnected, isLoading, isSetupDone,
    addRequest, updateRequestStatus, updateRequest, bulkUpdateRequestStatus, deleteRequest, addComment,
    addUnit, addUser, updateUserPassword, updateUser, updateCompany, deleteUnit, deleteUser,
    getRequestsByUnit, getRequestsByCompany, getCommentsByRequest, setupSystem, enableDemoMode
  }), [
    companies, units, users, sortedRequests, sortedComments,
    isDbConnected, isLoading, isSetupDone,
    addRequest, updateRequestStatus, updateRequest, bulkUpdateRequestStatus, deleteRequest, addComment,
    addUnit, addUser, updateUserPassword, updateUser, updateCompany, deleteUnit, deleteUser,
    getRequestsByUnit, getRequestsByCompany, getCommentsByRequest, setupSystem, enableDemoMode
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};