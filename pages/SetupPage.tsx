
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Building2, User, Rocket, AlertTriangle, Settings, RefreshCw } from 'lucide-react';
import { FirebaseConfig } from '../types';

export const SetupPage: React.FC = () => {
  const { setupSystem, isDbConnected } = useData();
  
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // State for manual config
  const [showConfigForm, setShowConfigForm] = useState(false);
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

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    // Salva no LocalStorage para que o firebaseService leia ao recarregar
    localStorage.setItem('firebase_config_override', JSON.stringify(manualConfig));
    // Recarrega a página para reinicializar o app
    window.location.reload();
  };

  if (!isDbConnected) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg text-center animate-fade-in">
                 <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 mb-4">
                    <AlertTriangle className="h-8 w-8" />
                 </div>
                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Conexão Não Estabelecida</h1>
                 
                 {!showConfigForm ? (
                    <>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            O sistema não detectou uma configuração válida do Firebase no código.
                        </p>
                        <div className="space-y-3">
                            <Button onClick={() => setShowConfigForm(true)} className="w-full max-w-xs mx-auto">
                                <Settings className="h-4 w-4 mr-2" /> Configurar Manualmente
                            </Button>
                            <Button variant="secondary" onClick={() => window.location.reload()} className="w-full max-w-xs mx-auto">
                                <RefreshCw className="h-4 w-4 mr-2" /> Tentar Novamente
                            </Button>
                        </div>
                        <p className="mt-8 text-xs text-gray-400">
                           Dica para desenvolvedores: Edite <code>services/firebaseService.ts</code> para corrigir globalmente.
                        </p>
                    </>
                 ) : (
                    <Card className="mt-6 text-left">
                        <CardHeader>
                            <CardTitle>Configuração do Firebase</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSaveConfig} className="space-y-3">
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded mb-2">
                                    Essas configurações serão salvas neste navegador.
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    <input 
                                        placeholder="API Key" required 
                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                        value={manualConfig.apiKey}
                                        onChange={e => setManualConfig({...manualConfig, apiKey: e.target.value})}
                                    />
                                    <input 
                                        placeholder="Project ID" required 
                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                        value={manualConfig.projectId}
                                        onChange={e => setManualConfig({...manualConfig, projectId: e.target.value})}
                                    />
                                    <input 
                                        placeholder="Database URL (Realtime Database)" required 
                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                        value={manualConfig.databaseURL}
                                        onChange={e => setManualConfig({...manualConfig, databaseURL: e.target.value})}
                                    />
                                    <input 
                                        placeholder="Auth Domain"
                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                        value={manualConfig.authDomain}
                                        onChange={e => setManualConfig({...manualConfig, authDomain: e.target.value})}
                                    />
                                    <input 
                                        placeholder="Storage Bucket"
                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                        value={manualConfig.storageBucket}
                                        onChange={e => setManualConfig({...manualConfig, storageBucket: e.target.value})}
                                    />
                                    <input 
                                        placeholder="Messaging Sender ID"
                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                        value={manualConfig.messagingSenderId}
                                        onChange={e => setManualConfig({...manualConfig, messagingSenderId: e.target.value})}
                                    />
                                    <input 
                                        placeholder="App ID"
                                        className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700"
                                        value={manualConfig.appId}
                                        onChange={e => setManualConfig({...manualConfig, appId: e.target.value})}
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <Button type="button" variant="secondary" onClick={() => setShowConfigForm(false)} className="flex-1">
                                        Cancelar
                                    </Button>
                                    <Button type="submit" className="flex-1">
                                        Salvar e Conectar
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                 )}
            </div>
        </div>
    );
  }

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
