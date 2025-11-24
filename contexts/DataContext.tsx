
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Company, Unit, User, RequestTicket, Comment, UserRole, RequestStatus, FirebaseConfig } from '../types';
import { formatISO } from 'date-fns';
import { initFirebase, fbSet, fbUpdate, fbDelete, fbSubscribe, fbUpdateMulti, fbGetAll } from '../services/firebaseService';

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
  
  // System Settings
  isSetupDone: boolean;
  setupSystem: (data: SetupData) => void;

  // Firebase
  isDbConnected: boolean;
  isLoading: boolean;

  // Actions
  addRequest: (req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
  updateRequest: (id: string, data: Partial<RequestTicket>) => void; // Nova função
  bulkUpdateRequestStatus: (ids: string[], status: RequestStatus) => void;
  addComment: (ticketId: string, userId: string, content: string) => void;
  addUnit: (unit: Omit<Unit, 'id'>) => void;
  addUser: (user: Omit<User, 'id'>) => void;
  updateUserPassword: (userId: string, newPassword: string) => void;
  updateCompany: (id: string, data: Partial<Company>) => void;
  deleteUnit: (id: string) => void;
  deleteUser: (id: string) => void;
  getRequestsByUnit: (unitId: string) => RequestTicket[];
  getRequestsByCompany: (companyId: string) => RequestTicket[];
  getCommentsByRequest: (requestId: string) => Comment[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- MOCK DATA (INITIAL STATE) ---
const MOCK_COMPANIES: Company[] = [
  { id: 'c1', name: 'Link-Request', domain: 'techcorp.saas.com', logoUrl: '' },
];

const MOCK_UNITS: Unit[] = [
  { id: 'u1', companyId: 'c1', name: 'Matriz - São Paulo', location: 'Av. Paulista, 1000' },
];

const MOCK_USERS: User[] = [
  { id: 'user1', companyId: 'c1', name: 'Admin', email: 'admin@admin', password: 'admin', role: UserRole.ADMIN, avatarUrl: 'https://ui-avatars.com/api/?name=Admin' },
];

const MOCK_REQUESTS: RequestTicket[] = [];
const MOCK_COMMENTS: Comment[] = [];

// Helper to load from localStorage
const loadState = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error loading ${key} from localStorage`, e);
    return fallback;
  }
};

// --- SECURITY UTILS ---
// Remove tags HTML e scripts maliciosos básicos para prevenir XSS
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
  // System State
  // FIX: Alterado fallback para false para forçar Setup na primeira execução
  const [isSetupDone, setIsSetupDone] = useState<boolean>(() => loadState('link_req_is_setup_done', false));

  // Local Data State
  const [companies, setCompanies] = useState<Company[]>(() => loadState('link_req_companies', MOCK_COMPANIES));
  const [units, setUnits] = useState<Unit[]>(() => loadState('link_req_units', MOCK_UNITS));
  const [users, setUsers] = useState<User[]>(() => loadState('link_req_users', MOCK_USERS));
  const [requests, setRequests] = useState<RequestTicket[]>(() => loadState('link_req_requests', MOCK_REQUESTS));
  const [comments, setComments] = useState<Comment[]>(() => loadState('link_req_comments', MOCK_COMMENTS));
  
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
      // 1. Tenta carregar config salva no LocalStorage (User Setup)
      const storedConfig = loadState<FirebaseConfig | null>('link_req_firebase_config', null);
      
      // 2. Inicializa (Prioriza config manual se existir, senão usa .env)
      const success = initFirebase(storedConfig || undefined);
      
      if (success) {
        setIsDbConnected(true);
        console.log("System initialized in Online Mode.");

        try {
          // 3. Initial Fetch (Parallel) - Optimized Loading
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

          // Set Initial State
          if (initialCompanies.length > 0) setCompanies(initialCompanies);
          if (initialUnits.length > 0) setUnits(initialUnits);
          if (initialUsers.length > 0) setUsers(initialUsers);
          setRequests(initialRequests);
          setComments(initialComments);

        } catch (err) {
          console.error("Error fetching initial data:", err);
        } finally {
          setIsLoading(false); // Stop loading spinner after initial fetch
        }

        // 4. Subscribe to Real-time Updates (Keep data in sync)
        unsubCompanies = fbSubscribe<Company>('companies', (data) => {
          if (Array.isArray(data) && data.length > 0) setCompanies(data);
        });

        unsubUnits = fbSubscribe<Unit>('units', (data) => {
           if (Array.isArray(data) && data.length > 0) setUnits(data);
        });

        unsubUsers = fbSubscribe<User>('users', (data) => {
           if (Array.isArray(data) && data.length > 0) setUsers(data);
        });

        unsubRequests = fbSubscribe<RequestTicket>('requests', (data) => {
           if (Array.isArray(data)) setRequests(data);
        });

        unsubComments = fbSubscribe<Comment>('comments', (data) => {
           if (Array.isArray(data)) setComments(data);
        });

      } else {
        console.log("System initialized in Offline Mode.");
        setIsDbConnected(false);
        setIsLoading(false);
      }
    };

    initDb();

    return () => {
      if (isDbConnected) {
        unsubCompanies();
        unsubUnits();
        unsubUsers();
        unsubRequests();
        unsubComments();
      }
    };
  }, []);

  // Update Document Title
  useEffect(() => {
    if (companies.length > 0 && companies[0].name) {
      document.title = companies[0].name;
    }
  }, [companies]);

  // Persist to LocalStorage (Backup)
  useEffect(() => { localStorage.setItem('link_req_companies', JSON.stringify(companies)); }, [companies]);
  useEffect(() => { localStorage.setItem('link_req_units', JSON.stringify(units)); }, [units]);
  useEffect(() => { localStorage.setItem('link_req_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('link_req_requests', JSON.stringify(requests)); }, [requests]);
  useEffect(() => { localStorage.setItem('link_req_comments', JSON.stringify(comments)); }, [comments]);
  useEffect(() => { localStorage.setItem('link_req_is_setup_done', JSON.stringify(isSetupDone)); }, [isSetupDone]);
  
  // --- OPTIMIZATION: MEMOIZED LISTS ---
  // Sort requests by update time (newest first) once, so consumers don't have to sort on every render
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
        // Safe sort handling missing dates or NaNs
        const getTime = (dateStr?: string) => {
             if(!dateStr) return 0;
             const t = new Date(dateStr).getTime();
             return isNaN(t) ? 0 : t;
        };
        
        // Use createdAt as fallback if updatedAt is missing/invalid
        const timeA = getTime(a.updatedAt) || getTime(a.createdAt);
        const timeB = getTime(b.updatedAt) || getTime(b.createdAt);
        
        return timeB - timeA;
    });
  }, [requests]);

  // Sort comments by creation time (oldest first)
  const sortedComments = useMemo(() => {
    return [...comments].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [comments]);

  // --- SYSTEM ACTIONS (Memoized) ---

  const setupSystem = useCallback((data: SetupData) => {
    const newCompany: Company = {
      id: 'c1',
      name: sanitizeInput(data.companyName),
      domain: 'system.local',
      logoUrl: ''
    };
    
    const newUnit: Unit = {
      id: 'u1',
      companyId: 'c1',
      name: 'Matriz',
      location: 'Sede Principal'
    };

    const newAdmin: User = {
      id: 'admin1',
      companyId: 'c1',
      name: sanitizeInput(data.adminName),
      email: sanitizeInput(data.adminEmail),
      password: data.adminPassword, // Password not sanitized to allow special chars, handled by Auth
      role: UserRole.ADMIN,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(sanitizeInput(data.adminName))}&background=random`
    };

    // Salva configuração do Firebase se fornecida
    if (data.firebaseConfig) {
      localStorage.setItem('link_req_firebase_config', JSON.stringify(data.firebaseConfig));
      // Tenta reconectar imediatamente
      setTimeout(() => window.location.reload(), 100);
    }

    setCompanies([newCompany]);
    setUnits([newUnit]);
    setUsers([newAdmin]);
    setIsSetupDone(true);
  }, []);

  // --- CRUD ACTIONS (Memoized) ---

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
    
    if (isDbConnected) {
      fbSet('requests', newRequest.id, newRequest);
    } else {
      setRequests(prev => [newRequest, ...prev]);
    }
  }, [isDbConnected]);

  const updateRequestStatus = useCallback((id: string, status: RequestStatus) => {
    const updatedDate = formatISO(new Date());
    if (isDbConnected) {
      fbUpdate('requests', id, { status, updatedAt: updatedDate });
    } else {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt: updatedDate } : r));
    }
  }, [isDbConnected]);

  const updateRequest = useCallback((id: string, data: Partial<RequestTicket>) => {
    const updatedDate = formatISO(new Date());
    const sanitizedData = { ...data };
    
    // Sanitize text fields if present
    if (sanitizedData.title) sanitizedData.title = sanitizeInput(sanitizedData.title);
    if (sanitizedData.description) sanitizedData.description = sanitizeInput(sanitizedData.description);
    if (sanitizedData.productUrl) sanitizedData.productUrl = sanitizeInput(sanitizedData.productUrl);
    
    const finalUpdate = { ...sanitizedData, updatedAt: updatedDate };

    if (isDbConnected) {
      fbUpdate('requests', id, finalUpdate);
    } else {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, ...finalUpdate } : r));
    }
  }, [isDbConnected]);

  const bulkUpdateRequestStatus = useCallback((ids: string[], status: RequestStatus) => {
    const updatedDate = formatISO(new Date());
    
    if (isDbConnected) {
      const updates: Record<string, any> = {};
      ids.forEach(id => {
        updates[`requests/${id}/status`] = status;
        updates[`requests/${id}/updatedAt`] = updatedDate;
      });
      fbUpdateMulti(updates);
    } else {
      setRequests(prev => prev.map(r => 
        ids.includes(r.id) ? { ...r, status, updatedAt: updatedDate } : r
      ));
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

    if (isDbConnected) {
      fbSet('comments', newComment.id, newComment);
      fbUpdate('requests', ticketId, { updatedAt: updatedDate });
    } else {
      setComments(prev => [...prev, newComment]);
      setRequests(prev => prev.map(r => r.id === ticketId ? { ...r, updatedAt: updatedDate } : r));
    }
  }, [isDbConnected]);

  const addUnit = useCallback((unit: Omit<Unit, 'id'>) => {
    const newUnit = { 
      ...unit, 
      name: sanitizeInput(unit.name),
      location: sanitizeInput(unit.location),
      id: `u${Date.now()}` 
    };
    if (isDbConnected) {
      fbSet('units', newUnit.id, newUnit);
    } else {
      setUnits(prev => [...prev, newUnit]);
    }
  }, [isDbConnected]);

  const addUser = useCallback((user: Omit<User, 'id'>) => {
    const newUser = { 
      ...user, 
      name: sanitizeInput(user.name),
      email: sanitizeInput(user.email),
      id: `user${Date.now()}` 
    };
    if (isDbConnected) {
      fbSet('users', newUser.id, newUser);
    } else {
      setUsers(prev => [...prev, newUser]);
    }
  }, [isDbConnected]);

  const updateUserPassword = useCallback((userId: string, newPassword: string) => {
    if (isDbConnected) {
      fbUpdate('users', userId, { password: newPassword });
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    }
  }, [isDbConnected]);

  const updateCompany = useCallback((id: string, data: Partial<Company>) => {
    const sanitizedData = { ...data };
    if (sanitizedData.name) sanitizedData.name = sanitizeInput(sanitizedData.name);
    
    if (isDbConnected) {
      fbUpdate('companies', id, sanitizedData);
    } else {
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...sanitizedData } : c));
    }
  }, [isDbConnected]);

  const deleteUnit = useCallback((id: string) => {
    if (isDbConnected) {
      fbDelete('units', id);
    } else {
      setUnits(prev => prev.filter(u => u.id !== id));
    }
  }, [isDbConnected]);

  const deleteUser = useCallback((id: string) => {
    if (isDbConnected) {
      fbDelete('users', id);
    } else {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  }, [isDbConnected]);

  // --- GETTERS (Memoized) ---
  
  const getRequestsByUnit = useCallback((unitId: string) => {
    return sortedRequests.filter(r => r.unitId === unitId);
  }, [sortedRequests]);

  const getRequestsByCompany = useCallback((companyId: string) => {
    return sortedRequests.filter(r => r.companyId === companyId);
  }, [sortedRequests]);
  
  const getCommentsByRequest = useCallback((requestId: string) => {
    // Uses already sorted list
    return sortedComments.filter(c => c.requestId === requestId);
  }, [sortedComments]);

  // Construct Value with stable references
  const value = useMemo(() => ({
    companies, 
    units, 
    users, 
    requests: sortedRequests, // Expose sorted requests by default
    comments: sortedComments, // Expose sorted comments by default
    
    isDbConnected, 
    isLoading,
    
    addRequest, 
    updateRequestStatus,
    updateRequest, // Exported new function
    bulkUpdateRequestStatus, 
    addComment,
    addUnit, 
    addUser, 
    updateUserPassword, 
    updateCompany, 
    deleteUnit, 
    deleteUser,
    
    getRequestsByUnit, 
    getRequestsByCompany, 
    getCommentsByRequest,
    
    isSetupDone, 
    setupSystem
  }), [
    companies, units, users, sortedRequests, sortedComments,
    isDbConnected, isLoading, isSetupDone,
    addRequest, updateRequestStatus, updateRequest, bulkUpdateRequestStatus, addComment,
    addUnit, addUser, updateUserPassword, updateCompany, deleteUnit, deleteUser,
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
