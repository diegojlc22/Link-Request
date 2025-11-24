
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AlertCircle, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { companies } = useData();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Use first company for login screen branding
  const company = companies[0];
  const companyName = company?.name || 'Link-Request';
  const companyLogoLetter = companyName.charAt(0).toUpperCase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoggingIn) return;
    
    setError('');
    setIsLoggingIn(true);
    
    // Basic Sanitization/Validation
    if (!email.includes('@') || password.length < 1) {
        setError('Formato de email inválido ou senha vazia.');
        setIsLoggingIn(false);
        return;
    }

    // Simulate network delay for security (prevent timing attacks / brute force visual feedback)
    setTimeout(() => {
        const success = login(email, password);
        if (!success) {
          setError('Credenciais inválidas! Verifique seu email e senha.');
          setIsLoggingIn(false);
        } else {
          // Successful login
          navigate('/');
        }
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
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
                  disabled={isLoggingIn}
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
                  disabled={isLoggingIn}
                />
              </div>
              <Button type="submit" className="w-full py-2.5" size="lg" disabled={isLoggingIn}>
                {isLoggingIn ? (
                    <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
                    </span>
                ) : 'Entrar'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
