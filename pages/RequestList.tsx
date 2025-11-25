
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { RequestStatus, UserRole } from '../types';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { Plus, Search, Filter, Link as LinkIcon, Image as ImageIcon, X, User as UserIcon, Calendar, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Modal } from '../components/ui/Modal';

export const RequestList: React.FC = () => {
  const { requests, units, addRequest, users, bulkUpdateRequestStatus } = useData();
  const { currentUser, isAdmin, isLeader } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newProductUrl, setNewProductUrl] = useState('');
  const [newPriority, setNewPriority] = useState<'Low'|'Medium'|'High'>('Medium');
  const [newUnitId, setNewUnitId] = useState(currentUser?.unitId || '');
  
  // Attachment State (Multiple Images)
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);

  // Determine if user has permission to manage status
  const canManageStatus = isAdmin || isLeader;

  // --- PERFORMANCE: DEBOUNCE EFFECT ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- FILTERING LOGIC CORRECTION ---
  const filteredRequests = useMemo(() => {
    if (!currentUser || !requests) return [];

    // Normalize comparison values to Strings to avoid type mismatch issues
    const currentUserId = String(currentUser.id);
    const currentUserRole = String(currentUser.role);
    const currentUserCompany = String(currentUser.companyId || '');
    const currentUserUnit = String(currentUser.unitId || '');

    return requests.filter(req => {
      // 1. ACCESS CONTROL (Permissões de Visualização)
      let hasAccess = false;
      
      const reqCreator = String(req.creatorId || '');
      const reqCompany = String(req.companyId || '');
      const reqUnit = String(req.unitId || '');

      // Regra 1: O Criador SEMPRE vê sua requisição
      if (reqCreator === currentUserId) {
        hasAccess = true;
      }
      // Regra 2: Admin vê tudo da sua empresa
      else if ((currentUserRole === 'ADMIN' || currentUserRole === UserRole.ADMIN) && reqCompany === currentUserCompany) {
        hasAccess = true;
      }
      // Regra 3: Líder vê tudo da sua unidade
      else if ((currentUserRole === 'LEADER' || currentUserRole === UserRole.LEADER) && reqUnit === currentUserUnit) {
        hasAccess = true;
      }
      
      // Se não caiu em nenhuma regra, oculta
      if (!hasAccess) return false;

      // 2. VIEW FILTERS (Busca e Dropdowns)
      
      // Search Filter
      const term = debouncedSearchTerm.toLowerCase();
      if (term) {
        const matchesTitle = req.title?.toLowerCase().includes(term);
        const matchesId = req.id?.toLowerCase().includes(term);
        // Fallback safe check
        if (!matchesTitle && !matchesId) return false;
      }

      // Status Filter
      if (statusFilter !== 'ALL' && req.status !== statusFilter) {
        return false;
      }

      // Assignee Filter
      if (assigneeFilter !== 'ALL') {
        if (assigneeFilter === 'UNASSIGNED') {
          if (req.assigneeId) return false;
        } else {
          if (req.assigneeId !== assigneeFilter) return false;
        }
      }

      return true;
    });
  }, [requests, currentUser, debouncedSearchTerm, statusFilter, assigneeFilter]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [debouncedSearchTerm, statusFilter, assigneeFilter]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === currentItems.length && currentItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      const allCurrentIds = currentItems.map(r => r.id);
      setSelectedIds(new Set(allCurrentIds));
    }
  };

  const handleBulkStatusChange = (status: RequestStatus) => {
    if (selectedIds.size === 0) return;
    
    if (confirm(`Deseja alterar o status de ${selectedIds.size} requisições para "${status}"?`)) {
      bulkUpdateRequestStatus(Array.from(selectedIds), status);
      showToast(`${selectedIds.size} requisições atualizadas para ${status}`, 'success');
      setSelectedIds(new Set());
    }
  };

  // IMAGEM COMPRESSION LOGIC (Multi-file)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
          }

          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.onerror = (err) => reject(err);
        img.src = event.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (files.length + attachedImages.length > 5) {
      showToast('Você pode adicionar no máximo 5 imagens.', 'error');
      // Reset input
      e.target.value = '';
      return;
    }

    setIsCompressing(true);
    const validFiles = [];

    // Validation
    for (const file of files) {
       if (!file.type.startsWith('image/')) {
          showToast(`Arquivo ${file.name} ignorado: Apenas imagens são permitidas.`, 'error');
          continue;
       }
       const MAX_SIZE = 5 * 1024 * 1024;
       if (file.size > MAX_SIZE) {
          showToast(`Arquivo ${file.name} ignorado: Tamanho maior que 5MB.`, 'error');
          continue;
       }
       validFiles.push(file);
    }

    try {
      const compressedPromises = validFiles.map(file => compressImage(file));
      const newImages = await Promise.all(compressedPromises);
      
      setAttachedImages(prev => [...prev, ...newImages]);
      showToast(`${newImages.length} imagem(ns) adicionada(s)!`, 'info');
    } catch (error) {
      console.error("Compression error", error);
      showToast("Erro ao processar imagem.", 'error');
    } finally {
      setIsCompressing(false);
      // Reset input so same file can be selected again if needed
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Build Attachments Array
    const attachments = attachedImages.map((imgUrl, index) => ({
      id: `att${Date.now()}-${index}`,
      name: `Imagem ${index + 1}`,
      url: imgUrl,
      type: 'image'
    }));

    // Fallback: If no Unit is selected (e.g. Admin creating, though now disabled for Admin), pick the first one from DB
    const finalUnitId = newUnitId || (units.length > 0 ? units[0].id : '');
    
    // Determine Company ID: Use Current User's -> Unit's -> Fallback
    const selectedUnit = units.find(u => u.id === finalUnitId);
    const finalCompanyId = currentUser.companyId || selectedUnit?.companyId || (units.length > 0 ? units[0].companyId : 'c1');

    if (!finalUnitId) {
        showToast("Erro: É necessário selecionar uma unidade.", "error");
        return;
    }

    addRequest({
      companyId: finalCompanyId,
      unitId: finalUnitId,
      creatorId: currentUser.id,
      assigneeId: undefined, // Always undefined on creation
      title: newTitle,
      description: newDesc,
      productUrl: newProductUrl,
      status: RequestStatus.SENT,
      priority: newPriority,
      attachments: attachments
    });
    
    showToast('Requisição criada com sucesso!', 'success');
    setIsModalOpen(false);
    
    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewProductUrl('');
    setAttachedImages([]);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Requisições</h1>
        {!isAdmin && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Requisição
          </Button>
        )}
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

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-gray-500" />
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">Todos os Responsáveis</option>
                <option value="UNASSIGNED">Não Atribuído</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">Todos os Status</option>
                {Object.values(RequestStatus).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="p-4 w-4">
                  <div className="flex items-center">
                    <input 
                      id="checkbox-all" 
                      type="checkbox" 
                      className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      checked={currentItems.length > 0 && selectedIds.size === currentItems.length}
                      onChange={toggleSelectAll}
                    />
                    <label htmlFor="checkbox-all" className="sr-only">checkbox</label>
                  </div>
                </th>
                <th className="px-3 md:px-6 py-3">ID / Título</th>
                <th className="px-3 md:px-6 py-3 hidden md:table-cell">Unidade</th>
                <th className="px-3 md:px-6 py-3 hidden lg:table-cell">Responsável</th>
                <th className="px-3 md:px-6 py-3">Status</th>
                <th className="px-3 md:px-6 py-3 hidden md:table-cell">Prioridade</th>
                <th className="px-3 md:px-6 py-3 hidden xl:table-cell">Atualizado</th>
                <th className="px-3 md:px-6 py-3">Ação</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    {filteredRequests.length === 0 && requests.length > 0 
                      ? "Nenhum resultado para os filtros aplicados." 
                      : isAdmin 
                        ? "Nenhuma requisição encontrada."
                        : "Nenhuma requisição encontrada. Clique em 'Nova Requisição' para começar."}
                  </td>
                </tr>
              ) : (
                currentItems.map((req) => {
                  const unitName = units.find(u => u.id === req.unitId)?.name || 'N/A';
                  const assigneeName = users.find(u => u.id === req.assigneeId)?.name || '—';
                  const isSelected = selectedIds.has(req.id);

                  return (
                    <tr 
                      key={req.id} 
                      className={`
                        border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
                        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-gray-800'}
                      `}
                    >
                      <td className="w-4 p-4">
                        <div className="flex items-center">
                          <input 
                            id={`checkbox-${req.id}`} 
                            type="checkbox" 
                            className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 dark:focus:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            checked={isSelected}
                            onChange={() => toggleSelection(req.id)}
                          />
                          <label htmlFor={`checkbox-${req.id}`} className="sr-only">checkbox</label>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 font-medium text-gray-900 dark:text-white">
                        <div className="flex flex-col cursor-pointer" onClick={() => navigate(`/requests/${req.id}`)}>
                           <span className="text-xs text-gray-400">#{req.id}</span>
                           <span className="font-semibold truncate max-w-[150px] sm:max-w-[200px] hover:text-primary-600">{req.title}</span>
                           <span className="text-xs text-gray-500 md:hidden mt-1">{unitName}</span>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-4 hidden md:table-cell">{unitName}</td>
                      <td className="px-3 md:px-6 py-4 hidden lg:table-cell text-gray-900 dark:text-gray-300">{assigneeName}</td>
                      <td className="px-3 md:px-6 py-4">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-3 md:px-6 py-4 hidden md:table-cell">
                        <PriorityBadge priority={req.priority} />
                      </td>
                      <td className="px-3 md:px-6 py-4 hidden xl:table-cell">
                        {new Date(req.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-3 md:px-6 py-4">
                        <Button size="sm" variant="secondary" onClick={() => navigate(`/requests/${req.id}`)}>
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

        {filteredRequests.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} 
                disabled={currentPage === 1}
                variant="secondary"
                size="sm"
              >
                Anterior
              </Button>
              <Button 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} 
                disabled={currentPage === totalPages}
                variant="secondary"
                size="sm"
              >
                Próximo
              </Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-400">
                  Mostrando <span className="font-medium text-gray-900 dark:text-white">{indexOfFirstItem + 1}</span> até <span className="font-medium text-gray-900 dark:text-white">{Math.min(indexOfLastItem, filteredRequests.length)}</span> de <span className="font-medium text-gray-900 dark:text-white">{filteredRequests.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    if (
                      pageNum === 1 || 
                      pageNum === totalPages || 
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          aria-current={currentPage === pageNum ? 'page' : undefined}
                          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                            currentPage === pageNum
                              ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                              : 'text-gray-900 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    if (
                      (pageNum === currentPage - 2 && currentPage > 3) || 
                      (pageNum === currentPage + 2 && currentPage < totalPages - 2)
                    ) {
                      return (
                         <span key={pageNum} className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600">
                           ...
                         </span>
                      );
                    }
                    return null;
                  })}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Próximo</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </Card>
      
      {selectedIds.size > 0 && canManageStatus && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 z-40 animate-fade-in w-[90%] sm:w-auto">
          <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white border-r border-gray-200 dark:border-gray-700 pr-4">
             <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">{selectedIds.size}</span>
             <span>Selecionados</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 sm:pb-0">
             <span className="text-sm text-gray-500 whitespace-nowrap">Alterar para:</span>
             <div className="flex gap-2">
                <button 
                  onClick={() => handleBulkStatusChange(RequestStatus.IN_PROGRESS)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors whitespace-nowrap"
                >
                  Em Andamento
                </button>
                <button 
                   onClick={() => handleBulkStatusChange(RequestStatus.WAITING_CLIENT)}
                   className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors whitespace-nowrap"
                >
                   Aguard. Cliente
                </button>
                <button 
                   onClick={() => handleBulkStatusChange(RequestStatus.RESOLVED)}
                   className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors whitespace-nowrap"
                >
                   Resolvido
                </button>
             </div>
          </div>
          <button 
            onClick={() => setSelectedIds(new Set())} 
            className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
            title="Cancelar seleção"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Requisição">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
            <input required maxLength={100} value={newTitle} onChange={e => setNewTitle(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600" />
          </div>
          
          {!currentUser?.unitId && (
            <div>
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidade</label>
               <select value={newUnitId} onChange={e => setNewUnitId(e.target.value)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                 {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
               </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                 <Calendar className="h-3 w-3" /> Data de Criação
              </label>
              <input 
                type="text" 
                disabled 
                value={new Date().toLocaleString('pt-BR')} 
                className="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridade</label>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600">
                <option value="Low">Baixa</option>
                <option value="Medium">Média</option>
                <option value="High">Alta</option>
              </select>
            </div>
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
              maxLength={2000}
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Anexos (Máx: 5)
            </label>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              {attachedImages.map((img, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 group">
                   <img src={img} alt={`Anexo ${index + 1}`} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="p-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm"
                        title="Remover imagem"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                   </div>
                </div>
              ))}
              
              {attachedImages.length < 5 && (
                <label className={`flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 transition-colors ${isCompressing ? 'border-primary-500 opacity-70 cursor-wait' : 'border-gray-300 dark:border-gray-600'}`}>
                  <div className="flex flex-col items-center justify-center p-2 text-center">
                    {isCompressing ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6 mb-1 text-gray-500 dark:text-gray-400" />
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">Add Foto</span>
                      </>
                    )}
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isCompressing}
                    multiple
                  />
                </label>
              )}
            </div>
            
            <p className="text-xs text-gray-400 text-right">
              {attachedImages.length} de 5 imagens
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="mr-2">Cancelar</Button>
            <Button type="submit" disabled={isCompressing}>
              {isCompressing ? 'Processando...' : 'Criar Ticket'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
