import React, { createContext, useContext, useState, useEffect } from 'react';
import { Company, Unit, User, RequestTicket, Comment, UserRole, RequestStatus, FirebaseConfig } from '../types';
import { formatISO, subDays } from 'date-fns';
import { initFirebase, fbGetAll, fbSet, fbUpdate, fbDelete, isFirebaseInitialized } from '../services/firebaseService';

interface DataContextType {
  companies: Company[];
  units: Unit[];
  users: User[];
  requests: RequestTicket[];
  comments: Comment[];
  
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
  { id: 'c1', name: 'NexRequest', domain: 'techcorp.saas.com', logoUrl: '' },
];

const MOCK_UNITS: Unit[] = [
  { id: 'u1', companyId: 'c1', name: 'Matriz - São Paulo', location: 'Av. Paulista, 1000' },
  { id: 'u2', companyId: 'c1', name: 'Filial - Campinas', location: 'Barão Geraldo' },
  { id: 'u3', companyId: 'c1', name: 'Rio de Janeiro', location: 'Centro' },
];

const MOCK_USERS: User[] = [
  { id: 'user1', companyId: 'c1', name: 'Admin Geraldo', email: 'admin@techcorp.com', password: '123', role: UserRole.ADMIN, avatarUrl: 'https://picsum.photos/id/64/100/100' },
  { id: 'user2', companyId: 'c1', unitId: 'u1', name: 'Roberto Líder', email: 'roberto@techcorp.com', password: '123', role: UserRole.LEADER, avatarUrl: 'https://picsum.photos/id/65/100/100' },
  { id: 'user3', companyId: 'c1', unitId: 'u1', name: 'Ana Usuária', email: 'ana@techcorp.com', password: '123', role: UserRole.USER, avatarUrl: 'https://picsum.photos/id/66/100/100' },
  { id: 'user4', companyId: 'c1', unitId: 'u2', name: 'Carlos Campinas', email: 'carlos@techcorp.com', password: '123', role: UserRole.LEADER, avatarUrl: 'https://picsum.photos/id/67/100/100' },
];

const MOCK_REQUESTS: RequestTicket[] = [
  {
    id: 'r1',
    companyId: 'c1',
    unitId: 'u1',
    creatorId: 'user3',
    assigneeId: 'user2',
    title: 'Computador não liga',
    description: 'Ao tentar iniciar o computador hoje cedo, ele fez um bip e desligou.',
    status: RequestStatus.IN_PROGRESS,
    priority: 'High',
    createdAt: formatISO(subDays(new Date(), 2)),
    updatedAt: formatISO(subDays(new Date(), 1)),
    attachments: [],
    viewedByAssignee: true
  },
  {
    id: 'r2',
    companyId: 'c1',
    unitId: 'u1',
    creatorId: 'user3',
    title: 'Solicitação de novo mouse',
    description: 'O scroll do meu mouse parou de funcionar.',
    status: RequestStatus.SENT,
    priority: 'Low',
    createdAt: formatISO(subDays(new Date(), 0)),
    updatedAt: formatISO(subDays(new Date(), 0)),
    attachments: [],
    viewedByAssignee: false
  },
];

