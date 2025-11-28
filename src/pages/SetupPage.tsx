import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Building2, User, Rocket, AlertTriangle, ArrowLeft, WifiOff, RefreshCw, Loader2, Database, HelpCircle } from 'lucide-react';

export const SetupPage: React.FC = () => {
  const { setupSystem, isDbConnected, enableDemoMode } = useData();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Dados do formulário
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Gatilho do Modo Demo
  const [clickCount, setClickCount] = useState(0);

  // Força atualização do título
  useEffect(() => {
    document.title = "Configuração do Sistema";
  }, []);

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
    localStorage.removeItem('link_req_tenant_slug');
    window.location.href = '/';
  };

  // ==============================================================================
  // TELA DE FALHA NA CONEXÃO (Versão Atualizada - Substitui "Variáveis de Ambiente")
  // ==============================================================================
  if (!isDbConnected) {
    const currentSlug = localStorage.getItem('link_req_tenant_slug') || 'Nenhuma selecionada';

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md text-center animate-fade-in space-y-6">
                 
                 {/* Ícone de Erro */}
                 <div 
                    onClick={handleIconClick}
                    className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 cursor-pointer transition-transform hover:scale-110 active:scale-90"
                 >
                    <WifiOff className="h-10 w-10" />
                 </div>

                 <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Conexão Interrompida
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        Não foi possível conectar aos serviços da empresa:
                        <br/>
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-700 dark:text-gray-200 mt-1 inline-block">
                            {currentSlug}
                        </span>
                    </p>
                 </div>
                 
                 <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-800/30 p-4 rounded-xl text-left">
                     <div className="flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                        <div className="text-xs text-orange-800 dark:text-orange-300 space-y-1">
                            <p className="font-bold">O que pode estar acontecendo?</p>
                            <ul className="list-disc pl-4 space-y-1">
                                <li>As chaves da API no arquivo <code>tenants.ts</code> podem estar incorretas.</li>
                                <li>O Banco de Dados ou Authentication não foram criados no Firebase Console.</li>
                            </ul>
                        </div>
                     </div>
                 </div>
                 
                 <div className="grid gap-3 pt-2">
                    <Button onClick={handleBackToPortal} size="lg" className="w-full shadow-lg hover:shadow-xl transition-all">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar para Seleção de Empresa
                    </Button>

                    <Button onClick={() => window.location.reload()} variant="secondary" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Tentar Reconectar
                    </Button>
                 </div>
            </div>
        </div>
    );
  }

  // ==============================================================================
  // WIZARD DE SETUP (Banco Conectado)
  // ==============================================================================
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-600/30">
            <Rocket className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Bem-vindo(a)!</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Vamos preparar o ambiente da sua empresa.</p>
        </div>

        <Card className="border-0 shadow-xl ring-1 ring-gray-200 dark:ring-gray-700">
          <CardHeader className="border-b border-gray-100 dark:border-gray-800 pb-4">
            <div className="flex justify-between items-center mb-2">
                <CardTitle className="text-lg">
                {step === 1 ? 'Passo 1: Identificação' : 'Passo 2: Acesso Admin'}
                </CardTitle>
                <span className="text-xs font-mono text-gray-400">{step}/2</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="bg-primary-600 h-full transition-all duration-500 ease-out" 
                    style={{ width: step === 1 ? '50%' : '100%' }}
                />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {errorMsg && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm rounded-xl flex items-start gap-3 border border-red-100 dark:border-red-800">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p>{errorMsg}</p>
                </div>
            )}
            
            <form onSubmit={handleFinish}>
              {step === 1 && (
                <div className="space-y-5 animate-fade-in">
                   <div>
                     <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nome da Organização</label>
                     <div className="relative group">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <input 
                          required 
                          autoFocus
                          value={companyName} 
                          onChange={e => setCompanyName(e.target.value)} 
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                          placeholder="Ex: Tech Solutions Ltda"
                        />
                     </div>
                   </div>
                   
                   <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg flex gap-3 text-blue-700 dark:text-blue-300 text-xs">
                        <HelpCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <p>Este nome será exibido no topo do painel e nos relatórios gerados.</p>
                   </div>

                   <div className="pt-2 flex gap-3">
                     <Button type="button" variant="ghost" onClick={handleBackToPortal} className="text-gray-500">
                        Cancelar
                     </Button>
                     <Button type="button" className="flex-1" onClick={() => {
                       if(companyName) setStep(2);
                     }}>
                       Continuar <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                     </Button>
                   </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5 animate-fade-in">
                   <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-xs rounded border border-amber-100 dark:border-amber-800 mb-2 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Verifique se o Auth (Email/Senha) está ativo no Firebase.</span>
                   </div>

                   <div>
                     <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Nome do Administrador</label>
                     <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        <input 
                          required 
                          autoFocus
                          value={adminName} 
                          onChange={e => setAdminName(e.target.value)} 
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="Ex: Maria Souza"
                          disabled={isSubmitting}
                        />
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email de Login</label>
                         <input 
                           required 
                           type="email"
                           value={adminEmail} 
                           onChange={e => setAdminEmail(e.target.value)} 
                           className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
                           placeholder="admin@empresa.com"
                           disabled={isSubmitting}
                         />
                       </div>
                       <div>
                         <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Senha (Min 6)</label>
                         <input 
                           required 
                           type="password"
                           minLength={6}
                           value={adminPassword} 
                           onChange={e => setAdminPassword(e.target.value)} 
                           className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 outline-none"
                           placeholder="••••••••"
                           disabled={isSubmitting}
                         />
                       </div>
                   </div>
                   
                   <div className="flex gap-3 pt-6">
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
                                <ShieldCheck className="h-4 w-4 mr-2" /> Concluir Setup
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