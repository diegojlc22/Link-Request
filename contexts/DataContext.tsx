
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Company, Unit, User, RequestTicket, Comment, UserRole, RequestStatus, FirebaseConfig } from '../types';
import { formatISO } from 'date-fns';
import { initFirebase, fbGetAll, fbSet, fbUpdate, fbDelete } from '../services/firebaseService';
import { io, Socket } from 'socket.io-client';

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

  // Firebase / Server
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
    return fallback;
  }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // System State
  const [isSetupDone, setIsSetupDone] = useState<boolean>(() => loadState('link_req_is_setup_done', true));

  // Local Data State
  const [companies, setCompanies] = useState<Company[]>(() => loadState('link_req_companies', MOCK_COMPANIES));
  const [units, setUnits] = useState<Unit[]>(() => loadState('link_req_units', MOCK_UNITS));
  const [users, setUsers] = useState<User[]>(() => loadState('link_req_users', MOCK_USERS));
  const [requests, setRequests] = useState<RequestTicket[]>(() => loadState('link_req_requests', MOCK_REQUESTS));
  const [comments, setComments] = useState<Comment[]>(() => loadState('link_req_comments', MOCK_COMMENTS));
  
  // Firebase / Server State
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(() => loadState('link_req_firebase_config', null));
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);

  // --- SERVER & FIREBASE INIT ---
  useEffect(() => {
    const initDb = async () => {
      // MODO SERVER SOCKET.IO
      if (firebaseConfig?.databaseURL && firebaseConfig.databaseURL.startsWith('http')) {
         setIsLoading(true);
         
         // Clean previous socket if any
         if (socket) {
             socket.disconnect();
         }

         const newSocket = io(firebaseConfig.databaseURL);
         setSocket(newSocket);

         newSocket.on('connect', () => {
             setIsDbConnected(true);
             setIsLoading(false);
         });

         newSocket.on('connect_error', () => {
             setIsDbConnected(false);
             setIsLoading(false);
         });

         // Real-time Listeners
         newSocket.on('initial_data', (data: RequestTicket[]) => {
             if (data && Array.isArray(data)) {
                 // Merge com dados locais ou substituir? Para simplicidade, substitui se server for autoridade
                 // Aqui estamos fazendo um merge simples: se o ID não existe, adiciona.
                 setRequests(prev => {
                     const existingIds = new Set(prev.map(r => r.id));
                     const newItems = data.filter(r => !existingIds.has(r.id));
                     return [...newItems, ...prev].sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                 });
             }
         });

         newSocket.on('request_added', (ticket: RequestTicket) => {
             setRequests(prev => [ticket, ...prev]);
         });

         newSocket.on('status_updated', ({ id, status, updatedAt }: any) => {
             setRequests(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt } : r));
         });
         
         return;
      }

      // MODO FIREBASE
      if (firebaseConfig && firebaseConfig.apiKey) {
        setIsLoading(true);
        const success = initFirebase(firebaseConfig);
        if (success) {
          setIsDbConnected(true);
          try {
             const [fbCompanies, fbUnits, fbUsers, fbRequests, fbComments] = await Promise.all([
                 fbGetAll<Company>('companies'),
                 fbGetAll<Unit>('units'),
                 fbGetAll<User>('users'),
                 fbGetAll<RequestTicket>('requests'),
                 fbGetAll<Comment>('comments')
             ]);

             if (fbCompanies.length) setCompanies(fbCompanies);
             if (fbUnits.length) setUnits(fbUnits);
             if (fbUsers.length) setUsers(fbUsers);
             if (fbRequests.length) setRequests(fbRequests);
             if (fbComments.length) setComments(fbComments);
          } catch (e) {
            // Silent fail on fetch
          }
        } else {
          setIsDbConnected(false);
        }
        setIsLoading(false);
      } else {
        setIsDbConnected(false);
      }
    };

    initDb();

    return () => {
        if (socket) socket.disconnect();
    };
  }, [firebaseConfig]);

  // Persist to LocalStorage
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

  // --- ACTIONS ---

  const setupSystem = (data: SetupData) => {
    const newCompany: Company = { id: 'c1', name: data.companyName, domain: 'system.local', logoUrl: '' };
    const newUnit: Unit = { id: 'u1', companyId: 'c1', name: 'Matriz', location: 'Sede Principal' };
    const newAdmin: User = {
      id: 'admin1', companyId: 'c1', name: data.adminName, email: data.adminEmail, password: data.adminPassword,
      role: UserRole.ADMIN, avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(data.adminName)}`
    };

    setCompanies([newCompany]);
    setUnits([newUnit]);
    setUsers([newAdmin]);
    setRequests([]);
    setComments([]);
    setIsSetupDone(true);
  };

  const saveFirebaseConfig = (config: FirebaseConfig | null) => {
    setFirebaseConfig(config);
    if (!config) window.location.reload(); 
  };

  const addRequest = (req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => {
    const newRequest: RequestTicket = {
      ...req,
      id: `r${Date.now()}`,
      createdAt: formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      attachments: req.attachments || [],
      viewedByAssignee: false,
    };
    
    // Local Update
    setRequests(prev => [newRequest, ...prev]);
    
    // Remote Update
    if (socket && socket.connected) {
        socket.emit('new_request', newRequest);
    } else if (isDbConnected && firebaseConfig?.apiKey) {
        fbSet('requests', newRequest.id, newRequest);
    }
  };

  const updateRequestStatus = (id: string, status: RequestStatus) => {
    const updatedAt = formatISO(new Date());
    
    // Local Update
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt } : r));
    
    // Remote Update
    if (socket && socket.connected) {
        socket.emit('update_status', { id, status, updatedAt });
    } else if (isDbConnected && firebaseConfig?.apiKey) {
        fbUpdate('requests', id, { status, updatedAt });
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
    setComments(prev => [...prev, newComment]);
    
    const updatedAt = formatISO(new Date());
    setRequests(prev => prev.map(r => r.id === ticketId ? { ...r, updatedAt } : r));
    
    if (isDbConnected && firebaseConfig?.apiKey) {
      fbSet('comments', newComment.id, newComment);
      fbUpdate('requests', ticketId, { updatedAt });
    }
  };

  const addUnit = (unit: Omit<Unit, 'id'>) => {
    const newUnit = { ...unit, id: `u${Date.now()}` };
    setUnits(prev => [...prev, newUnit]);
    if (isDbConnected && firebaseConfig?.apiKey) fbSet('units', newUnit.id, newUnit);
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: `user${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
    if (isDbConnected && firebaseConfig?.apiKey) fbSet('users', newUser.id, newUser);
  };

  const updateUserPassword = (userId: string, newPassword: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    if (isDbConnected && firebaseConfig?.apiKey) fbUpdate('users', userId, { password: newPassword });
  };

  const updateCompany = (id: string, data: Partial<Company>) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    if (isDbConnected && firebaseConfig?.apiKey) fbUpdate('companies', id, data);
  };

  const deleteUnit = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    if (isDbConnected && firebaseConfig?.apiKey) fbDelete('units', id);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (isDbConnected && firebaseConfig?.apiKey) fbDelete('users', id);
  };

  const getRequestsByUnit = (unitId: string) => requests.filter(r => r.unitId === unitId);
  const getRequestsByCompany = (companyId: string) => requests.filter(r => r.companyId === companyId);
  const getCommentsByRequest = (requestId: string) => comments.filter(c => c.requestId === requestId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // OTIMIZAÇÃO: Memoize context value
  const value = useMemo(() => ({
      companies, units, users, requests, comments,
      firebaseConfig, isDbConnected, saveFirebaseConfig, isLoading,
      addRequest, updateRequestStatus, addComment,
      addUnit, addUser, updateUserPassword, updateCompany, deleteUnit, deleteUser,
      getRequestsByUnit, getRequestsByCompany, getCommentsByRequest,
      isSetupDone, setupSystem
  }), [
      companies, units, users, requests, comments, 
      firebaseConfig, isDbConnected, isLoading, isSetupDone
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
