import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircle, CheckCircle2, WifiOff } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { companies, isDbConnected } = useData();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

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
        : 'Usuário não encontrado. (Modo Local: Use as contas padrão ou configure o .env)'
      );
    } else {
      // Successful login
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        {isDbConnected ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-medium dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Sincronizado
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-600 rounded-full text-xs font-medium dark:bg-gray-800 dark:text-gray-400 cursor-help" title="Configure o arquivo .env para conectar">
            <WifiOff className="h-3 w-3" />
            Modo Local / Demo
          </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};