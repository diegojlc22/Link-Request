
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Building2, User, Rocket, Settings, FileCode, Database, Cloud } from 'lucide-react';
import { FirebaseConfig } from '../types';

export const SetupPage: React.FC = () => {
  const { setupSystem, isDbConnected } = useData();
  
  const [step, setStep] = useState(1);
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

  // Storage Config State (Cloudinary)
  const [storageConfig, setStorageConfig] = useState({
    cloudName: '',
    uploadPreset: ''
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

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 1. Salva Config do Firebase
    localStorage.setItem('firebase_config_override', JSON.stringify(manualConfig));
    
    // 2. Salva Config de Storage (Se preenchido)
    if (storageConfig.cloudName && storageConfig.uploadPreset) {
      localStorage.setItem('link_req_storage_config', JSON.stringify(storageConfig));
    } else {
      localStorage.removeItem('link_req_storage_config');
    }

    // Recarrega
    window.location.reload();
  };

  const handleCodePaste = (code: string) => {
    try {
      const extract = (key: string) => {
        const regex = new RegExp(`${key}\\s*:\\s*["']([^"']+)["']`);
        const match = code.match(regex);
        return match ? match[1] : '';
      };

      const newConfig = { ...manualConfig };
      let foundAny = false;
      
      const keys: (keyof FirebaseConfig)[] = ['apiKey', 'authDomain', 'databaseURL', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
      
      keys.forEach(k => {
        const val = extract(k);
        if (val) {
          newConfig[k] = val;
          foundAny = true;
        }
      });

      if (foundAny) {
        setManualConfig(newConfig);
      }
    } catch (e) {
      console.warn("Error parsing config", e);
    }
  };

  // MODO INSTALADOR (SEM BANCO CONECTADO)
  if (!isDbConnected) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg text-center animate-fade-in">
                 <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-lg shadow-blue-500/20">
                    <Database className="h-8 w-8" />
                 </div>
                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Instalação do Sistema</h1>
                 <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Bem-vindo! Para começar, conecte seu banco de dados.
                 </p>
                 
                 <Card className="text-left shadow-xl border-t-4 border-t-primary-600">
                    <CardHeader>
                        <CardTitle className="text-lg">Configuração do Ambiente</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                               <FileCode className="h-4 w-4 text-primary-600" /> Colar Firebase Config
                            </label>
                            <textarea 
                              className="w-full h-24 p-3 text-xs font-mono border rounded bg-white dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-primary-500 text-gray-600 dark:text-gray-300 shadow-inner"
                              placeholder={`Cole aqui o trecho:\nconst firebaseConfig = { ... }`}
                              onChange={(e) => handleCodePaste(e.target.value)}
                            />
                        </div>

                        <form onSubmit={handleSaveConfig} className="space-y-6">
                            {/* Firebase Config Fields */}
                            <div className="space-y-3 border-b border-gray-100 dark:border-gray-700 pb-6">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Database className="h-4 w-4" /> Credenciais do Firebase
                                </h3>
                                <input 
                                    placeholder="API Key" required 
                                    className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                    value={manualConfig.apiKey}
                                    onChange={e => setManualConfig({...manualConfig, apiKey: e.target.value})}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                  <input 
                                      placeholder="Project ID" required 
                                      className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                      value={manualConfig.projectId}
                                      onChange={e => setManualConfig({...manualConfig, projectId: e.target.value})}
                                  />
                                  <input 
                                      placeholder="Database URL" required 
                                      className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                      value={manualConfig.databaseURL}
                                      onChange={e => setManualConfig({...manualConfig, databaseURL: e.target.value})}
                                  />
                                </div>
                                {/* Hidden/Optional technical fields */}
                                <div className="hidden">
                                    <input value={manualConfig.authDomain} onChange={e => setManualConfig({...manualConfig, authDomain: e.target.value})} />
                                    <input value={manualConfig.storageBucket} onChange={e => setManualConfig({...manualConfig, storageBucket: e.target.value})} />
                                    <input value={manualConfig.messagingSenderId} onChange={e => setManualConfig({...manualConfig, messagingSenderId: e.target.value})} />
                                    <input value={manualConfig.appId} onChange={e => setManualConfig({...manualConfig, appId: e.target.value})} />
                                </div>
                            </div>

                            {/* Cloudinary Config Fields */}
                            <div className="space-y-3">
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Cloud className="h-4 w-4 text-blue-500" /> Armazenamento de Imagens (Opcional)
                                </h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Recomendado: Use <strong>Cloudinary</strong> para uploads rápidos e gratuitos. 
                                    Se deixar em branco, as imagens serão salvas no banco de dados (mais lento).
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <input 
                                        placeholder="Cloud Name (ex: demo)" 
                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                        value={storageConfig.cloudName}
                                        onChange={e => setStorageConfig({...storageConfig, cloudName: e.target.value})}
                                    />
                                    <input 
                                        placeholder="Upload Preset (Unsigned)" 
                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                        value={storageConfig.uploadPreset}
                                        onChange={e => setStorageConfig({...storageConfig, uploadPreset: e.target.value})}
                                    />
                                </div>
                                <p className="text-[10px] text-gray-400">
                                   No Cloudinary: Settings &gt; Upload &gt; Add Upload Preset &gt; Signing Mode: Unsigned.
                                </p>
                            </div>

                            <div className="pt-2">
                                <Button type="submit" className="w-full text-base py-2.5 shadow-lg shadow-primary-500/20">
                                    <Rocket className="h-4 w-4 mr-2" /> Salvar e Iniciar
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
  }

  // MODO WIZARD (BANCO CONECTADO, MAS SEM DADOS) - Mantido igual
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-600/30">
            <Rocket className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instalação do Sistema</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Crie sua conta administrativa para começar.</p>
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