const MOCK_COMMENTS: Comment[] = [
  { id: 'cm1', requestId: 'r1', userId: 'user2', content: 'Você verificou se o cabo de força está bem conectado?', createdAt: formatISO(subDays(new Date(), 1)) },
  { id: 'cm2', requestId: 'r1', userId: 'user3', content: 'Sim, já troquei de tomada também.', createdAt: formatISO(subDays(new Date(), 1)) },
];

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
  // Local State
  const [companies, setCompanies] = useState<Company[]>(() => loadState('nex_companies', MOCK_COMPANIES));
  const [units, setUnits] = useState<Unit[]>(() => loadState('nex_units', MOCK_UNITS));
  const [users, setUsers] = useState<User[]>(() => loadState('nex_users', MOCK_USERS));
  const [requests, setRequests] = useState<RequestTicket[]>(() => loadState('nex_requests', MOCK_REQUESTS));
  const [comments, setComments] = useState<Comment[]>(() => loadState('nex_comments', MOCK_COMMENTS));
  
  // Firebase State
  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig | null>(() => loadState('nex_firebase_config', null));
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Firebase if config exists
  useEffect(() => {
    const initDb = async () => {
      if (firebaseConfig) {
        setIsLoading(true);
        const success = initFirebase(firebaseConfig);
        if (success) {
          setIsDbConnected(true);
          // Fetch data from Firestore
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
        } else {
          setIsDbConnected(false);
        }
        setIsLoading(false);
      } else {
        setIsDbConnected(false);
      }
    };
    initDb();
  }, [firebaseConfig]);

  // Persist to LocalStorage whenever state changes (Backup & Offline)
  useEffect(() => { localStorage.setItem('nex_companies', JSON.stringify(companies)); }, [companies]);
  useEffect(() => { localStorage.setItem('nex_units', JSON.stringify(units)); }, [units]);
  useEffect(() => { localStorage.setItem('nex_users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('nex_requests', JSON.stringify(requests)); }, [requests]);
  useEffect(() => { localStorage.setItem('nex_comments', JSON.stringify(comments)); }, [comments]);
  useEffect(() => { 
    if (firebaseConfig) localStorage.setItem('nex_firebase_config', JSON.stringify(firebaseConfig)); 
    else localStorage.removeItem('nex_firebase_config');
  }, [firebaseConfig]);

  const saveFirebaseConfig = (config: FirebaseConfig | null) => {
    setFirebaseConfig(config);
    if (!config) {
       window.location.reload(); // Reload to clear state if disconnecting
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
    setRequests(prev => [newRequest, ...prev]);
    if (isDbConnected) fbSet('requests', newRequest.id, newRequest);
  };

  const updateRequestStatus = (id: string, status: RequestStatus) => {
    const updatedDate = formatISO(new Date());
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status, updatedAt: updatedDate } : r));
    if (isDbConnected) fbUpdate('requests', id, { status, updatedAt: updatedDate });
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
    
    // Update ticket updated_at
    const updatedDate = formatISO(new Date());
    setRequests(prev => prev.map(r => r.id === ticketId ? { ...r, updatedAt: updatedDate } : r));
    
    if (isDbConnected) {
      fbSet('comments', newComment.id, newComment);
      fbUpdate('requests', ticketId, { updatedAt: updatedDate });
    }
  };

  const addUnit = (unit: Omit<Unit, 'id'>) => {
    const newUnit = { ...unit, id: `u${Date.now()}` };
    setUnits(prev => [...prev, newUnit]);
    if (isDbConnected) fbSet('units', newUnit.id, newUnit);
  };

  const addUser = (user: Omit<User, 'id'>) => {
    const newUser = { ...user, id: `user${Date.now()}` };
    setUsers(prev => [...prev, newUser]);
    if (isDbConnected) fbSet('users', newUser.id, newUser);
  };

  const updateUserPassword = (userId: string, newPassword: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: newPassword } : u));
    if (isDbConnected) fbUpdate('users', userId, { password: newPassword });
  };

  const updateCompany = (id: string, data: Partial<Company>) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    if (isDbConnected) fbUpdate('companies', id, data);
  };

  const deleteUnit = (id: string) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    if (isDbConnected) fbDelete('units', id);
  };

  const deleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
    if (isDbConnected) fbDelete('users', id);
  };

  const getRequestsByUnit = (unitId: string) => requests.filter(r => r.unitId === unitId);
  const getRequestsByCompany = (companyId: string) => requests.filter(r => r.companyId === companyId);
  const getCommentsByRequest = (requestId: string) => comments.filter(c => c.requestId === requestId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <DataContext.Provider value={{
      companies, units, users, requests, comments,
      firebaseConfig, isDbConnected, saveFirebaseConfig, isLoading,
      addRequest, updateRequestStatus, addComment,
      addUnit, addUser, updateUserPassword, updateCompany, deleteUnit, deleteUser,
      getRequestsByUnit, getRequestsByCompany, getCommentsByRequest
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