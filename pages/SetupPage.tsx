
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Building2, User, Rocket, FileCode, Database, Lock, Globe, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { FirebaseConfig } from '../types';

export const SetupPage: React.FC = () => {
  const { setupSystem, isDbConnected } = useData();
  
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'local' | 'production'>('local');
  
  // Data for setup
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Manual Config State
  const [manualConfig, setManualConfig] = useState<FirebaseConfig>({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    databaseURL: ''
  });

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setupSystem({
      companyName,
      adminName,
      adminEmail,
      adminPassword
    });
  };

  const handleSaveLocalConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('firebase_config_override', JSON.stringify(manualConfig));
    window.location.reload();
  };

  const generateServiceFile = () => {
    const fileContent = `
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import * as rtdb from 'firebase/database';
import { FirebaseConfig } from '../types';

let app: FirebaseApp | undefined;
let db: rtdb.Database | undefined;

// --- CONFIGURAÇÃO FIXA (GERADA PELO INSTALADOR) ---
const FIXED_CONFIG: FirebaseConfig | null = {
  apiKey: "${manualConfig.apiKey}",
  authDomain: "${manualConfig.authDomain}",
  databaseURL: "${manualConfig.databaseURL}",
  projectId: "${manualConfig.projectId}",
  storageBucket: "${manualConfig.storageBucket}",
  messagingSenderId: "${manualConfig.messagingSenderId}",
  appId: "${manualConfig.appId}"
};

const getEnvConfig = (): FirebaseConfig | null => {
  if (FIXED_CONFIG && FIXED_CONFIG.apiKey !== "") {
    return FIXED_CONFIG;
  }
  return null;
};

// Ler configuração de Storage (Cloudinary)
const getStorageConfig = () => {
  try {
    const local = localStorage.getItem('link_req_storage_config');
    return local ? JSON.parse(local) : null;
  } catch (e) {
    return null;
  }
};

export const initFirebase = (manualConfig?: FirebaseConfig): boolean => {
  try {
    let config: FirebaseConfig | null = manualConfig && manualConfig.apiKey ? manualConfig : getEnvConfig();

    if (!config) {
      console.warn("Firebase Init Skipped: Missing configuration.");
      return false;
    }

    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    
    if (app) {
      db = rtdb.getDatabase(app);
    }
    
    return true;
  } catch (error) {
    console.error("Firebase initialization critical error:", error);
    return false;
  }
};

export const isFirebaseInitialized = () => !!db;

const normalizeData = <T>(val: any): T[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((item, index) => item ? { ...item, id: String(index) } : null).filter(Boolean) as T[];
  }
  return Object.keys(val).map(key => ({
    ...val[key],
    id: key
  })) as T[];
};

export const fbGetAll = async <T>(path: string): Promise<T[]> => {
  if (!db) return [];
  try {
    const dbRef = rtdb.ref(db, path);
    const snapshot = await rtdb.get(dbRef);
    if (snapshot.exists()) {
      return normalizeData<T>(snapshot.val());
    }
    return [];
  } catch (error) {
    return [];
  }
};

export const fbSubscribe = <T>(path: string, callback: (data: T[]) => void): () => void => {
  if (!db) return () => {};
  try {
    const dbRef = rtdb.ref(db, path);
    return rtdb.onValue(dbRef, (snapshot) => {
      callback(normalizeData<T>(snapshot.val()));
    });
  } catch (error) {
    return () => {};
  }
};

export const fbSubscribeRecent = <T>(path: string, limit: number, callback: (data: T[]) => void): () => void => {
  if (!db) return () => {};
  try {
    const dbQuery = rtdb.query(rtdb.ref(db, path), rtdb.orderByKey(), rtdb.limitToLast(limit));
    return rtdb.onValue(dbQuery, (snapshot) => {
      callback(normalizeData<T>(snapshot.val()));
    });
  } catch (error) {
    return () => {};
  }
};

export const fbSet = async (path: string, id: string, data: any) => {
  if (!db) return;
  await rtdb.set(rtdb.ref(db, \`\${path}/\${id}\`), data);
};

export const fbUpdate = async (path: string, id: string, data: any) => {
  if (!db) return;
  await rtdb.update(rtdb.ref(db, \`\${path}/\${id}\`), data);
};

export const fbUpdateMulti = async (updates: Record<string, any>) => {
  if (!db) return;
  await rtdb.update(rtdb.ref(db), updates);
};

export const fbDelete = async (path: string, id: string) => {
  if (!db) return;
  await rtdb.remove(rtdb.ref(db, \`\${path}/\${id}\`));
};

export const fbUploadImage = async (base64String: string, fileName: string): Promise<string> => {
  const storageConfig = getStorageConfig();
  if (storageConfig && storageConfig.cloudName && storageConfig.uploadPreset) {
    try {
      const formData = new FormData();
      formData.append("file", base64String);
      formData.append("upload_preset", storageConfig.uploadPreset);
      const response = await fetch(
        \`https://api.cloudinary.com/v1_1/\${storageConfig.cloudName}/image/upload\`, 
        { method: "POST", body: formData }
      );
      const data = await response.json();
      if (data.secure_url) return data.secure_url;
    } catch (error) {
      console.error("Cloudinary failed", error);
    }
  }
  return base64String;
};
`;

    const blob = new Blob([fileContent], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'firebaseService.ts';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // MODO INSTALADOR (SEM BANCO CONECTADO)
  if (!isDbConnected) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl text-center animate-fade-in">
                 <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-lg shadow-blue-500/20">
                    <Database className="h-8 w-8" />
                 </div>
                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Instalação do Sistema</h1>
                 <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Configure o banco de dados para iniciar.
                 </p>
                 
                 <Card className="text-left shadow-xl border-t-4 border-t-primary-600">
                    <div className="flex border-b border-gray-100 dark:border-gray-700">
                        <button 
                            onClick={() => setMode('local')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === 'local' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/10' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Globe className="h-4 w-4" /> 
                                Instalação Rápida (Local)
                            </div>
                        </button>
                        <button 
                            onClick={() => setMode('production')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === 'production' ? 'text-green-600 border-b-2 border-green-600 bg-green-50 dark:bg-green-900/10' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Lock className="h-4 w-4" /> 
                                Instalação Definitiva
                            </div>
                        </button>
                    </div>

                    <CardContent className="p-6">
                        {mode === 'local' ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300 mb-4">
                                    <p>
                                        <strong>Como funciona:</strong> Salva as credenciais no navegador atual.
                                        <br/>
                                        <span className="text-xs opacity-80">Ideal para testes rápidos. Se trocar de PC, terá que configurar de novo.</span>
                                    </p>
                                </div>
                                
                                <form onSubmit={handleSaveLocalConfig} className="space-y-4">
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Cole suas credenciais do Firebase:</label>
                                        <input placeholder="API Key" required className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.apiKey} onChange={e => setManualConfig({...manualConfig, apiKey: e.target.value})} />
                                        <input placeholder="Project ID" required className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.projectId} onChange={e => setManualConfig({...manualConfig, projectId: e.target.value})} />
                                        <input placeholder="Database URL" required className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.databaseURL} onChange={e => setManualConfig({...manualConfig, databaseURL: e.target.value})} />
                                        
                                        {/* Optional/Hidden fields for functionality */}
                                        <div className="grid grid-cols-2 gap-3 opacity-80">
                                            <input placeholder="Auth Domain" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.authDomain} onChange={e => setManualConfig({...manualConfig, authDomain: e.target.value})} />
                                            <input placeholder="Storage Bucket" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.storageBucket} onChange={e => setManualConfig({...manualConfig, storageBucket: e.target.value})} />
                                            <input placeholder="Messaging Sender ID" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.messagingSenderId} onChange={e => setManualConfig({...manualConfig, messagingSenderId: e.target.value})} />
                                            <input placeholder="App ID" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.appId} onChange={e => setManualConfig({...manualConfig, appId: e.target.value})} />
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full py-3">
                                        <Rocket className="h-4 w-4 mr-2" /> Salvar neste Navegador
                                    </Button>
                                </form>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm text-green-800 dark:text-green-300">
                                    <p className="flex items-start gap-2">
                                        <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                        <span>
                                            <strong>Solução Definitiva:</strong> Gera um arquivo de sistema com suas senhas embutidas. 
                                            Assim você nunca mais precisará configurar, não importa o dispositivo.
                                        </span>
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">1. Preencha os dados:</label>
                                    <input placeholder="API Key" required className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.apiKey} onChange={e => setManualConfig({...manualConfig, apiKey: e.target.value})} />
                                    <input placeholder="Project ID" required className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.projectId} onChange={e => setManualConfig({...manualConfig, projectId: e.target.value})} />
                                    <input placeholder="Database URL" required className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.databaseURL} onChange={e => setManualConfig({...manualConfig, databaseURL: e.target.value})} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input placeholder="Auth Domain" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.authDomain} onChange={e => setManualConfig({...manualConfig, authDomain: e.target.value})} />
                                        <input placeholder="Storage Bucket" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.storageBucket} onChange={e => setManualConfig({...manualConfig, storageBucket: e.target.value})} />
                                        <input placeholder="Messaging Sender ID" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.messagingSenderId} onChange={e => setManualConfig({...manualConfig, messagingSenderId: e.target.value})} />
                                        <input placeholder="App ID" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.appId} onChange={e => setManualConfig({...manualConfig, appId: e.target.value})} />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">2. Gere o arquivo e substitua no projeto:</label>
                                    <Button 
                                        onClick={generateServiceFile} 
                                        variant="secondary"
                                        className="w-full py-3 mb-2 bg-gray-900 text-white hover:bg-gray-800 dark:bg-white dark:text-gray-900"
                                        disabled={!manualConfig.apiKey || !manualConfig.databaseURL}
                                    >
                                        <Download className="h-4 w-4 mr-2" /> 
                                        Baixar Arquivo "firebaseService.ts"
                                    </Button>
                                    
                                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 mt-2 bg-amber-50 dark:bg-amber-900/10 p-2 rounded">
                                        <AlertTriangle className="h-4 w-4" />
                                        Substitua o arquivo original em: <code>src/services/firebaseService.ts</code>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
  }

  // MODO WIZARD (BANCO CONECTADO, MAS SEM DADOS)
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-600/30">
            <Rocket className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuração Inicial</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Crie o administrador da empresa.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? 'Dados da Empresa' : 'Conta do Administrador'}
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFinish}>
              {step === 1 && (
                <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Empresa</label>
                     <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                          required 
                          value={companyName} 
                          onChange={e => setCompanyName(e.target.value)} 
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                          placeholder="Ex: Minha Empresa Ltda"
                        />
                     </div>
                   </div>
                   <div className="pt-4">
                     <Button type="button" className="w-full" onClick={() => {
                       if(companyName) setStep(2);
                     }}>
                       Próximo
                     </Button>
                   </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Admin</label>
                     <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                          required 
                          value={adminName} 
                          onChange={e => setAdminName(e.target.value)} 
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                          placeholder="Ex: João Silva"
                        />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email de Acesso</label>
                     <input 
                       required 
                       type="email"
                       value={adminEmail} 
                       onChange={e => setAdminEmail(e.target.value)} 
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                       placeholder="admin@exemplo.com"
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                     <input 
                       required 
                       type="password"
                       value={adminPassword} 
                       onChange={e => setAdminPassword(e.target.value)} 
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                       placeholder="********"
                     />
                   </div>
                   
                   <div className="flex gap-3 pt-4">
                     <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                       Voltar
                     </Button>
                     <Button type="submit" className="flex-1">
                       <ShieldCheck className="h-4 w-4 mr-2" /> Finalizar Instalação
                     </Button>
                   </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
