import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Plus, Trash2, MapPin } from 'lucide-react';

export const AdminUnits: React.FC = () => {
  const { units, addUnit, deleteUnit } = useData();
  const [newName, setNewName] = useState('');
  const [newLoc, setNewLoc] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addUnit({ companyId: 'c1', name: newName, location: newLoc });
    setNewName('');
    setNewLoc('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Unidades</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Unidades Cadastradas</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {units.map(unit => (
                <div key={unit.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{unit.name}</h3>
                      <p className="text-sm text-gray-500">{unit.location}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteUnit(unit.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit">
          <CardHeader><CardTitle>Adicionar Unidade</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Unidade</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" placeholder="Ex: Filial Sul" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Endereço/Local</label>
                <input required value={newLoc} onChange={e => setNewLoc(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" placeholder="Ex: Rua das Flores, 123" />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Cadastrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};