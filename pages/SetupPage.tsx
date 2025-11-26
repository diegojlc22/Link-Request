import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Building2, User, Rocket, Settings, AlertTriangle, Cloud } from 'lucide-react';

export const SetupPage: React.FC = () => {
  const { setupSystem, isDbConnected, enableDemoMode } = useData();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  
  // Data for setup
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // Demo Mode Trigger
  const [clickCount, setClickCount] = useState(0);

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setupSystem({
      companyName,
      adminName,
      adminEmail,
      adminPassword
    });
  };

  const handleIconClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 5) {
        enableDemoMode();
        showToast('Modo Demo Ativado! Login: admin@demo.com / 123', 'success');
    }
  };

  // MODO: FALTA CONFIGURAÇÃO (Variáveis de Ambiente não encontradas)
  if (!isDbConnected) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl text-center animate-fade-in">
                 <div 
                    onClick={handleIconClick}
                    className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-amber-100 text-amber-600 mb-6 shadow-lg shadow-amber-500/20 cursor-pointer hover:scale-105 active:scale-95 transition-transform select-none"
                    title="Clique 5 vezes para modo Demo"
                 >
                    <Settings className="h-10 w-10" />
                 </div>
                 <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Configuração Pendente</h1>
                 <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                    O sistema precisa ser conectado ao Firebase através das <strong>Variáveis de Ambiente</strong> da sua hospedagem.
                 </p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <Card className="border-t-4 border-t-orange-500">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cloud className="h-5 w-5 text-orange-500" /> Cloudflare Pages
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
                            <p>1. Acesse seu painel Cloudflare &gt; Workers & Pages.</p>
                            <p>2. Selecione este projeto &gt; <strong>Settings</strong>.</p>
                            <p>3. Vá em <strong>Environment variables</strong>.</p>
                            <p>4. Adicione as chaves <code>VITE_FIREBASE_API_KEY</code>, etc.</p>
                        </CardContent>
                    </Card>

                    <Card className="border-t-4 border-t-black dark:border-t-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TriangleIcon className="h-5 w-5" /> Vercel / Netlify
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-gray-600 dark:text-gray-400 space-y-3">
                            <p>1. Acesse o Dashboard do projeto.</p>
                            <p>2. Vá em <strong>Settings</strong> &gt; <strong>Environment Variables</strong>.</p>
                            <p>3. Adicione as variáveis do Firebase copiadas do console.</p>
                            <p>4. Faça um <strong>Re-deploy</strong> para aplicar.</p>
                        </CardContent>
                    </Card>
                 </div>
                 
                 <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 inline-block text-left max-w-2xl">
                    <p className="text-sm text-blue-800 dark:text-blue-300 flex gap-2">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                        <span>
                            <strong>Dica:</strong> Após configurar as variáveis no painel da hospedagem, 
                            você precisa aguardar o novo build ou forçar um novo deploy para que o sistema as reconheça.
                            Atualize esta página após o processo.
                        </span>
                    </p>
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

const TriangleIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L24 22H0L12 1Z" />
  </svg>
);