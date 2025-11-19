import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const { companies } = useData();
  const [email, setEmail] = useState('admin@techcorp.com');
  const [password, setPassword] = useState('');

  // Use first company for login screen branding
  const company = companies[0];
  const companyName = company?.name || 'NexRequest';
  const companyLogoLetter = companyName.charAt(0).toUpperCase();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
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
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="seu@email.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="pass" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha</label>
                <input
                  type="password"
                  id="pass"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="********"
                  required
                />
              </div>
              <Button type="submit" className="w-full py-2.5" size="lg">
                Entrar
              </Button>
            </form>

            <div className="mt-6 text-xs text-gray-500 dark:text-gray-400 space-y-1 border-t pt-4 dark:border-gray-700">
              <p>Dica: Use estes emails (senha: 123):</p>
              <ul className="list-disc pl-4 space-y-1">
                <li><strong>Admin:</strong> admin@techcorp.com</li>
                <li><strong>Líder:</strong> roberto@techcorp.com</li>
                <li><strong>Usuário:</strong> ana@techcorp.com</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};