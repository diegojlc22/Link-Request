
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  ShieldCheck, 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Rocket, 
  Wifi, 
  WifiOff,
  CheckCircle2,
  LayoutDashboard,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export const SetupPage: React.FC = () => {
  const { setupSystem, isDbConnected, enableDemoMode } = useData();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  
  // Dados do formulário
  const [formData, setFormData] = useState({
    companyName: '',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  // Gatilho do Modo Demo (Easter Egg no logo)
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    document.title = "Inicialização da Plataforma";
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
        await setupSystem({
            companyName: formData.companyName,
            adminName: formData.adminName,
            adminEmail: formData.adminEmail,
            adminPassword: formData.adminPassword
        });
        showToast('Plataforma inicializada com sucesso!', 'success');
    } catch (error: any) {
        console.error(error);
        showToast(`Erro na inicialização: ${error.message}`, 'error');
        setIsSubmitting(false);
    }
  };

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 5) {
        enableDemoMode();
        showToast('Modo Demonstração Ativado', 'success');
    }
  };

  // MODO WIZARD (FORMULÁRIO DE CRIAÇÃO)
  // A tela de bloqueio foi removida para garantir que você sempre possa tentar criar a conta.
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div 
             onClick={handleLogoClick}
             className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-600/30 cursor-pointer select-none"
          >
            <Rocket className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Configuração Inicial</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Crie o administrador da empresa.</p>

          {!isDbConnected && (
             <div className="mt-4 p-2 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200 inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                <span>Conexão com o banco ainda não confirmada. Tente prosseguir.</span>
             </div>
          )}
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
                            name="companyName"
                            required
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                            placeholder="Nome da Empresa (ex: Tesla Inc)"
                            value={formData.companyName}
                            onChange={handleChange}
                        />
                     </div>
                   </div>
                   <div className="pt-4">
                     <Button type="button" className="w-full" onClick={() => {
                       if(formData.companyName) setStep(2);
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
                            name="adminName"
                            required
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                            placeholder="Nome Completo"
                            value={formData.adminName}
                            onChange={handleChange}
                        />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email de Acesso</label>
                     <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            name="adminEmail"
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                            placeholder="email@corporativo.com"
                            value={formData.adminEmail}
                            onChange={handleChange}
                        />
                     </div>
                   </div>
                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                     <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            name="adminPassword"
                            type="password"
                            required
                            minLength={6}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500"
                            placeholder="Senha Mestre"
                            value={formData.adminPassword}
                            onChange={handleChange}
                        />
                     </div>
                   </div>
                   
                   <div className="flex gap-3 pt-4">
                     <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={isSubmitting}>
                       Voltar
                     </Button>
                     <Button type="submit" className="flex-1" disabled={isSubmitting}>
                       {isSubmitting ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" /> Instalando...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" /> Finalizar Instalação
                            </span>
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
