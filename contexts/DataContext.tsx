
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Company, Unit, User, RequestTicket, Comment, UserRole, RequestStatus, FirebaseConfig } from '../types';
import { formatISO } from 'date-fns';
import { initFirebase, fbSet, fbUpdate, fbDelete, fbSubscribe } from '../services/firebaseService';

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
  
  // System Settings
  isSetupDone: boolean;
  setupSystem: (data: SetupData) => void;

  // Firebase
  firebaseConfig: FirebaseConfig | null;
  isDbConnected: boolean;
  saveFirebaseConfig: (config: FirebaseConfig | null) => void;
  isLoading: boolean;

  // Actions
  addRequest: (req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => void;
  updateRequestStatus: (id: string, status: RequestStatus) => void;
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

// Default Admin Credentials: admin@admin / admin
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

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // System State - Defaults to true so admin@admin works immediately
  const [isSetupDone, setIsSetupDone] = useState<boolean>(() => loadState('link_req_is_setup_done', true));

  // Local Data State
  const [companies, setCompanies] = useState<Company[]>(() => loadState('link_req_companies', MOCK_COMPANIES));
  const [units, setUnits] = useState<Unit[]>(() => loadState('link_req_units', MOCK_UNITS));
  const [users, setUsers] = useState<User[]>(() => loadState('link_req_users', MOCK_USERS));
  const [requests, setRequests] = useState<RequestTicket[]>(() => loadState('link_req_requests', MOCK_REQUESTS));
  const [comments, setComments] = useState<Comment[]>(() => loadState('link_req_comments', MOCK_COMMENTS));
  
  // Firebase State
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(() => loadState('link_req_firebase_config', null));
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Firebase and Setup Real-time Listeners
  useEffect(() => {
    let unsubCompanies: () => void;
    let unsubUnits: () => void;
    let unsubUsers: () => void;
    let unsubRequests: () => void;
    let unsubComments: () => void;

    const initDb = async () => {
      if (firebaseConfig) {
        setIsLoading(true);
        const success = initFirebase(firebaseConfig);
        
        if (success) {
          setIsDbConnected(true);
          console.log("Firebase Connected Successfully. Listening for updates...");

          // Subscribe to Real-time Updates (Observer Pattern)
          // O Firebase agora é a fonte da verdade. O que vier de lá, sobrescreve o local.
          
          unsubCompanies = fbSubscribe<Company>('companies', (data) => {
            setCompanies(data);
          });

          unsubUnits = fbSubscribe<Unit>('units', (data) => {
             setUnits(data);
          });

          unsubUsers = fbSubscribe<User>('users', (data) => {
             setUsers(data);
             // Se conectou ao Firebase com sucesso, mas a lista de usuários está vazia,
             // significa que é um banco novo/zerado. Redireciona para o Setup.
             if (data.length === 0) {
                console.log("Banco Firebase vazio detectado. Redirecionando para Setup.");
                setIsSetupDone(false);
             }
          });

          unsubRequests = fbSubscribe<RequestTicket>('requests', (data) => {
             setRequests(data);
          });

          unsubComments = fbSubscribe<Comment>('comments', (data) => {
             setComments(data);
          });

        } else {
          console.error("Failed to initialize Firebase connection.");
          setIsDbConnected(false);
        }
        setIsLoading(false);
      } else {
        setIsDbConnected(false);
      }
    };

    initDb();

    // Cleanup subscriptions on unmount or config change
    return () => {
      if (unsubCompanies) unsubCompanies();
      if (unsubUnits) unsubUnits();
      if (unsubUsers) unsubUsers();
      if (unsubRequests) unsubRequests();
      if (unsubComments) unsubComments();
    };
  }, [firebaseConfig]);

  // Update Document Title based on Company Name
  useEffect(() => {
    if (companies.length > 0 && companies[0].name) {
      document.title = companies[0].name;
    }
  }, [companies]);

  // Persist to LocalStorage (Backup / Offline Mode)
  useEffect(() => { localStorage.setItem('link_req_companies', JSON.stringify(companies)); }, [companies]);
  useEffect(() => { localStorage.setItem('link_req_units', JSON.stringify(units)); }, [units]);
  useEffect(() => { localStorage.setItem('link_req_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('link_req_requests', JSON.stringify(requests)); }, [requests]);
  useEffect(() => { localStorage.setItem('link_req_comments', JSON.stringify(comments)); }, [comments]);
  useEffect(() => { localStorage.setItem('link_req_is_setup_done', JSON.stringify(isSetupDone)); }, [isSetupDone]);
  
  useEffect(() => { 
    if (firebaseConfig) localStorage.setItem('link_req_firebase_config', JSON.stringify(firebaseConfig)); 
    else localStorage.removeItem('link_req_firebase_config');
  }, [firebaseConfig]);

  // --- SYSTEM ACTIONS ---

  const setupSystem = (data: SetupData) => {
    const newCompany: Company = {
      id: 'c1',
      name: data.companyName,
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
      name: data.adminName,
      email: data.adminEmail,
      password: data.adminPassword,
      role: UserRole.ADMIN,
      avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.adminName)}&background=random`
    };

    // Se estiver conectado ao Firebase, salva lá PRIMEIRO.
    // Os listeners acima (useEffect) vão detectar a mudança e atualizar o estado local automaticamente.
    if (isDbConnected) {
      fbSet('companies', newCompany.id, newCompany);
      fbSet('units', newUnit.id, newUnit);
      fbSet('users', newAdmin.id, newAdmin);
      setIsSetupDone(true); // Libera a tela
    } else {
      // Modo Offline
      setCompanies([newCompany]);
      setUnits([newUnit]);
      setUsers([newAdmin]);
      setRequests([]);
      setComments([]);
      setIsSetupDone(true);
    }
  };

  const saveFirebaseConfig = (config: FirebaseConfig | null) => {
    setFirebaseConfig(config);
    if (!config) {
       window.location.reload(); 
    }
  };

  // --- WRAPPED ACTIONS (Sync with Firebase if connected) ---

  const addRequest = (req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => {
    const newRequest: RequestTicket = {
      ...req,
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
  };

  const updateRequestStatus = (id: string, status: RequestStatus) => {
    const updatedDate = formatISO(new Date());
    if (isDbConnected) {
      fbUpdate('requests', id, { status, updatedAt: updatedDate });
    } else {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt: updatedDate } : r));
    }
  };

  const addComment = (ticketId: string, userId: string, content: string) => {
    const newComment: Comment = {
      id: `cm${Date.now()}`,
      requestId: ticketId,
      userId,
      content,
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
  };

  const addUnit = (unit: Omit<Unit, 'id'>) => {
    const newUnit = { ...unit, id: `u${Date.now()}` };
    if (isDbConnected) {
      fbSet('units', newUnit.id, newUnit);
    } else {
      setUnits(prev => [...prev, newUnit]);
    }
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: `user${Date.now()}` };
    if (isDbConnected) {
      fbSet('users', newUser.id, newUser);
    } else {
      setUsers(prev => [...prev, newUser]);
    }
  };

  const updateUserPassword = (userId: string, newPassword: string) => {
    if (isDbConnected) {
      fbUpdate('users', userId, { password: newPassword });
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    }
  };

  const updateCompany = (id: string, data: Partial<Company>) => {
    if (isDbConnected) {
      fbUpdate('companies', id, data);
    } else {
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    }
  };

  const deleteUnit = (id: string) => {
    if (isDbConnected) {
      fbDelete('units', id);
    } else {
      setUnits(prev => prev.filter(u => u.id !== id));
    }
  };

  const deleteUser = (id: string) => {
    if (isDbConnected) {
      fbDelete('users', id);
    } else {
      setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  // Memoize getters to avoid recreation
  const getRequestsByUnit = (unitId: string) => requests.filter(r => r.unitId === unitId);
  const getRequestsByCompany = (companyId: string) => requests.filter(r => r.companyId === companyId);
  const getCommentsByRequest = (requestId: string) => comments.filter(c => c.requestId === requestId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // CRITICAL PERFORMANCE FIX: Memoize the context value
  const value = useMemo(() => ({
    companies, units, users, requests, comments,
    firebaseConfig, isDbConnected, saveFirebaseConfig, isLoading,
    addRequest, updateRequestStatus, addComment,
    addUnit, addUser, updateUserPassword, updateCompany, deleteUnit, deleteUser,
    getRequestsByUnit, getRequestsByCompany, getCommentsByRequest,
    isSetupDone, setupSystem
  }), [companies, units, users, requests, comments, firebaseConfig, isDbConnected, isLoading, isSetupDone]);

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
