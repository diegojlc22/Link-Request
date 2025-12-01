
export enum UserRole {
  ADMIN = 'ADMIN',       // General Company Admin
  LEADER = 'LEADER',     // Unit Leader
  USER = 'USER'          // Standard User
}

export enum RequestStatus {
  SENT = 'Enviado',
  VIEWED = 'Visto',
  IN_PROGRESS = 'Em Andamento',
  WAITING_CLIENT = 'Aguardando Cliente',
  RESOLVED = 'Resolvido',
  CANCELLED = 'Cancelado'
}

export interface Company {
  id: string;
  name: string;
  domain: string;
  logoUrl: string;
}

export interface Unit {
  id: string;
  companyId: string;
  name: string;
  location: string;
}

export interface User {
  id: string;
  companyId: string;
  unitId?: string; // Optional for global admins, required for others
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  password?: string; // Mantido como opcional por compatibilidade, mas não usado no Auth Nativo
}

export interface Comment {
  id: string;
  requestId: string;
  userId: string;
  content: string;
  createdAt: string; // ISO Date string
  isInternal?: boolean;
}

export interface RequestAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
}

export interface RequestTicket {
  id: string;
  companyId: string;
  unitId: string;
  creatorId: string;
  assigneeId?: string; // Could be null if not yet picked up
  title: string;
  description: string;
  productUrl?: string;
  status: RequestStatus;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  createdAt: string;
  updatedAt: string;
  attachments: RequestAttachment[];
  viewedByAssignee: boolean;
}

// Stats types for dashboard
export interface DashboardStats {
  total: number;
  pending: number;
  resolved: number;
  inProgress: number;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL?: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  firebaseConfig: FirebaseConfig;
  cloudinaryConfig?: CloudinaryConfig;
}