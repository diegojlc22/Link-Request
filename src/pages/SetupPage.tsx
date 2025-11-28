import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Building2, User, Rocket, AlertTriangle, ArrowLeft, WifiOff, RefreshCw, Loader2, Database } from 'lucide-react';

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
    // 1. Limpa o tenant salvo no LocalStorage
    localStorage.removeItem('link_req_tenant_slug');
    // 2. Redireciona para a raiz. O App.tsx não vai achar tenant e mostrará o Portal.
    window.location.href = '/';
  };

  // ==============================================================================
  // TELA DE ERRO DE CONEXÃO (Substitui a antiga tela de Variáveis de Ambiente)
  // ==============================================================================
  if (!isDbConnected) {
    const currentSlug = localStorage.getItem('link_req_tenant_slug') || 'Empresa Selecionada';

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg text-center animate-fade-in">
                 
                 {/* Ícone de Erro */}
                 <div 
                    onClick={handleIconClick}
                    className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-red-100 text-red-600 mb-6 shadow-xl shadow-red-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-transform select-none"
                 >
                    <WifiOff className="h-10 w-10" />
                 </div>

                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Falha na Conexão
                 </h1>
                 
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 mb-8 text-left">
                     <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Não foi possível conectar ao banco de dados da empresa: <strong className="text-primary-600">{currentSlug}</strong>.
                     </p>
                     
                     <div className="flex items-start gap-3 p-3 bg-gray-100 dark:bg-gray-900 rounded text-sm text-gray-500">
                        <Database className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-semibold mb-1">Causas Prováveis:</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>Configuração errada no arquivo <code>tenants.ts</code>.</li>
                                <li>Banco de dados ou Auth não criados no Firebase.</li>
                                <li>Regras de segurança bloqueando o acesso.</li>
                            </ul>
                        </div>
                     </div>
                 </div>
                 
                 {/* Ações Principais */}
                 <div className="space-y-3">
                    <Button onClick={handleBackToPortal} className="w-full py-3 text-base shadow-lg hover:shadow-xl transition-all">
                        <ArrowLeft className="h-5 w-5 mr-2" />
                        Trocar Empresa (Voltar ao Portal)
                    </Button>

                    <Button onClick={() => window.location.reload()} variant="ghost" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tentar Novamente
                    </Button>
                 </div>
            </div>
        </div>
    );
  }

  // ==============================================================================
  // WIZARD DE SETUP (Banco Conectado com Sucesso, mas Vazio)
  // ==============================================================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-600/30">
            <Rocket className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Primeiro Acesso</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Banco conectado! Vamos configurar a empresa.</p>
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
                   <div className="pt-4 flex gap-3">
                     <Button type="button" variant="secondary" onClick={handleBackToPortal}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Cancelar
                     </Button>
                     <Button type="button" className="flex-1" onClick={() => {
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
                                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Criando...
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