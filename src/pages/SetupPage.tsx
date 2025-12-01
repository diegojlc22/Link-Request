import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
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
  AlertTriangle
} from 'lucide-react';

export const SetupPage: React.FC = () => {
  const { setupSystem, isDbConnected, enableDemoMode } = useData();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  const handleSubmit = async (e: React.FormEvent) => {
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

  const FeatureItem = ({ icon: Icon, title, desc }: any) => (
    <div className="flex gap-4">
        <div className="h-10 w-10 rounded-lg bg-primary-500/20 flex items-center justify-center text-primary-200 flex-shrink-0">
            <Icon className="h-5 w-5" />
        </div>
        <div>
            <h3 className="text-white font-medium">{title}</h3>
            <p className="text-primary-200 text-sm mt-1 leading-relaxed">{desc}</p>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-900 font-sans">
      
      {/* LADO ESQUERDO (Branding / Marketing) - Escondido em mobile */}
      <div className="hidden lg:flex w-1/2 bg-primary-900 relative overflow-hidden flex-col justify-between p-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
            <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M0 100 L100 0 L100 100 Z" fill="white" />
            </svg>
        </div>

        <div className="relative z-10">
            <div 
                onClick={handleLogoClick}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-800/50 border border-primary-700 text-primary-100 text-xs font-medium cursor-pointer hover:bg-primary-800 transition-colors select-none"
            >
                <Rocket className="h-3 w-3" />
                <span>Instalador v2.0</span>
            </div>
            <h1 className="mt-6 text-4xl font-bold text-white leading-tight">
                Gerencie requisições <br/>
                <span className="text-primary-400">como um profissional.</span>
            </h1>
            <p className="mt-4 text-primary-200 text-lg max-w-md">
                Configure sua instância corporativa em segundos e comece a centralizar as demandas da sua equipe.
            </p>
        </div>

        <div className="relative z-10 space-y-8 mt-12">
            <FeatureItem 
                icon={LayoutDashboard} 
                title="Dashboard Centralizado" 
                desc="Visualize métricas, status e gargalos da sua operação em tempo real." 
            />
            <FeatureItem 
                icon={Building2} 
                title="Multi-Unidade" 
                desc="Gerencie filiais, departamentos ou setores de forma isolada mas integrada." 
            />
            <FeatureItem 
                icon={ShieldCheck} 
                title="Segurança Enterprise" 
                desc="Controle de acesso baseado em função (RBAC) e logs de auditoria." 
            />
        </div>

        <div className="relative z-10 text-primary-400 text-xs mt-12">
            © 2024 Link-Request SaaS. Todos os direitos reservados.
        </div>
      </div>

      {/* LADO DIREITO (Formulário) */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
            
            {/* Status Bar Mobile/Desktop */}
            <div className={`
                flex items-center justify-between px-4 py-3 rounded-lg text-sm mb-6
                ${isDbConnected ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}
            `}>
                <div className="flex items-center gap-2">
                    {isDbConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    <span className="font-medium">
                        {isDbConnected ? 'Conectado ao Banco de Dados' : 'Sem conexão com Servidor'}
                    </span>
                </div>
                {isDbConnected && <CheckCircle2 className="h-4 w-4" />}
            </div>
            
            {!isDbConnected && (
                <div className="text-xs text-red-600 bg-red-50 p-3 rounded border border-red-100 flex gap-2 items-start">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                        <strong>Atenção:</strong> As chaves do Firebase podem estar incorretas ou o banco de dados ainda não foi criado no console. 
                        Tente criar o Admin abaixo; se falhar, revise o arquivo <code>src/config/tenants.ts</code>.
                    </span>
                </div>
            )}

            <div className="text-center lg:text-left">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Criar Conta Mestre</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                    Defina a organização e o administrador principal.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                
                {/* Organização */}
                <div className="space-y-4 pt-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Organização</p>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            name="companyName"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            placeholder="Nome da Empresa (ex: Tesla Inc)"
                            value={formData.companyName}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {/* Admin */}
                <div className="space-y-4 pt-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Administrador</p>
                    
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            name="adminName"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            placeholder="Nome Completo"
                            value={formData.adminName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            name="adminEmail"
                            type="email"
                            required
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            placeholder="email@corporativo.com"
                            value={formData.adminEmail}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            name="adminPassword"
                            type="password"
                            required
                            minLength={6}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            placeholder="Senha Mestre"
                            value={formData.adminPassword}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="pt-6">
                    <Button 
                        type="submit" 
                        size="lg" 
                        className="w-full h-12 text-base shadow-xl shadow-primary-600/20" 
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Inicializando Sistema...' : 'Instalar e Acessar'}
                    </Button>
                    <p className="text-center text-xs text-gray-400 mt-4">
                        Ao continuar, você concorda com a criação automática do banco de dados e estrutura de usuários.
                    </p>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};
