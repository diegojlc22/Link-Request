import React from 'react';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Database, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const AdminDatabase: React.FC = () => {
  const { isDbConnected } = useData();

  const env = (import.meta as any).env || {};
  
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          Status do Banco de Dados
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Monitoramento da conexão com o Google Firebase.
        </p>
      </div>
      
      <Card className={`${isDbConnected ? 'border-green-200 dark:border-green-900' : 'border-gray-200'}`}>
        <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${isDbConnected ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                    <Database className="h-6 w-6" />
                 </div>
                 <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Status da Conexão</h3>
                    <p className="text-sm flex items-center gap-2">
                      {isDbConnected ? (
                        <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Conectado ao Realtime Database</span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Usando Armazenamento Local (Offline)</span>
                      )}
                    </p>
                 </div>
              </div>
           </div>
        </CardHeader>
        <CardContent className="pt-6">
           {!isDbConnected ? (
             <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3">
                   <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                   <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-semibold mb-1">Configuração via Ambiente (.env)</p>
                      <p>Para conectar o banco de produção, você deve configurar as variáveis de ambiente no servidor de build.</p>
                      <p className="mt-2 font-mono text-xs bg-white/50 p-2 rounded">
                        VITE_FIREBASE_API_KEY=...<br/>
                        VITE_FIREBASE_DATABASE_URL=...
                      </p>
                   </div>
                </div>
             </div>
           ) : (
             <div className="text-center py-8 space-y-4">
               <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                 <CheckCircle2 className="h-8 w-8" />
               </div>
               <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sincronização Segura Ativa</h3>
               <p className="text-gray-500 max-w-md mx-auto">
                 O sistema está utilizando credenciais seguras injetadas via variáveis de ambiente.
               </p>
               <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-left font-mono text-xs text-gray-500 overflow-x-auto">
                 <p className="text-gray-400 mb-2">// Configuração Atual (ReadOnly)</p>
                 <p>Project ID: {env.VITE_FIREBASE_PROJECT_ID}</p>
                 <p>Database URL: {env.VITE_FIREBASE_DATABASE_URL}</p>
                 <p>Auth Domain: {env.VITE_FIREBASE_AUTH_DOMAIN}</p>
               </div>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
};