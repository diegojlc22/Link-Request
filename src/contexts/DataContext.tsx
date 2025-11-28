import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Company, Unit, User, RequestTicket, Comment, UserRole, RequestStatus, Tenant } from '../types';
import { formatISO } from 'date-fns';
import { initFirebase, fbSet, fbUpdate, fbDelete, fbSubscribe, fbSubscribeRecent, fbUpdateMulti, isFirebaseInitialized, fbMonitorConnection, fbCreateUserSecondary, fbSignIn, getFirebaseAuth } from '../services/firebaseService';

interface SetupData {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

interface DataContextType {
  companies: Company[];
  units: Unit[];
  users: User[];
  requests: RequestTicket[];
  comments: Comment[];
  isSetupDone: boolean;
  setupSystem: (data: SetupData) => Promise<void>;
  enableDemoMode: () => void;
  isDbConnected: boolean; 
  isLoading: boolean;
  addRequest: (req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => Promise<void>;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  updateRequest: (id: string, data: Partial<RequestTicket>) => void;
  bulkUpdateRequestStatus: (ids: string[], status: RequestStatus) => void;
  deleteRequest: (id: string) => void;
  addComment: (ticketId: string, userId: string, content: string, isInternal?: boolean) => void;
  addUnit: (unit: Omit<Unit, 'id'>) => Promise<void>;
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUserPassword: (userId: string, newPassword: string) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => void;
  updateCompany: (id: string, data: Partial<Company>) => void;
  deleteUnit: (id: string) => void;
  deleteUser: (id: string) => void;
  getRequestsByUnit: (unitId: string) => RequestTicket[];
  getRequestsByCompany: (companyId: string) => RequestTicket[];
  getCommentsByRequest: (requestId: string) => Comment[];
  resetSystem: (currentAdminId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const sanitizeInput = (str: string): string => {
  if (!str) return '';
  return str.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim();
};

const sanitizeForFirebase = (data: any) => {
  if (!data || typeof data !== 'object') return data;
  const clean = { ...data };
  Object.keys(clean).forEach(key => {
    if (clean[key] === undefined) clean[key] = null;
  });
  return clean;
};

export const DataProvider: React.FC<{ children: React.ReactNode; currentTenant?: Tenant | null }> = ({ children, currentTenant }) => {
  const [isSetupDone, setIsSetupDone] = useState<boolean>(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<RequestTicket[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  const REQUESTS_LIMIT = 500; 
  const COMMENTS_LIMIT = 2000;

  useEffect(() => {
    let unsubCompanies: () => void = () => {};
    let unsubUnits: () => void = () => {};
    let unsubUsers: () => void = () => {};
    let unsubRequests: () => void = () => {};
    let unsubComments: () => void = () => {};
    let unsubConnection: () => void = () => {};
    let isMounted = true; 

    const startListeners = () => {
      const success = initFirebase(currentTenant?.firebaseConfig, currentTenant?.cloudinaryConfig);
      
      if (success) {
        unsubConnection = fbMonitorConnection((connected) => {
            if (isMounted) setIsDbConnected(connected);
        });

        unsubUsers = fbSubscribe<User>('users', (data) => { 
            if(isMounted && data) {
                setUsers(data);
                // SE NÃO TIVER USUÁRIOS NO BANCO, FORÇA TELA DE SETUP
                if (data.length === 0 && !isDemo) {
                    setIsSetupDone(false);
                } else {
                    setIsSetupDone(true);
                }
                setIsLoading(false);
            }
        });

        unsubCompanies = fbSubscribe<Company>('companies', (data) => isMounted && data && setCompanies(data));
        unsubUnits = fbSubscribe<Unit>('units', (data) => isMounted && data && setUnits(data));
        
        unsubRequests = fbSubscribeRecent<RequestTicket>('requests', REQUESTS_LIMIT, (data) => {
            if(isMounted && Array.isArray(data)) setRequests(data);
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

    if (!isDemo) {
        startListeners();
    }

    return () => {
      isMounted = false;
      if (unsubCompanies) unsubCompanies();
      if (unsubUnits) unsubUnits();
      if (unsubUsers) unsubUsers();
      if (unsubRequests) unsubRequests();
      if (unsubComments) unsubComments();
      if (unsubConnection) unsubConnection();
    };
  }, [isDemo, currentTenant]);

  useEffect(() => {
    if (companies.length > 0 && companies[0].name) {
      document.title = companies[0].name;
    }
  }, [companies]);

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
        const tA = new Date(a.updatedAt || a.createdAt).getTime();
        const tB = new Date(b.updatedAt || b.createdAt).getTime();
        return tB - tA;
    });
  }, [requests]);

  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [comments]);

  const checkDb = () => {
      if (isDemo) return;
      if (!isFirebaseInitialized() && !initFirebase(currentTenant?.firebaseConfig, currentTenant?.cloudinaryConfig)) {
          throw new Error("Banco de dados desconectado.");
      }
  };

  const setupSystem = useCallback(async (data: SetupData) => {
    try {
        checkDb();
        
        let uid = `admin_${Date.now()}`;
        
        // Tenta criar no Auth (ou reutilizar se já existir)
        try {
            const userCred = await fbCreateUserSecondary(data.adminEmail, data.adminPassword);
            uid = userCred.uid;
            // Força login imediato
            await fbSignIn(data.adminEmail, data.adminPassword);
        } catch (e: any) {
            console.warn("Usuário Auth já existe ou erro:", e);
            // Se já existe, tenta pegar o ID do usuário logado
            const auth = getFirebaseAuth();
            if (auth?.currentUser) {
                uid = auth.currentUser.uid;
            } else {
                // Tenta logar para pegar o ID
                try {
                    const res = await fbSignIn(data.adminEmail, data.adminPassword);
                    uid = res.user.uid;
                } catch(loginErr) {
                     // Se não consegue logar e não consegue criar, falha real
                     throw new Error("Não foi possível criar nem logar no usuário Admin.");
                }
            }
        }

        const newCompany: Company = { id: 'c1', name: sanitizeInput(data.companyName), domain: 'system.local', logoUrl: '' };
        const newUnit: Unit = { id: 'u1', companyId: 'c1', name: 'Matriz', location: 'Sede Principal' };
        
        const newAdmin: User = {
          id: uid, 
          companyId: 'c1', 
          name: sanitizeInput(data.adminName), 
          email: sanitizeInput(data.adminEmail),
          role: UserRole.ADMIN,
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.adminName)}`
        };

        // Recria a estrutura do banco
        await fbSet('companies', newCompany.id, sanitizeForFirebase(newCompany));
        await fbSet('units', newUnit.id, sanitizeForFirebase(newUnit));
        await fbSet('users', newAdmin.id, sanitizeForFirebase(newAdmin));
        
        setCompanies([newCompany]); setUnits([newUnit]); setUsers([newAdmin]); setIsSetupDone(true);
    } catch (e: any) {
        alert("Erro fatal na configuração: " + (e.message || e));
    }
  }, []);

  const enableDemoMode = useCallback(() => {
    setIsDemo(true);
    const demoCompany: Company = { id: 'c-demo', name: 'Empresa Demo', domain: 'demo.com', logoUrl: '' };
    const demoUnit: Unit = { id: 'u-demo', companyId: 'c-demo', name: 'Matriz Demo', location: 'Demo City, DC' };
    const demoAdmin: User = {
        id: 'admin-demo', companyId: 'c-demo', name: 'Admin Demo', email: 'admin@demo.com',
        role: UserRole.ADMIN,
        avatarUrl: `https://ui-avatars.com/api/?name=Admin+Demo`
    };
    setCompanies([demoCompany]); setUnits([demoUnit]); setUsers([demoAdmin]); setRequests([]); 
    setIsDbConnected(true); setIsSetupDone(true); setIsLoading(false);
  }, []);

  const addRequest = useCallback(async (req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => {
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
    if (!isDemo) {
        try { checkDb(); await fbSet('requests', newRequest.id, sanitizeForFirebase(newRequest)); } 
        catch (e: any) { setRequests(prev => prev.filter(r => r.id !== newRequest.id)); alert(`Erro ao salvar: ${e.message}`); }
    }
  }, [isDemo]);

  const updateRequestStatus = useCallback((id: string, status: RequestStatus) => {
    const updatedAt = formatISO(new Date());
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt } : r));
    if (isFirebaseInitialized() && !isDemo) fbUpdate('requests', id, { status, updatedAt });
  }, [isDemo]);

  const updateRequest = useCallback((id: string, data: Partial<RequestTicket>) => {
    const updatedAt = formatISO(new Date());
    const sanitized = { ...data, updatedAt };
    if (sanitized.title) sanitized.title = sanitizeInput(sanitized.title);
    if (sanitized.description) sanitized.description = sanitizeInput(sanitized.description);
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...sanitized } : r));
    if (isFirebaseInitialized() && !isDemo) fbUpdate('requests', id, sanitizeForFirebase(sanitized));
  }, [isDemo]);

  const bulkUpdateRequestStatus = useCallback((ids: string[], status: RequestStatus) => {
    const updatedAt = formatISO(new Date());
    setRequests(prev => prev.map(r => ids.includes(r.id) ? { ...r, status, updatedAt } : r));
    if (isFirebaseInitialized() && !isDemo) {
      const updates: Record<string, any> = {};
      ids.forEach(id => {
        updates[`requests/${id}/status`] = status;
        updates[`requests/${id}/updatedAt`] = updatedAt;
      });
      fbUpdateMulti(updates);
    }
  }, [isDemo]);

  const deleteRequest = useCallback((id: string) => {
    const backup = requests.find(r => r.id === id);
    setRequests(prev => prev.filter(r => r.id !== id));
    if (!isDemo) {
        try { checkDb(); fbDelete('requests', id); } 
        catch(e: any) { if(backup) setRequests(prev => [...prev, backup]); alert(`Erro ao excluir: ${e.message}`); }
    }
  }, [requests, isDemo]);

  const addComment = useCallback(async (ticketId: string, userId: string, content: string, isInternal: boolean = false) => {
    const newComment: Comment = {
      id: `cm${Date.now()}`,
      requestId: ticketId, userId, content: sanitizeInput(content), createdAt: formatISO(new Date()), isInternal
    };
    const updatedAt = formatISO(new Date());
    setComments(prev => [...prev, newComment]);
    setRequests(prev => prev.map(r => r.id === ticketId ? { ...r, updatedAt } : r));
    if (isFirebaseInitialized() && !isDemo) {
      try { await fbSet('comments', newComment.id, sanitizeForFirebase(newComment)); await fbUpdate('requests', ticketId, { updatedAt }); } 
      catch (e: any) { setComments(prev => prev.filter(c => c.id !== newComment.id)); alert(`Erro ao comentar: ${e.message}`); }
    }
  }, [isDemo]);

  const addUnit = useCallback(async (unit: Omit<Unit, 'id'>) => {
    const newUnit = { ...unit, name: sanitizeInput(unit.name), location: sanitizeInput(unit.location), id: `u${Date.now()}` };
    setUnits(prev => [...prev, newUnit]);
    if(!isDemo) {
        try { checkDb(); await fbSet('units', newUnit.id, sanitizeForFirebase(newUnit)); } 
        catch (e: any) { setUnits(prev => prev.filter(u => u.id !== newUnit.id)); alert(`Erro ao salvar unidade: ${e.message}`); }
    }
  }, [isDemo]);

  const addUser = useCallback(async (user: Omit<User, 'id'>) => {
    if (isDemo) {
        setUsers(prev => [...prev, { ...user, id: `user${Date.now()}` }]); return;
    }
    try {
        checkDb();
        if (!user.password) throw new Error("Senha é obrigatória para criar usuário.");
        const authUser = await fbCreateUserSecondary(user.email, user.password);
        const newUser: User = { 
            ...user, id: authUser.uid, name: sanitizeInput(user.name), email: sanitizeInput(user.email), password: undefined 
        };
        await fbSet('users', newUser.id, sanitizeForFirebase(newUser));
        setUsers(prev => [...prev, newUser]);
    } catch(e: any) {
        throw new Error(`Erro ao criar usuário: ${e.message}`);
    }
  }, [isDemo]);

  const updateUserPassword = useCallback(async (userId: string, pass: string) => {
      console.warn("Update password not available in client-sdk without old password. Use Reset Email.");
  }, [isDemo]);

  const updateUser = useCallback((userId: string, data: Partial<User>) => {
    const sanitized = { ...data };
    if (sanitized.name) sanitized.name = sanitizeInput(sanitized.name);
    delete sanitized.password;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...sanitized } : u));
    if (isFirebaseInitialized() && !isDemo) fbUpdate('users', userId, sanitizeForFirebase(sanitized));
  }, [isDemo]);

  const updateCompany = useCallback((id: string, data: Partial<Company>) => {
    const sanitized = { ...data };
    if (sanitized.name) sanitized.name = sanitizeInput(sanitized.name);
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...sanitized } : c));
    if (isFirebaseInitialized() && !isDemo) fbUpdate('companies', id, sanitizeForFirebase(sanitized));
  }, [isDemo]);

  const deleteUnit = useCallback((id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    if (isFirebaseInitialized() && !isDemo) fbDelete('units', id);
  }, [isDemo]);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (isFirebaseInitialized() && !isDemo) fbDelete('users', id);
  }, [isDemo]);

  const resetSystem = useCallback(async (currentAdminId: string) => {
    const adminUser = users.find(u => u.id === currentAdminId);
    if (!adminUser) throw new Error("Admin not found");
    const adminCompany = companies.find(c => c.id === adminUser.companyId);
    if (!adminCompany) throw new Error("Company not found");

    const newUnitId = `u${Date.now()}`;
    const defaultUnit: Unit = { id: newUnitId, companyId: adminCompany.id, name: 'Matriz', location: 'Sede Principal' };
    const updatedAdmin = { ...adminUser, unitId: newUnitId };
    const updates: Record<string, any> = {};
    updates['requests'] = null; updates['comments'] = null; 
    updates['units'] = { [newUnitId]: sanitizeForFirebase(defaultUnit) }; 
    updates['users'] = { [updatedAdmin.id]: sanitizeForFirebase(updatedAdmin) }; 
    updates['companies'] = { [adminCompany.id]: sanitizeForFirebase(adminCompany) }; 

    if (!isDemo && isFirebaseInitialized()) { checkDb(); await fbUpdateMulti(updates); }
    setRequests([]); setComments([]); setUnits([defaultUnit]); setUsers([updatedAdmin]); setCompanies([adminCompany]);
  }, [users, companies, isDemo]);

  const getRequestsByUnit = useCallback((unitId: string) => sortedRequests.filter(r => r.unitId === unitId), [sortedRequests]);
  const getRequestsByCompany = useCallback((companyId: string) => sortedRequests.filter(r => r.companyId === companyId), [sortedRequests]);
  const getCommentsByRequest = useCallback((requestId: string) => sortedComments.filter(c => c.requestId === requestId), [sortedComments]);

  const value = useMemo(() => ({
    companies, units, users, requests: sortedRequests, comments: sortedComments,
    isDbConnected, isLoading, isSetupDone,
    addRequest, updateRequestStatus, updateRequest, bulkUpdateRequestStatus, deleteRequest, addComment,
    addUnit, addUser, updateUserPassword, updateUser, updateCompany, deleteUnit, deleteUser,
    getRequestsByUnit, getRequestsByCompany, getCommentsByRequest, setupSystem, enableDemoMode,
    resetSystem
  }), [
    companies, units, users, sortedRequests, sortedComments,
    isDbConnected, isLoading, isSetupDone,
    addRequest, updateRequestStatus, updateRequest, bulkUpdateRequestStatus, deleteRequest, addComment,
    addUnit, addUser, updateUserPassword, updateUser, updateCompany, deleteUnit, deleteUser,
    getRequestsByUnit, getRequestsByCompany, getCommentsByRequest, setupSystem, enableDemoMode,
    resetSystem
  ]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};