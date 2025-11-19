
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { RequestStatus, RequestTicket } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Plus, Search, Filter, Link as LinkIcon, Image as ImageIcon, X } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

interface RequestListProps {
  onSelectRequest: (id: string) => void;
}

export const RequestList: React.FC<RequestListProps> = ({ onSelectRequest }) => {
  const { requests, units, addRequest } = useData();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProductUrl, setNewProductUrl] = useState('');
  const [newPriority, setNewPriority] = useState<'Low'|'Medium'|'High'>('Medium');
  const [newUnitId, setNewUnitId] = useState(currentUser?.unitId || '');
  
  // Image Upload State
  const [attachedImage, setAttachedImage] = useState<string | null>(null);

  const filteredRequests = requests.filter(r => {
    // Permission Filter
    let hasAccess = false;
    if (currentUser?.role === 'ADMIN') hasAccess = r.companyId === currentUser.companyId;
    else if (currentUser?.role === 'LEADER') hasAccess = r.unitId === currentUser.unitId;
    else hasAccess = r.creatorId === currentUser?.id;

    if (!hasAccess) return false;

    // Search Filter
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.includes(searchTerm);
    
    // Status Filter
    const matchesStatus = statusFilter === 'ALL' ? true : r.status === statusFilter;

    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const attachments = attachedImage ? [{
      id: `att${Date.now()}`,
      name: 'Imagem da Requisição',
      url: attachedImage,
      type: 'image'
    }] : [];

    addRequest({
      companyId: currentUser.companyId,
      unitId: newUnitId || units[0].id,
      creatorId: currentUser.id,
      title: newTitle,
      description: newDesc,
      productUrl: newProductUrl,
      status: RequestStatus.SENT,
      priority: newPriority,
      attachments: attachments
    });
    setIsModalOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewProductUrl('');
    setAttachedImage(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Requisições</h1>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Requisição
        </Button>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500"
            >
              <option value="ALL">Todos os Status</option>
              {Object.values(RequestStatus).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">ID / Título</th>
                <th className="px-6 py-3">Unidade</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Prioridade</th>
                <th className="px-6 py-3">Atualizado</th>
                <th className="px-6 py-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">Nenhuma requisição encontrada.</td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const unitName = units.find(u => u.id === req.unitId)?.name || 'N/A';
                  return (
                    <tr key={req.id} className="bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        <div className="flex flex-col">
                           <span className="text-xs text-gray-400">#{req.id}</span>
                           <span className="font-semibold">{req.title}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{unitName}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={req.priority} />
                      </td>
                      <td className="px-6 py-4">
                        {new Date(req.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" variant="secondary" onClick={() => onSelectRequest(req.id)}>
                          Ver
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Requisição">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
            <input required value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
          </div>
          
          {!currentUser?.unitId && (
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
               <select value={newUnitId} onChange={e => setNewUnitId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                 {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
               </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
            <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
               <option value="Low">Baixa</option>
               <option value="Medium">Média</option>
               <option value="High">Alta</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
            <textarea 
              required 
              rows={4} 
              value={newDesc} 
              onChange={e => setNewDesc(e.target.value)} 
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600"
              spellCheck={true}
              lang="pt-BR"
              placeholder="Descreva os detalhes da sua solicitação..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Link do Produto (Opcional)
            </label>
            <input 
              type="url"
              value={newProductUrl} 
              onChange={e => setNewProductUrl(e.target.value)} 
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-blue-600"
              placeholder="https://produto.mercadolivre.com.br/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Anexar Imagem
            </label>
            
            {!attachedImage ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <ImageIcon className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                  <p className="text-xs text-gray-500 dark:text-gray-400">Clique para enviar (JPG, PNG)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </label>
            ) : (
              <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img src={attachedImage} alt="Preview" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="mr-2">Cancelar</Button>
            <Button type="submit">Criar Ticket</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
