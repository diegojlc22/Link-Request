import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { AlertCircle, Database, Settings, CheckCircle2, Save, WifiOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { companies, isDbConnected, saveFirebaseConfig } = useData();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Config Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configInput, setConfigInput] = useState('');
  const [configError, setConfigError] = useState('');

  // Use first company for login screen branding
  const company = companies[0];
  const companyName = company?.name || 'Link-Request';
  const companyLogoLetter = companyName.charAt(0).toUpperCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Basic Sanitization/Validation
    if (!email.includes('@') || password.length < 1) {
        setError('Formato de email inválido ou senha vazia.');
        return;
    }

    const success = login(email, password);
    if (!success) {
      setError(isDbConnected 
        ? 'Credenciais inválidas! Verifique seu email e senha.' 
        : 'Usuário não encontrado. ATENÇÃO: Você está em MODO OFFLINE/LOCAL. Se você criou a conta em outro dispositivo, clique em "Configurar Conexão" abaixo.'
      );
    } else {
      // Successful login
      navigate('/');
    }
  };

  const extractValue = (input: string, key: string) => {
    try {
      const regex = new RegExp(`["']?${key}["']?\\s*:\\s*(["'])(.*?)\\1`);
      const match = input.match(regex);
      return match ? match[2] : '';
    } catch (e) {
      return '';
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfigError('');

    try {
      const apiKey = extractValue(configInput, 'apiKey');
      const authDomain = extractValue(configInput, 'authDomain');
      const projectId = extractValue(configInput, 'projectId');
      const storageBucket = extractValue(configInput, 'storageBucket');
      const messagingSenderId = extractValue(configInput, 'messagingSenderId');
      const appId = extractValue(configInput, 'appId');
      const databaseURL = extractValue(configInput, 'databaseURL');

      if (!apiKey || !projectId || !appId) {
        throw new Error("Configuração incompleta. Verifique se copiou todo o objeto firebaseConfig.");
      }

      if (!databaseURL) {
        throw new Error("O campo 'databaseURL' é obrigatório para sincronização.");
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
      setIsConfigOpen(false);
      alert("Conexão configurada! Tente logar agora.");
    } catch (err: any) {
      setConfigError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        {isDbConnected ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Online / Sincronizado
          </div>
        ) : (
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium hover:bg-gray-300 transition-colors dark:bg-gray-800 dark:text-gray-400"
          >
            <WifiOff className="h-3 w-3" />
            Offline / Local (Clique para conectar)
          </button>
        )}
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary-600 text-white text-2xl font-bold mb-4 shadow-lg shadow-primary-600/30">
            {companyLogoLetter}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{companyName}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Entre na sua conta corporativa</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acesso ao Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex items-start gap-2 animate-fade-in">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${error ? 'border-red-300 dark:border-red-700 animate-shake' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="seu@email.com"
                  required
                  maxLength={100}
                />
              </div>
              <div>
                <label htmlFor="pass" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                <input
                  type="password"
                  id="pass"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors ${error ? 'border-red-300 dark:border-red-700 animate-shake' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="********"
                  required
                  maxLength={50}
                />
              </div>
              <Button type="submit" className="w-full py-2.5" size="lg">
                Entrar
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
               <button 
                 onClick={() => setIsConfigOpen(true)}
                 className="w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
               >
                 <Settings className="h-4 w-4" />
                 Configurar Conexão com Banco de Dados
               </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Config Modal */}
      <Modal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} title="Conectar ao Servidor">
        <form onSubmit={handleSaveConfig} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            <p className="flex gap-2">
              <Database className="h-4 w-4 flex-shrink-0 mt-0.5" />
              Cole abaixo o objeto <code>firebaseConfig</code> do seu projeto para sincronizar os dados entre dispositivos.
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Código de Configuração</label>
            <textarea
                value={configInput}
                onChange={e => setConfigInput(e.target.value)}
                className="w-full h-40 p-3 font-mono text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary-500"
                placeholder={`const firebaseConfig = {\n  apiKey: "...",\n  databaseURL: "..."\n};`}
                spellCheck={false}
            />
          </div>

          {configError && (
             <div className="text-red-500 text-sm">{configError}</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setIsConfigOpen(false)}>Cancelar</Button>
            <Button type="submit">
               <Save className="h-4 w-4 mr-2" /> Salvar Conexão
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};