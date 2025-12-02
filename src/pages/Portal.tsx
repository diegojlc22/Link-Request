
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Search, Building, ArrowRight, Globe, LayoutGrid } from 'lucide-react';
import { getTenant, tenants } from '../config/tenants';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-5xl flex flex-col items-center gap-8 py-10">
        
        {/* HEADER & MANUAL LOGIN */}
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-600/30">
              <LayoutGrid className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Portal do Cliente</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Identifique sua organização para acessar o sistema.</p>
          </div>

          <Card className="shadow-lg border-primary-100 dark:border-primary-900/20">
            <CardHeader>
              <CardTitle>Acesso Manual</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Slug da Empresa
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
                      placeholder="ex: demo, nike, apple"
                    />
                  </div>
                  {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                </div>

                <Button type="submit" className="w-full">
                  Entrar no Ambiente <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* LISTA DE EMPRESAS CADASTRADAS */}
        {tenants.length > 0 && (
          <div className="w-full animate-fade-in mt-4">
             <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                  Ambientes Disponíveis ({tenants.length})
                </span>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-700"></div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tenants.map((tenant) => (
                  <button
                    key={tenant.id}
                    onClick={() => onTenantSelect(tenant.slug)}
                    className="group relative flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                  >
                    <div className="h-12 w-12 rounded-lg bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                       <Building className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate group-hover:text-primary-600 transition-colors">
                        {tenant.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 font-mono">
                            {tenant.slug}
                         </span>
                         {tenant.slug === 'demo' && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                               Recomendado
                            </span>
                         )}
                      </div>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                        <ArrowRight className="h-5 w-5 text-primary-500" />
                    </div>
                  </button>
                ))}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};
