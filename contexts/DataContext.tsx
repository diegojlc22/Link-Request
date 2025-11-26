import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Company, Unit, User, RequestTicket, Comment, UserRole, RequestStatus, FirebaseConfig } from '../types';
import { formatISO } from 'date-fns';
import { initFirebase, fbSet, fbUpdate, fbDelete, fbSubscribe, fbSubscribeRecent, fbUpdateMulti, isFirebaseInitialized } from '../services/firebaseService';

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
    .replace(/on\w+=/gi, "")
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

  const COMMENTS_LIMIT = 2000;

  useEffect(() => {
    let unsubCompanies: () => void = () => {};
    let unsubUnits: () => void = () => {};
    let unsubUsers: () => void = () => {};
    let unsubRequests: () => void = () => {};
    let unsubComments: () => void = () => {};
    let isMounted = true; 

    // NÃO USAR ASYNC AQUI. Conectar listeners imediatamente.
    const startListeners = () => {
      const success = initFirebase();
      
      if (success) {
        if(isMounted) setIsDbConnected(true);

        unsubUsers = fbSubscribe<User>('users', (data) => { 
            if(isMounted && data) {
                setUsers(data);
                if (data.length === 0) {
                    setIsSetupDone(false);
                } else {
                    setIsSetupDone(true);
                }
                setIsLoading(false);
            }
        });

        unsubCompanies = fbSubscribe<Company>('companies', (data) => isMounted && data && setCompanies(data));
        unsubUnits = fbSubscribe<Unit>('units', (data) => isMounted && data && setUnits(data));
        unsubRequests = fbSubscribe<RequestTicket>('requests', (data) => {
            if(isMounted && Array.isArray(data)) {
                setRequests(data);
            }
        });
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

    startListeners();

    return () => {
      isMounted = false;
      if (unsubCompanies) unsubCompanies();
      if (unsubUnits) unsubUnits();
      if (unsubUsers) unsubUsers();
      if (unsubRequests) unsubRequests();
      if (unsubComments) unsubComments();
    };
  }, []); 

  useEffect(() => {
    if (companies.length > 0 && companies[0].name) {
      document.title = companies[0].name;
    }
  }, [companies]);

  // Memoized Sort
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
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

  // --- ACTIONS ---

  const setupSystem = useCallback((data: SetupData) => {
    const newCompany: Company = { id: 'c1', name: sanitizeInput(data.companyName), domain: 'system.local', logoUrl: '' };
    const newUnit: Unit = { id: 'u1', companyId: 'c1', name: 'Matriz', location: 'Sede Principal' };
    const newAdmin: User = {
      id: 'admin1', companyId: 'c1', name: sanitizeInput(data.adminName), email: sanitizeInput(data.adminEmail),
      password: data.adminPassword, role: UserRole.ADMIN,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizeInput(data.adminName))}&background=random`
    };

    if (isFirebaseInitialized()) {
        fbSet('companies', newCompany.id, newCompany);
        fbSet('units', newUnit.id, newUnit);
        fbSet('users', newAdmin.id, newAdmin);
    } else {
        alert("Erro: Banco de dados não conectado.");
        return;
    }
    setCompanies([newCompany]); setUnits([newUnit]); setUsers([newAdmin]); setIsSetupDone(true);
  }, []);

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
    setRequests([]); 
    
    setIsDbConnected(true); 
    setIsSetupDone(true);
    setIsLoading(false);
  }, []);

  const addRequest = useCallback((req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => {
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
    
    // Optimistic Update
    setRequests(prev => [newRequest, ...prev]);

    // Check DB status directly to ensure write
    if (isFirebaseInitialized()) {
      fbSet('requests', newRequest.id, newRequest).catch(e => {
        console.error("Firebase Add Request Failed", e);
        // Optional: Rollback state here if needed
      });
    } else {
        console.error("Firebase not initialized during addRequest");
    }
  }, []);

  const updateRequestStatus = useCallback((id: string, status: RequestStatus) => {
    const updatedAt = formatISO(new Date());
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt } : r));
    if (isFirebaseInitialized()) fbUpdate('requests', id, { status, updatedAt });
  }, []);

  const updateRequest = useCallback((id: string, data: Partial<RequestTicket>) => {
    const updatedAt = formatISO(new Date());
    const sanitized = { ...data, updatedAt };
    if (sanitized.title) sanitized.title = sanitizeInput(sanitized.title);
    if (sanitized.description) sanitized.description = sanitizeInput(sanitized.description);
    
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...sanitized } : r));
    if (isFirebaseInitialized()) fbUpdate('requests', id, sanitized);
  }, []);

  const bulkUpdateRequestStatus = useCallback((ids: string[], status: RequestStatus) => {
    const updatedAt = formatISO(new Date());
    setRequests(prev => prev.map(r => ids.includes(r.id) ? { ...r, status, updatedAt } : r));
    if (isFirebaseInitialized()) {
      const updates: Record<string, any> = {};
      ids.forEach(id => {
        updates[`requests/${id}/status`] = status;
        updates[`requests/${id}/updatedAt`] = updatedAt;
      });
      fbUpdateMulti(updates);
    }
  }, []);

  const deleteRequest = useCallback((id: string) => {
    setRequests(prev => prev.filter(r => r.id !== id));
    if (isFirebaseInitialized()) fbDelete('requests', id);
  }, []);

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

    if (isFirebaseInitialized()) {
      fbSet('comments', newComment.id, newComment);
      fbUpdate('requests', ticketId, { updatedAt });
    }
  }, []);

  const addUnit = useCallback((unit: Omit<Unit, 'id'>) => {
    const newUnit = { ...unit, name: sanitizeInput(unit.name), location: sanitizeInput(unit.location), id: `u${Date.now()}` };
    setUnits(prev => [...prev, newUnit]);
    if (isFirebaseInitialized()) fbSet('units', newUnit.id, newUnit);
  }, []);

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    const newUser = { ...user, name: sanitizeInput(user.name), email: sanitizeInput(user.email), id: `user${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
    if (isFirebaseInitialized()) fbSet('users', newUser.id, newUser);
  }, []);

  const updateUserPassword = useCallback((userId: string, pass: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: pass } : u));
    if (isFirebaseInitialized()) fbUpdate('users', userId, { password: pass });
  }, []);

  const updateUser = useCallback((userId: string, data: Partial<User>) => {
    const sanitized = { ...data };
    if (sanitized.name) sanitized.name = sanitizeInput(sanitized.name);
    if (sanitized.email) sanitized.email = sanitizeInput(sanitized.email);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...sanitized } : u));
    if (isFirebaseInitialized()) fbUpdate('users', userId, sanitized);
  }, []);

  const updateCompany = useCallback((id: string, data: Partial<Company>) => {
    const sanitized = { ...data };
    if (sanitized.name) sanitized.name = sanitizeInput(sanitized.name);
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...sanitized } : c));
    if (isFirebaseInitialized()) fbUpdate('companies', id, sanitized);
  }, []);

  const deleteUnit = useCallback((id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    if (isFirebaseInitialized()) fbDelete('units', id);
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (isFirebaseInitialized()) fbDelete('users', id);
  }, []);

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