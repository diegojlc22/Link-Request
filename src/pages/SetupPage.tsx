import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Building2, User, Rocket, Settings, AlertTriangle, Cloud, Image as ImageIcon, Lock, FileJson, Loader2, ArrowLeft } from 'lucide-react';

export const SetupPage: React.FC = () => {
  const { setupSystem, isDbConnected, enableDemoMode } = useData();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Data for setup
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Demo Mode Trigger
  const [clickCount, setClickCount] = useState(0);

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
        await setupSystem({
            companyName,
            adminName,
            adminEmail,
            adminPassword
        });
        showToast('Sistema configurado com sucesso!', 'success');
        // A navegação será automática via DataContext (isSetupDone muda para true)
    } catch (error: any) {
        console.error(error);
        setErrorMsg(error.message || "Erro desconhecido ao configurar sistema.");
        showToast('Falha na configuração. Verifique os erros.', 'error');
        setIsSubmitting(false);
    }
  };

  const handleIconClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 5) {
        enableDemoMode();
        showToast('Modo Demo Ativado! Login: admin@demo.com / 123', 'success');
    }
  };

  const handleBackToPortal = () => {
    localStorage.removeItem('link_req_tenant_slug');
    window.location.href = '/';
  };

  // MODO: FALTA CONFIGURAÇÃO
  if (!isDbConnected) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl text-center animate-fade-in">
                 <div 
                    onClick={handleIconClick}
                    className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 text-amber-600 mb-6 shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-transform select-none"
                    title="Clique 5 vezes para modo Demo"
                 >
                    <Settings className="h-10 w-10" />
                 </div>
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Configuração Pendente</h1>
                 <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                    O sistema não conseguiu conectar ao banco de dados. Verifique a configuração abaixo.
                 </p>
                 
                 <div className="flex justify-center mb-8">
                    <Button onClick={handleBackToPortal} variant="secondary">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para o Portal (Selecionar Empresa)
                    </Button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <Card className="border-t-4 border-t-purple-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                                <FileJson className="h-5 w-5" /> Opção A: Modo Multi-Cliente (SaaS)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
                            <p>Para gerenciar múltiplos clientes (Tenants):</p>
                            <ol className="list-decimal pl-4 space-y-1">
                                <li>Abra <code>src/config/tenants.ts</code> e adicione os dados do Firebase do cliente.</li>
                                <li>
                                    <strong>Acesso via Portal (Fácil):</strong> Acesse a URL principal e digite o <code>slug</code> (ex: padaria) configurado no arquivo.
                                </li>
                                <li>
                                    <strong>Acesso via Subdomínio (Opcional):</strong> Adicione <code>padaria.seusistema.com</code> no painel da sua hospedagem (Vercel/Netlify).
                                </li>
                            </ol>
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-orange-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                                <Cloud className="h-5 w-5" /> Opção B: Cliente Único
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
                            <p>Se o sistema for para apenas uma empresa, configure o <code>.env</code>:</p>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded font-mono text-xs overflow-x-auto space-y-1">
                                <div className="text-orange-600 dark:text-orange-400">VITE_FIREBASE_API_KEY</div>
                                <div className="text-orange-600 dark:text-orange-400">VITE_FIREBASE_PROJECT_ID</div>
                                <div className="text-orange-600 dark:text-orange-400">VITE_FIREBASE_DATABASE_URL</div>
                            </div>
                        </CardContent>
                    </Card>
                 </div>
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
          <p className="text-gray-500 dark:text-gray-400 mt-2">Banco conectado! Agora crie a conta Admin.</p>
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
            {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-lg flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p>{errorMsg}</p>
                </div>
            )}
            
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
                   <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded border border-blue-100 dark:border-blue-800 mb-4">
                        <strong>Atenção:</strong> Certifique-se de que ativou o método <em>"Email/Password"</em> no Console do Firebase (Authentication) antes de continuar.
                   </div>

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
                          disabled={isSubmitting}
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
                       disabled={isSubmitting}
                     />
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha (Min 6 caracteres)</label>
                     <input 
                       required 
                       type="password"
                       minLength={6}
                       value={adminPassword} 
                       onChange={e => setAdminPassword(e.target.value)} 
                       className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                       placeholder="********"
                       disabled={isSubmitting}
                     />
                   </div>
                   
                   <div className="flex gap-3 pt-4">
                     <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={isSubmitting}>
                       Voltar
                     </Button>
                     <Button type="submit" className="flex-1" disabled={isSubmitting}>
                       {isSubmitting ? (
                           <>
                             <Loader2 className="h-4 w-4 animate-spin mr-2" /> Configurando...
                           </>
                       ) : (
                           <>
                             <ShieldCheck className="h-4 w-4 mr-2" /> Finalizar Instalação
                           </>
                       )}
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