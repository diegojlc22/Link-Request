import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Building2, User, Rocket, Database, Link as LinkIcon, Globe, Copy, Check, AlertCircle } from 'lucide-react';
import { FirebaseConfig } from '../types';

export const SetupPage: React.FC = () => {
  const { setupSystem, isDbConnected } = useData();
  
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<'setup' | 'share'>('setup');
  
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

  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

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

  const generateMagicLink = () => {
    // 1. Minificar o objeto para ocupar menos espaço na URL
    // Removemos campos vazios opcionais
    const cleanConfig = Object.fromEntries(
        Object.entries(manualConfig).filter(([_, v]) => v !== '')
    );
    
    // 2. Converter para String JSON
    const jsonStr = JSON.stringify(cleanConfig);
    
    // 3. Encode Base64 (Simples, mas suficiente para URL)
    const base64 = btoa(jsonStr);
    
    // 4. Montar URL
    const baseUrl = window.location.origin + window.location.pathname;
    const link = `${baseUrl}?config=${base64}`;
    
    setGeneratedLink(link);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // MODO INSTALADOR (SEM BANCO CONECTADO)
  if (!isDbConnected) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl text-center animate-fade-in">
                 <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4 shadow-lg shadow-blue-500/20">
                    <Database className="h-8 w-8" />
                 </div>
                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Conectar Empresa</h1>
                 <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Configure o banco de dados da sua unidade ou gere um link para seus funcionários.
                 </p>
                 
                 <Card className="text-left shadow-xl border-t-4 border-t-primary-600">
                    <div className="flex border-b border-gray-100 dark:border-gray-700">
                        <button 
                            onClick={() => setMode('setup')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === 'setup' ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50 dark:bg-primary-900/10' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Globe className="h-4 w-4" /> 
                                Configurar Este PC
                            </div>
                        </button>
                        <button 
                            onClick={() => setMode('share')}
                            className={`flex-1 py-4 text-sm font-medium transition-colors ${mode === 'share' ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50 dark:bg-purple-900/10' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <LinkIcon className="h-4 w-4" /> 
                                Gerar Link de Acesso
                            </div>
                        </button>
                    </div>

                    <CardContent className="p-6">
                        {mode === 'setup' ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-300 mb-4">
                                    <p>
                                        <strong>Configuração Local:</strong> Insira os dados do Firebase da sua empresa.
                                        Eles serão salvos neste navegador.
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
                                        <Rocket className="h-4 w-4 mr-2" /> Salvar e Conectar
                                    </Button>
                                </form>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-800 dark:text-purple-300">
                                    <p className="flex items-start gap-2">
                                        <LinkIcon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                                        <span>
                                            <strong>Para Equipes (SaaS):</strong> Preencha os dados e gere um Link Mágico.
                                            Envie este link para seus funcionários. Ao clicarem, o sistema configurará automaticamente o acesso à sua empresa, sem que eles precisem digitar nada.
                                        </span>
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">1. Dados da Conexão:</label>
                                    <input placeholder="API Key" required className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.apiKey} onChange={e => setManualConfig({...manualConfig, apiKey: e.target.value})} />
                                    <input placeholder="Database URL" required className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.databaseURL} onChange={e => setManualConfig({...manualConfig, databaseURL: e.target.value})} />
                                    <input placeholder="Project ID" required className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.projectId} onChange={e => setManualConfig({...manualConfig, projectId: e.target.value})} />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input placeholder="Auth Domain" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.authDomain} onChange={e => setManualConfig({...manualConfig, authDomain: e.target.value})} />
                                        <input placeholder="Storage Bucket" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.storageBucket} onChange={e => setManualConfig({...manualConfig, storageBucket: e.target.value})} />
                                        <input placeholder="Messaging Sender ID" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.messagingSenderId} onChange={e => setManualConfig({...manualConfig, messagingSenderId: e.target.value})} />
                                        <input placeholder="App ID" className="w-full p-2 text-sm border rounded bg-white dark:bg-gray-800 dark:border-gray-700" value={manualConfig.appId} onChange={e => setManualConfig({...manualConfig, appId: e.target.value})} />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 block mb-2">2. Gerar Link:</label>
                                    {!generatedLink ? (
                                        <Button 
                                            onClick={generateMagicLink} 
                                            variant="secondary"
                                            className="w-full py-3 mb-2 bg-purple-600 text-white hover:bg-purple-700 border-none"
                                            disabled={!manualConfig.apiKey || !manualConfig.databaseURL}
                                        >
                                            <LinkIcon className="h-4 w-4 mr-2" /> 
                                            Criar Magic Link
                                        </Button>
                                    ) : (
                                        <div className="space-y-3 animate-fade-in">
                                            <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 break-all text-xs font-mono text-gray-600 dark:text-gray-400">
                                                {generatedLink}
                                            </div>
                                            <Button 
                                                onClick={copyToClipboard} 
                                                className={`w-full py-3 ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                            >
                                                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                                                {copied ? 'Copiado!' : 'Copiar Link'}
                                            </Button>
                                            <p className="text-xs text-center text-gray-500">Envie este link para sua equipe. Ao clicarem, o sistema abrirá já conectado.</p>
                                        </div>
                                    )}
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