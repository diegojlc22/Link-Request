
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ShieldCheck, Building2, User, Rocket, Database, Info } from 'lucide-react';
import { FirebaseConfig } from '../types';

export const SetupPage: React.FC = () => {
  const { setupSystem } = useData();
  
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  // Firebase Config State
  const [firebaseJson, setFirebaseJson] = useState('');
  const [configError, setConfigError] = useState('');

  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    
    let parsedConfig: FirebaseConfig | undefined = undefined;

    if (firebaseJson.trim()) {
      try {
        // Tenta limpar o JSON se o usuário colou "const firebaseConfig = { ... }"
        let cleanJson = firebaseJson;
        if (cleanJson.includes('=')) {
          cleanJson = cleanJson.substring(cleanJson.indexOf('=') + 1);
        }
        if (cleanJson.trim().endsWith(';')) {
          cleanJson = cleanJson.trim().slice(0, -1);
        }
        
        // --- Lógica de Correção de JS para JSON ---
        // 1. Remove comentários de linha //
        cleanJson = cleanJson.replace(/\/\/.*$/gm, '');
        // 2. Remove comentários de bloco /* */
        cleanJson = cleanJson.replace(/\/\*[\s\S]*?\*\//g, '');
        
        // 3. Regex Segura: Corrige chaves sem aspas (ex: apiKey: "...") para JSON válido ("apiKey": "...")
        // Apenas substitui se a palavra for seguida de dois pontos e estiver no início da linha, ou após { ou ,
        // Isso evita quebrar URLs como "https://..." onde "https" é seguido de dois pontos mas não é uma chave
        cleanJson = cleanJson.replace(/(^|{|,)\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
        
        // 4. Troca aspas simples por duplas (caso o usuário tenha copiado JS com 'string')
        // Cuidado: isso é simplificado e pode falhar se houver aspas simples dentro do texto, 
        // mas cobre 99% dos casos de config padrão do Firebase.
        cleanJson = cleanJson.replace(/'/g, '"');

        // 5. Remove vírgulas sobrando no final de objetos (Trailing commas)
        cleanJson = cleanJson.replace(/,(\s*[}\]])/g, '$1');

        parsedConfig = JSON.parse(cleanJson);
        
        if (!parsedConfig?.apiKey || !parsedConfig?.databaseURL) {
           setConfigError('O JSON parece incompleto. Certifique-se de que "apiKey" e "databaseURL" estão presentes.');
           return;
        }

      } catch (err) {
        console.error(err);
        setConfigError('Erro ao ler a configuração. Certifique-se de colar o objeto de configuração correto.');
        return;
      }
    }

    setupSystem({
      companyName,
      adminName,
      adminEmail,
      adminPassword,
      firebaseConfig: parsedConfig
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-600/30">
            <Rocket className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instalação do Sistema</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Configuração rápida e simplificada.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 ? 'Dados da Empresa' : step === 2 ? 'Conta do Administrador' : 'Banco de Dados (Fácil)'}
            </CardTitle>
            <div className="flex gap-2 mt-2">
              <div className={`h-1 flex-1 rounded-full ${step >= 1 ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 2 ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 3 ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`} />
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
                     <Button type="button" className="flex-1" onClick={() => {
                        if(adminName && adminEmail && adminPassword) setStep(3);
                     }}>
                       Próximo
                     </Button>
                   </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                   <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300">
                     <p className="font-semibold mb-1 flex items-center gap-2">
                       <Database className="h-4 w-4" /> Configuração Fácil do Firebase
                     </p>
                     <p className="mb-2">Não é necessário editar arquivos. Apenas cole o código obtido no console do Firebase.</p>
                     <p className="text-xs opacity-80 mt-2 bg-white/50 dark:bg-black/20 p-2 rounded">
                        <strong>Dica:</strong> Copie o trecho <code>const firebaseConfig = &#123; ... &#125;;</code>
                     </p>
                   </div>

                   <div>
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Configuração (Cole aqui)</label>
                     <textarea 
                       value={firebaseJson} 
                       onChange={e => {
                         setFirebaseJson(e.target.value);
                         setConfigError('');
                       }} 
                       className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-800 font-mono text-xs h-32 ${configError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-primary-500'}`}
                       placeholder={`const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};`}
                     />
                     {configError && <p className="text-xs text-red-500 mt-1">{configError}</p>}
                   </div>
                   
                   <div className="flex gap-3 pt-4">
                     <Button type="button" variant="secondary" onClick={() => setStep(2)}>
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
        <p className="text-center text-xs text-gray-400 mt-8">
           O sistema salvará as configurações localmente no seu navegador.
        </p>
      </div>
    </div>
  );
};
