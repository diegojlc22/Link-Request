
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Database, CheckCircle2, AlertCircle, Save, Trash2, Code2, Info } from 'lucide-react';

export const AdminDatabase: React.FC = () => {
  const { firebaseConfig, saveFirebaseConfig, isDbConnected, isLoading } = useData();
  
  const [configInput, setConfigInput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (firebaseConfig && !configInput) {
      // Format existing config for display
      const display = `const firebaseConfig = {
  apiKey: "${firebaseConfig.apiKey}",
  authDomain: "${firebaseConfig.authDomain}",
  databaseURL: "${firebaseConfig.databaseURL || ''}",
  projectId: "${firebaseConfig.projectId}",
  storageBucket: "${firebaseConfig.storageBucket}",
  messagingSenderId: "${firebaseConfig.messagingSenderId}",
  appId: "${firebaseConfig.appId}"
};`;
      setConfigInput(display);
    }
  }, [firebaseConfig]);

  const extractValue = (input: string, key: string) => {
    // Robust Regex to match key: "value", "key": "value", key: 'value'
    // Captures value inside quotes, handling both single and double quotes correctly
    try {
      // Explicação da Regex:
      // ["']? -> aspas opcionais no inicio da chave
      // ${key} -> nome da chave
      // ["']? -> aspas opcionais no fim da chave
      // \s*:\s* -> dois pontos com espaços opcionais
      // (["']) -> captura o tipo de aspas de abertura (grupo 1)
      // (.*?) -> captura o valor de forma não gulosa (grupo 2)
      // \1 -> garante que as aspas de fechamento sejam iguais às de abertura
      const regex = new RegExp(`["']?${key}["']?\\s*:\\s*(["'])(.*?)\\1`);
      const match = input.match(regex);
      return match ? match[2] : '';
    } catch (e) {
      return '';
    }
  };

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const apiKey = extractValue(configInput, 'apiKey');
      const authDomain = extractValue(configInput, 'authDomain');
      const projectId = extractValue(configInput, 'projectId');
      const storageBucket = extractValue(configInput, 'storageBucket');
      const messagingSenderId = extractValue(configInput, 'messagingSenderId');
      const appId = extractValue(configInput, 'appId');
      const databaseURL = extractValue(configInput, 'databaseURL');

      if (!apiKey || !projectId || !appId) {
        throw new Error("Não foi possível identificar as configurações essenciais (apiKey, projectId, appId). Verifique se o código está no formato correto.");
      }

      if (!databaseURL) {
        throw new Error("O campo 'databaseURL' não foi encontrado ou está vazio. Certifique-se de ter criado um Realtime Database no console do Firebase e copiado o código atualizado.");
      }

      saveFirebaseConfig({
        apiKey,
        authDomain,
        databaseURL,
        projectId,
        storageBucket,
        messagingSenderId,
        appId
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDisconnect = () => {
    if (confirm("Tem certeza? Isso voltará o sistema para o modo local e desconectará do Google Firebase.")) {
      saveFirebaseConfig(null);
      setConfigInput('');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          Configuração de Banco de Dados
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Conecte sua aplicação ao <strong>Google Firebase Realtime Database</strong> para persistência de dados em tempo real.
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
                      {isLoading ? (
                        <span className="text-yellow-600">Conectando...</span>
                      ) : isDbConnected ? (
                        <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Conectado ao Realtime Database</span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Usando Armazenamento Local</span>
                      )}
                    </p>
                 </div>
              </div>
              {isDbConnected && (
                <Button variant="danger" size="sm" onClick={handleDisconnect}>
                  <Trash2 className="h-4 w-4 mr-2" /> Desconectar
                </Button>
              )}
           </div>
        </CardHeader>
        <CardContent className="pt-6">
           {!isDbConnected ? (
             <form onSubmit={handleConnect} className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3">
                   <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                   <div className="text-sm text-blue-800 dark:text-blue-300">
                      <p className="font-semibold mb-1">Atenção: Selecione o banco correto!</p>
                      <p>O Firebase possui dois bancos. Certifique-se de criar um <strong>Realtime Database</strong> e não um "Cloud Firestore". O código de configuração deve conter o campo <code>databaseURL</code>.</p>
                   </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                       <Code2 className="h-4 w-4" />
                       Configuração Firebase
                    </label>
                    <div className="relative">
                        <textarea
                            value={configInput}
                            onChange={e => setConfigInput(e.target.value)}
                            className="w-full h-64 p-4 font-mono text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder={`// Cole o código do Firebase aqui\nconst firebaseConfig = {\n  apiKey: "AIzaSy...",\n  authDomain: "projeto.firebaseapp.com",\n  databaseURL: "https://projeto.firebaseio.com",\n  projectId: "projeto-id",\n  storageBucket: "projeto.appspot.com",\n  messagingSenderId: "...",\n  appId: "..."\n};`}
                            spellCheck={false}
                        />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                        Vá em <strong>Project Settings</strong> {'>'} <strong>General</strong> {'>'} Role até <strong>Your apps</strong> {'>'} Selecione <strong>Config</strong>.
                    </p>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="flex justify-end pt-2">
                  <Button type="submit" className="w-full md:w-auto">
                    <Save className="h-4 w-4 mr-2" /> Salvar e Conectar
                  </Button>
                </div>
             </form>
           ) : (
             <div className="text-center py-8 space-y-4">
               <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                 <CheckCircle2 className="h-8 w-8" />
               </div>
               <h3 className="text-lg font-medium text-gray-900 dark:text-white">Sincronização Ativa</h3>
               <p className="text-gray-500 max-w-md mx-auto">
                 Seu sistema está conectado via <strong>Realtime Database</strong>. As atualizações são recebidas instantaneamente.
               </p>
               {/* Exibir config atual mascarada */}
               <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-left font-mono text-xs text-gray-500 overflow-x-auto">
                 <p>ProjectId: {firebaseConfig?.projectId}</p>
                 <p>AuthDomain: {firebaseConfig?.authDomain}</p>
                 <p>DatabaseURL: {firebaseConfig?.databaseURL}</p>
               </div>
             </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
};
