
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Database, CheckCircle2, AlertCircle, Save, Trash2, Code2, Server, Flame } from 'lucide-react';

export const AdminDatabase: React.FC = () => {
  const { 
    firebaseConfig, saveFirebaseConfig, 
    serverConfig, saveServerConfig,
    storageProvider, setStorageProvider,
    isDbConnected, isLoading 
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'FIREBASE' | 'SQLITE'>('FIREBASE');
  const [fbInput, setFbInput] = useState('');
  const [serverUrl, setServerUrl] = useState('');
  const [error, setError] = useState('');

  // Initial Load
  useEffect(() => {
    if (storageProvider === 'FIREBASE') setActiveTab('FIREBASE');
    if (storageProvider === 'SQLITE_SERVER') setActiveTab('SQLITE');
  }, [storageProvider]);

  useEffect(() => {
    if (firebaseConfig && !fbInput) {
      setFbInput(`const firebaseConfig = {
  apiKey: "${firebaseConfig.apiKey}",
  authDomain: "${firebaseConfig.authDomain}",
  projectId: "${firebaseConfig.projectId}",
  storageBucket: "${firebaseConfig.storageBucket}",
  messagingSenderId: "${firebaseConfig.messagingSenderId}",
  appId: "${firebaseConfig.appId}"
};`);
    }
    if (serverConfig && !serverUrl) {
      setServerUrl(serverConfig.serverUrl);
    }
  }, [firebaseConfig, serverConfig]);

  const extractValue = (input: string, key: string) => {
    const regex = new RegExp(`${key}["']?\\s*:\\s*["']([^"']+)["']`);
    const match = input.match(regex);
    return match ? match[1] : '';
  };

  const handleConnectFirebase = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const apiKey = extractValue(fbInput, 'apiKey');
      const authDomain = extractValue(fbInput, 'authDomain');
      const projectId = extractValue(fbInput, 'projectId');
      const storageBucket = extractValue(fbInput, 'storageBucket');
      const messagingSenderId = extractValue(fbInput, 'messagingSenderId');
      const appId = extractValue(fbInput, 'appId');
      const databaseURL = extractValue(fbInput, 'databaseURL');

      if (!apiKey || !projectId || !appId) {
        throw new Error("Configuração inválida. Verifique se copiou todo o objeto const firebaseConfig.");
      }

      saveFirebaseConfig({ apiKey, authDomain, databaseURL, projectId, storageBucket, messagingSenderId, appId });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConnectServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverUrl) {
      setError("A URL do servidor é obrigatória.");
      return;
    }
    saveServerConfig({ serverUrl });
  };

  const handleDisconnect = () => {
    if (confirm("Desconectar voltará o sistema para o modo LocalStorage. Continuar?")) {
      saveFirebaseConfig(null);
      saveServerConfig(null);
      setFbInput('');
      setServerUrl('');
    }
  };

  const isConnected = isDbConnected && storageProvider !== 'LOCAL';
  const providerName = storageProvider === 'FIREBASE' ? 'Firebase Cloud' : 'SQLite Server';

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          Banco de Dados
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Escolha onde os dados da aplicação serão armazenados.
        </p>
      </div>
      
      {/* Status Card */}
      <Card className={`${isConnected ? 'border-green-200 dark:border-green-900' : 'border-gray-200'}`}>
        <CardHeader className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 py-4">
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                    <Database className="h-6 w-6" />
                 </div>
                 <div>
                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white">
                      {isConnected ? `Conectado: ${providerName}` : 'Modo Local (Offline)'}
                    </h3>
                    <p className="text-sm">
                      {isLoading ? (
                        <span className="text-yellow-600">Tentando conectar...</span>
                      ) : isConnected ? (
                        <span className="text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Sincronização Ativa</span>
                      ) : (
                        <span className="text-gray-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Dados salvos apenas neste navegador</span>
                      )}
                    </p>
                 </div>
              </div>
              {isConnected && (
                <Button variant="danger" size="sm" onClick={handleDisconnect}>
                  <Trash2 className="h-4 w-4 mr-2" /> Desconectar
                </Button>
              )}
           </div>
        </CardHeader>
      </Card>

      {/* Configuration Tabs */}
      {!isConnected && (
        <div className="space-y-4">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('FIREBASE')}
              className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === 'FIREBASE' 
                  ? 'text-primary-600 border-b-2 border-primary-600' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <div className="flex items-center gap-2"><Flame className="h-4 w-4" /> Google Firebase</div>
            </button>
            <button
              onClick={() => setActiveTab('SQLITE')}
              className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
                activeTab === 'SQLITE' 
                  ? 'text-primary-600 border-b-2 border-primary-600' 
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              <div className="flex items-center gap-2"><Server className="h-4 w-4" /> SQLite Server</div>
            </button>
          </div>

          <Card>
            <CardContent className="pt-6">
              {activeTab === 'FIREBASE' ? (
                <form onSubmit={handleConnectFirebase} className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <Code2 className="h-4 w-4" /> Configuração SDK Firebase
                      </label>
                      <textarea
                          value={fbInput}
                          onChange={e => setFbInput(e.target.value)}
                          className="w-full h-48 p-4 font-mono text-sm rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                          placeholder={`const firebaseConfig = {\n  apiKey: "...",\n  projectId: "..."\n};`}
                          spellCheck={false}
                      />
                      <p className="mt-2 text-xs text-gray-500">Cole o objeto de configuração do Console do Firebase.</p>
                  </div>
                  {error && <div className="text-red-600 text-sm">{error}</div>}
                  <div className="flex justify-end"><Button type="submit"><Save className="h-4 w-4 mr-2" /> Conectar Firebase</Button></div>
                </form>
              ) : (
                <form onSubmit={handleConnectServer} className="space-y-6">
                   <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                     <p className="text-sm text-blue-800 dark:text-blue-300">
                       Para usar o SQLite em tempo real, você precisa rodar o servidor backend (Node.js) que gerencia o arquivo do banco de dados via WebSockets.
                     </p>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        URL do Servidor (WebSocket/API)
                      </label>
                      <input 
                        type="url" 
                        required
                        value={serverUrl}
                        onChange={e => setServerUrl(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                        placeholder="http://localhost:3000"
                      />
                   </div>
                   {error && <div className="text-red-600 text-sm">{error}</div>}
                   <div className="flex justify-end"><Button type="submit"><Save className="h-4 w-4 mr-2" /> Conectar Servidor</Button></div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
