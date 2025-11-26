import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Building, Save } from 'lucide-react';

export const AdminCompany: React.FC = () => {
  const { companies, updateCompany } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  // Assuming single tenant for this view, or finding the user's company
  const company = companies.find(c => c.id === currentUser?.companyId) || companies[0];

  const [name, setName] = useState(company?.name || '');

  useEffect(() => {
    if (company) {
      setName(company.name);
    }
  }, [company]);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (company) {
        updateCompany(company.id, { name });
        showToast('Identidade visual atualizada!', 'success');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações da Empresa</h1>
      
      {/* CARD 1: COMPANY INFO */}
      <Card>
        <CardHeader>
            <CardTitle>Identidade Visual</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-6 mb-8">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm text-gray-500">Logo Atual</span>
                    <div className="h-24 w-24 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg shadow-primary-600/30">
                        {name.charAt(0).toUpperCase()}
                    </div>
                </div>
                <div className="flex-1 text-sm text-gray-500 dark:text-gray-400">
                    <p>O logotipo é gerado automaticamente usando a inicial do nome da empresa.</p>
                    <p className="mt-1">Ele será exibido na tela de login e no menu lateral.</p>
                </div>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Empresa</label>
                    <div className="relative">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            required 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" 
                            placeholder="Ex: Link-Request SaaS" 
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <Button type="submit">
                        <Save className="h-4 w-4 mr-2" /> Salvar Nome
                    </Button>
                </div>
            </form>
        </CardContent>
      </Card>
    </div>
  );
};