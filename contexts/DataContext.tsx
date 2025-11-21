
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Company, Unit, User, RequestTicket, Comment, UserRole, RequestStatus, FirebaseConfig, ServerConfig } from '../types';
import { formatISO } from 'date-fns';
import { initFirebase, fbGetAll, fbSet, fbUpdate, fbDelete } from '../services/firebaseService';
import { io, Socket } from 'socket.io-client';

interface SetupData {
  companyName: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

type StorageProvider = 'LOCAL' | 'FIREBASE' | 'SQLITE_SERVER';

interface DataContextType {
  companies: Company[];
  units: Unit[];
  users: User[];
  requests: RequestTicket[];
  comments: Comment[];
  
  // System Settings
  isSetupDone: boolean;
  setupSystem: (data: SetupData) => void;

  // Database Config
  storageProvider: StorageProvider;
  setStorageProvider: (provider: StorageProvider) => void;
  
  // Firebase
  firebaseConfig: FirebaseConfig | null;
  saveFirebaseConfig: (config: FirebaseConfig | null) => void;
  
  // SQLite Server
  serverConfig: ServerConfig | null;
  saveServerConfig: (config: ServerConfig | null) => void;

  isDbConnected: boolean;
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
  // System State
  const [isSetupDone, setIsSetupDone] = useState<boolean>(() => loadState('link_req_is_setup_done', true));
  const [storageProvider, setStorageProvider] = useState<StorageProvider>(() => loadState('link_req_provider', 'LOCAL'));

  // Local Data State
  const [companies, setCompanies] = useState<Company[]>(() => loadState('link_req_companies', MOCK_COMPANIES));
  const [units, setUnits] = useState<Unit[]>(() => loadState('link_req_units', MOCK_UNITS));
  const [users, setUsers] = useState<User[]>(() => loadState('link_req_users', MOCK_USERS));
  const [requests, setRequests] = useState<RequestTicket[]>(() => loadState('link_req_requests', MOCK_REQUESTS));
  const [comments, setComments] = useState<Comment[]>(() => loadState('link_req_comments', MOCK_COMMENTS));
  
  // DB Configs
  const [firebaseConfig, setFirebaseConfigState] = useState<FirebaseConfig | null>(() => loadState('link_req_firebase_config', null));
  const [serverConfig, setServerConfigState] = useState<ServerConfig | null>(() => loadState('link_req_server_config', null));
  
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Socket Ref
  const socketRef = useRef<Socket | null>(null);

  // --- CONNECTION LOGIC ---

