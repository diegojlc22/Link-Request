
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Building2, User, Rocket } from 'lucide-react';

export const SetupPage: React.FC = () => {
  const { setupSystem, isDbConnected } = useData();
  
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    setupSystem({
      companyName,
      adminName,
      adminEmail,
      adminPassword
      // firebaseConfig não é mais necessário aqui pois está no código
    });
  };

  if (!isDbConnected) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg text-center">
                 <h1 className="text-2xl font-bold text-red-600 mb-2">Erro de Configuração</h1>
                 <p className="text-gray-600 dark:text-gray-300">
                    O sistema não conseguiu conectar ao banco de dados.
                 </p>
                 <p className="mt-4 text-sm bg-gray-100 p-4 rounded text-left font-mono">
                    Abra o arquivo <strong>services/firebaseService.ts</strong> e preencha a variável <strong>FIXED_CONFIG</strong> com suas credenciais do Firebase.
                 </p>
                 <Button onClick={() => window.location.reload()} className="mt-6">
                    Tentar Novamente
                 </Button>
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
