
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Search, Building, ArrowRight } from 'lucide-react';
import { getTenant } from '../config/tenants';

interface PortalProps {
  onTenantSelect: (slug: string) => void;
}

export const Portal: React.FC<PortalProps> = ({ onTenantSelect }) => {
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) return;

    const tenant = getTenant(slug);
    if (tenant) {
      onTenantSelect(slug);
    } else {
      setError('Empresa não encontrada. Verifique o identificador (slug) em tenants.ts.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-600/30">
            <Building className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portal do Cliente</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Identifique sua empresa para acessar o sistema.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Acesso Corporativo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Identificador da Empresa (Slug)
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    required
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setError('');
                    }}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border bg-white dark:bg-gray-800 focus:ring-2 focus:ring-primary-500 transition-colors ${
                      error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    placeholder="ex: nike, demo, empresa-a"
                  />
                </div>
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>

              <Button type="submit" className="w-full">
                Acessar <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <div className="text-center text-xs text-gray-500 mt-4">
                Dica: Digite <strong>demo</strong> para testar.
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