  useEffect(() => {
    const connectDb = async () => {
      setIsDbConnected(false);
      
      // Cleanup previous socket if exists
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      if (storageProvider === 'LOCAL') {
        return; // Ready immediately
      }

      setIsLoading(true);

      if (storageProvider === 'FIREBASE' && firebaseConfig) {
        const success = initFirebase(firebaseConfig);
        if (success) {
          setIsDbConnected(true);
          try {
             const fbCompanies = await fbGetAll<Company>('companies');
             if (fbCompanies.length > 0) setCompanies(fbCompanies);
             
             const fbUnits = await fbGetAll<Unit>('units');
             if (fbUnits.length > 0) setUnits(fbUnits);
             
             const fbUsers = await fbGetAll<User>('users');
             if (fbUsers.length > 0) setUsers(fbUsers);
             
             const fbRequests = await fbGetAll<RequestTicket>('requests');
             if (fbRequests.length > 0) setRequests(fbRequests);
             
             const fbComments = await fbGetAll<Comment>('comments');
             if (fbComments.length > 0) setComments(fbComments);
          } catch (e) {
            console.error("Failed to sync with Firebase", e);
          }
        }
        setIsLoading(false);
      } 
      else if (storageProvider === 'SQLITE_SERVER' && serverConfig) {
        try {
          console.log(`Connecting to SQLite Server at ${serverConfig.serverUrl}...`);
          
          const socket = io(serverConfig.serverUrl);
          socketRef.current = socket;

          socket.on('connect', () => {
            console.log("Connected to SQLite Server via Socket.io");
            setIsDbConnected(true);
            setIsLoading(false);
            // Request initial load
            socket.emit('request_initial_data');
          });

          socket.on('connect_error', (err) => {
            console.error("Socket Connection Error:", err);
            setIsLoading(false);
          });

          // Listeners for Real-time Sync
          socket.on('initial_data', (data: any) => {
            if (data.companies) setCompanies(data.companies);
            if (data.units) setUnits(data.units);
            if (data.users) setUsers(data.users);
            if (data.requests) setRequests(data.requests);
            if (data.comments) setComments(data.comments);
          });

          const handleCreate = (collection: string, item: any) => {
             if (collection === 'companies') setCompanies(prev => prev.find(i => i.id === item.id) ? prev : [...prev, item]);
             if (collection === 'units') setUnits(prev => prev.find(i => i.id === item.id) ? prev : [...prev, item]);
             if (collection === 'users') setUsers(prev => prev.find(i => i.id === item.id) ? prev : [...prev, item]);
             if (collection === 'requests') setRequests(prev => prev.find(i => i.id === item.id) ? prev : [item, ...prev]);
             if (collection === 'comments') setComments(prev => prev.find(i => i.id === item.id) ? prev : [...prev, item]);
          };

          const handleUpdate = (collection: string, id: string, item: any) => {
             if (collection === 'companies') setCompanies(prev => prev.map(i => i.id === id ? item : i));
             if (collection === 'units') setUnits(prev => prev.map(i => i.id === id ? item : i));
             if (collection === 'users') setUsers(prev => prev.map(i => i.id === id ? item : i));
             if (collection === 'requests') setRequests(prev => prev.map(i => i.id === id ? item : i));
             if (collection === 'comments') setComments(prev => prev.map(i => i.id === id ? item : i));
          };

          const handleDelete = (collection: string, id: string) => {
             if (collection === 'companies') setCompanies(prev => prev.filter(i => i.id !== id));
             if (collection === 'units') setUnits(prev => prev.filter(i => i.id !== id));
             if (collection === 'users') setUsers(prev => prev.filter(i => i.id !== id));
             if (collection === 'requests') setRequests(prev => prev.filter(i => i.id !== id));
             if (collection === 'comments') setComments(prev => prev.filter(i => i.id !== id));
          };

          socket.on('item_created', ({ collection, item }) => handleCreate(collection, item));
          socket.on('item_updated', ({ collection, id, item }) => handleUpdate(collection, id, item));
          socket.on('item_deleted', ({ collection, id }) => handleDelete(collection, id));

        } catch (e) {
          console.error("Failed to init socket connection", e);
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    connectDb();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [storageProvider, firebaseConfig, serverConfig]);

  // --- PERSISTENCE (Local Backup) ---
  useEffect(() => { localStorage.setItem('link_req_provider', JSON.stringify(storageProvider)); }, [storageProvider]);
  useEffect(() => { localStorage.setItem('link_req_companies', JSON.stringify(companies)); }, [companies]);
  useEffect(() => { localStorage.setItem('link_req_units', JSON.stringify(units)); }, [units]);
  useEffect(() => { localStorage.setItem('link_req_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('link_req_requests', JSON.stringify(requests)); }, [requests]);
  useEffect(() => { localStorage.setItem('link_req_comments', JSON.stringify(comments)); }, [comments]);
  useEffect(() => { localStorage.setItem('link_req_is_setup_done', JSON.stringify(isSetupDone)); }, [isSetupDone]);
  
  const saveFirebaseConfig = (config: FirebaseConfig | null) => {
    setFirebaseConfigState(config);
    if (config) {
      localStorage.setItem('link_req_firebase_config', JSON.stringify(config));
      setStorageProvider('FIREBASE');
    } else {
      localStorage.removeItem('link_req_firebase_config');
      setStorageProvider('LOCAL');
    }
  };

  const saveServerConfig = (config: ServerConfig | null) => {
    setServerConfigState(config);
    if (config) {
      localStorage.setItem('link_req_server_config', JSON.stringify(config));
      setStorageProvider('SQLITE_SERVER');
    } else {
      localStorage.removeItem('link_req_server_config');
      setStorageProvider('LOCAL');
    }
  };

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

    setCompanies([newCompany]);
    setUnits([newUnit]);
    setUsers([newAdmin]);
    setRequests([]);
    setComments([]);
    setIsSetupDone(true);
    
    // Initial Sync
    if (isDbConnected) {
      if (storageProvider === 'FIREBASE') {
        fbSet('companies', newCompany.id, newCompany);
        fbSet('units', newUnit.id, newUnit);
        fbSet('users', newAdmin.id, newAdmin);
      } else if (storageProvider === 'SQLITE_SERVER' && socketRef.current) {
        socketRef.current.emit('create_item', { collection: 'companies', item: newCompany });
        socketRef.current.emit('create_item', { collection: 'units', item: newUnit });
        socketRef.current.emit('create_item', { collection: 'users', item: newAdmin });
      }
    }
  };

  // --- CRUD ACTIONS (Hybrid Logic) ---

  const addRequest = (req: Omit<RequestTicket, 'id' | 'createdAt' | 'updatedAt' | 'viewedByAssignee'>) => {
    const newRequest: RequestTicket = {
      ...req,
      id: `r${Date.now()}`,
      createdAt: formatISO(new Date()),
      updatedAt: formatISO(new Date()),
      attachments: req.attachments || [],
      viewedByAssignee: false,
    };
    
    // Optimistic Update
    setRequests(prev => [newRequest, ...prev]);
    
    if (isDbConnected) {
      if (storageProvider === 'FIREBASE') fbSet('requests', newRequest.id, newRequest);
      if (storageProvider === 'SQLITE_SERVER' && socketRef.current) socketRef.current.emit('create_item', { collection: 'requests', item: newRequest });
    }
  };

  const updateRequestStatus = (id: string, status: RequestStatus) => {
    const updatedDate = formatISO(new Date());
    const patch = { status, updatedAt: updatedDate };
    
    setRequests(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    
    if (isDbConnected) {
      if (storageProvider === 'FIREBASE') fbUpdate('requests', id, patch);
      if (storageProvider === 'SQLITE_SERVER' && socketRef.current) socketRef.current.emit('update_item', { collection: 'requests', id, data: patch });
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
    
    const updatedDate = formatISO(new Date());
    setRequests(prev => prev.map(r => r.id === ticketId ? { ...r, updatedAt: updatedDate } : r));
    
    if (isDbConnected) {
      if (storageProvider === 'FIREBASE') {
        fbSet('comments', newComment.id, newComment);
        fbUpdate('requests', ticketId, { updatedAt: updatedDate });
      }
      if (storageProvider === 'SQLITE_SERVER' && socketRef.current) {
        socketRef.current.emit('create_item', { collection: 'comments', item: newComment });
        socketRef.current.emit('update_item', { collection: 'requests', id: ticketId, data: { updatedAt: updatedDate } });
      }
    }
  };

  const addUnit = (unit: Omit<Unit, 'id'>) => {
    const newUnit = { ...unit, id: `u${Date.now()}` };
    setUnits(prev => [...prev, newUnit]);
    
    if (isDbConnected) {
      if (storageProvider === 'FIREBASE') fbSet('units', newUnit.id, newUnit);
      if (storageProvider === 'SQLITE_SERVER' && socketRef.current) socketRef.current.emit('create_item', { collection: 'units', item: newUnit });
    }
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: `user${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
    
    if (isDbConnected) {
      if (storageProvider === 'FIREBASE') fbSet('users', newUser.id, newUser);
      if (storageProvider === 'SQLITE_SERVER' && socketRef.current) socketRef.current.emit('create_item', { collection: 'users', item: newUser });
    }
  };

  const updateUserPassword = (userId: string, newPassword: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    
    if (isDbConnected) {
      if (storageProvider === 'FIREBASE') fbUpdate('users', userId, { password: newPassword });
      if (storageProvider === 'SQLITE_SERVER' && socketRef.current) socketRef.current.emit('update_item', { collection: 'users', id: userId, data: { password: newPassword } });
    }
  };

  const updateCompany = (id: string, data: Partial<Company>) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    
    if (isDbConnected) {
      if (storageProvider === 'FIREBASE') fbUpdate('companies', id, data);
      if (storageProvider === 'SQLITE_SERVER' && socketRef.current) socketRef.current.emit('update_item', { collection: 'companies', id, data });
    }
  };

  const deleteUnit = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    
    if (isDbConnected) {
      if (storageProvider === 'FIREBASE') fbDelete('units', id);
      if (storageProvider === 'SQLITE_SERVER' && socketRef.current) socketRef.current.emit('delete_item', { collection: 'units', id });
    }
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    
    if (isDbConnected) {
      if (storageProvider === 'FIREBASE') fbDelete('users', id);
      if (storageProvider === 'SQLITE_SERVER' && socketRef.current) socketRef.current.emit('delete_item', { collection: 'users', id });
    }
  };

  const getRequestsByUnit = (unitId: string) => requests.filter(r => r.unitId === unitId);
  const getRequestsByCompany = (companyId: string) => requests.filter(r => r.companyId === companyId);
  const getCommentsByRequest = (requestId: string) => comments.filter(c => c.requestId === requestId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <DataContext.Provider value={{
      companies, units, users, requests, comments,
      isSetupDone, setupSystem,
      
      storageProvider, setStorageProvider,
      firebaseConfig, saveFirebaseConfig,
      serverConfig, saveServerConfig,
      isDbConnected, isLoading,
      
      addRequest, updateRequestStatus, addComment,
      addUnit, addUser, updateUserPassword, updateCompany, deleteUnit, deleteUser,
      getRequestsByUnit, getRequestsByCompany, getCommentsByRequest,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
