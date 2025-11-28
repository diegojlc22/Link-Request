import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { RequestStatus, RequestAttachment, UserRole } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { ArrowLeft, Send, Paperclip, User as UserIcon, ExternalLink, ShoppingBag, Download, ZoomIn, FileText, X, Edit2, Save, ChevronLeft, ChevronRight, Info, Loader2, Lock, ShieldAlert, Eye, EyeOff } from 'lucide-react';

// Sub-component for handling image lazy loading and state
const AttachmentThumbnail: React.FC<{ 
  att: RequestAttachment; 
  onClick: () => void; 
  isImage: (url: string) => boolean; 
}> = ({ att, onClick, isImage }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isImg = isImage(att.url);

  useEffect(() => {
    if (!isImg) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Load when image is 100px away from viewport
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isImg]);

  if (!isImg) {
    return (
         <a 
           href={att.url} 
           target="_blank" 
           rel="noopener noreferrer"
           className="w-full h-full flex flex-col items-center justify-center p-4 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-center"
         >
           <FileText className="h-10 w-10 text-gray-400 mb-2" />
           <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-full">
             {att.name}
           </span>
         </a>
    );
  }

  return (
     <div 
       ref={containerRef}
       className="w-full h-full cursor-pointer relative bg-gray-100 dark:bg-gray-800"
       onClick={onClick}
     >
       {/* Placeholder / Loader */}
       {(!shouldLoad || !isLoaded) && (
         <div className="absolute inset-0 flex items-center justify-center z-0 bg-gray-100 dark:bg-gray-800">
            <Loader2 className="h-6 w-6 text-gray-300 animate-spin" />
         </div>
       )}
       
       {shouldLoad && (
         <img 
           src={att.url} 
           alt={att.name} 
           className={`w-full h-full object-cover transition-opacity duration-500 relative z-10 ${isLoaded ? 'opacity-100' : 'opacity-0'} group-hover:scale-110`}
           loading="lazy"
           decoding="async"
           onLoad={() => setIsLoaded(true)}
         />
       )}

       <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 z-20">
          <ZoomIn className="text-white h-8 w-8 drop-shadow-md" />
       </div>
     </div>
  );
};

export const RequestDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, comments, users, units, addComment, updateRequestStatus, updateRequest } = useData();
  const { currentUser, isAdmin, isLeader } = useAuth();
  const { showToast } = useToast();
  
  const request = requests.find(r => r.id === id);
  
  // OPTIMIZATION: Memoize and sort comments to prevent unnecessary re-renders and ensure chronological order
  const requestComments = useMemo(() => {
    if (!id) return [];
    return comments
      .filter(c => c.requestId === id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [comments, id]);

  const [newComment, setNewComment] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  
  // State for Image Lightbox
  const [viewingAttachment, setViewingAttachment] = useState<RequestAttachment | null>(null);
  
  // State for Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<'Low'|'Medium'|'High'|'Critical'>('Low');
  const [editUrl, setEditUrl] = useState('');

  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when comments change
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [requestComments]);

  // Helper to check if attachment is an image
  const isImage = useCallback((url: string) => {
    return url.startsWith('data:image') || url.match(/\.(jpeg|jpg|gif|png|webp)$/i) != null;
  }, []);

  // Filter only images for the lightbox navigation
  const imageAttachments = useMemo(() => {
    return request?.attachments?.filter(att => isImage(att.url)) || [];
  }, [request, isImage]);

  // Lightbox Navigation Logic
  const handleNextImage = useCallback(() => {
    if (!viewingAttachment || imageAttachments.length <= 1) return;
    const currentIndex = imageAttachments.findIndex(img => img.id === viewingAttachment.id);
    const nextIndex = (currentIndex + 1) % imageAttachments.length;
    setViewingAttachment(imageAttachments[nextIndex]);
  }, [viewingAttachment, imageAttachments]);

  const handlePrevImage = useCallback(() => {
    if (!viewingAttachment || imageAttachments.length <= 1) return;
    const currentIndex = imageAttachments.findIndex(img => img.id === viewingAttachment.id);
    const prevIndex = (currentIndex - 1 + imageAttachments.length) % imageAttachments.length;
    setViewingAttachment(imageAttachments[prevIndex]);
  }, [viewingAttachment, imageAttachments]);

  // Calculate approx size from base64
  const getFileSize = (url: string) => {
    if (url.startsWith('data:')) {
      const base64Length = url.length - (url.indexOf(',') + 1);
      const padding = (url.charAt(url.length - 1) === '=') ? (url.charAt(url.length - 2) === '=' ? 2 : 1) : 0;
      const sizeInBytes = (base64Length * 0.75) - padding;
      
      if (sizeInBytes > 1024 * 1024) return (sizeInBytes / (1024 * 1024)).toFixed(2) + ' MB';
      return (sizeInBytes / 1024).toFixed(1) + ' KB';
    }
    return 'N/A';
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewingAttachment) {
        if (e.key === 'Escape') setViewingAttachment(null);
        if (e.key === 'ArrowRight') handleNextImage();
        if (e.key === 'ArrowLeft') handlePrevImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingAttachment, handleNextImage, handlePrevImage]);

  if (!request) return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold text-gray-700 dark:text-white">Requisição não encontrada</h2>
      <Button variant="ghost" onClick={() => navigate('/requests')} className="mt-4">
        Voltar para lista
      </Button>
    </div>
  );

  const creator = users.find(u => u.id === request.creatorId);
  const unit = units.find(u => u.id === request.unitId);
  
  const canManageStatus = isAdmin || (isLeader && currentUser?.unitId === request.unitId);
  const canSeeInternal = isAdmin || isLeader;
  const isCreator = currentUser?.id === request.creatorId;
  
  const isResolvedOrCancelled = [RequestStatus.RESOLVED, RequestStatus.CANCELLED].includes(request.status);
  const canEditContent = (isAdmin || isLeader || isCreator) && !isResolvedOrCancelled;

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    if (id) {
        addComment(id, currentUser.id, newComment, isInternalComment);
    }
    setNewComment('');
    setIsInternalComment(false);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as RequestStatus;
    if(request) {
        updateRequestStatus(request.id, newStatus);
        showToast(`Status atualizado para: ${newStatus}`, 'success');
    }
  };

  const startEditing = () => {
    if (request && canEditContent) {
      setEditTitle(request.title);
      setEditDesc(request.description);
      setEditPriority(request.priority);
      setEditUrl(request.productUrl || '');
      setIsEditing(true);
    } else {
      showToast('Esta requisição não pode ser editada no momento.', 'error');
    }
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim() || !editDesc.trim()) {
        showToast('Título e descrição são obrigatórios.', 'error');
        return;
    }
    
    if (isResolvedOrCancelled) {
        showToast('Não é possível editar requisições finalizadas ou canceladas.', 'error');
        setIsEditing(false);
        return;
    }

    if (editUrl && !editUrl.match(/^https?:\/\/.+/)) {
        showToast('O link do produto deve começar com http:// ou https://', 'error');
        return;
    }

    if (request) {
        updateRequest(request.id, {
            title: editTitle,
            description: editDesc,
            priority: editPriority,
            productUrl: editUrl
        });
        setIsEditing(false);
        showToast('Requisição atualizada com sucesso!', 'success');
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={() => navigate('/requests')} className="pl-0 hover:bg-transparent hover:text-primary-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para a lista
        </Button>
        {isEditing && (
            <div className="flex gap-2">
                <Button variant="ghost" onClick={handleCancelEdit} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                    <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
                <Button onClick={handleSaveEdit}>
                    <Save className="h-4 w-4 mr-2" /> Salvar
                </Button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Ticket Info & Chat */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={`${isEditing ? 'ring-2 ring-primary-500' : ''} transition-shadow`}>
             <CardHeader className="flex flex-row items-start justify-between">
               <div className="flex-1 mr-4">
                 {isEditing ? (
                    <div className="mb-2">
                        <label className="block text-xs text-gray-400 mb-1">Título</label>
                        <input 
                            type="text" 
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="w-full text-xl font-bold p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                    </div>
                 ) : (
                    <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{request.title}</h1>
                        {canEditContent && (
                            <button 
                                onClick={startEditing} 
                                className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
                                title="Editar Requisição"
                            >
                                <Edit2 className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                 )}
                 
                 <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                   <UserIcon className="h-4 w-4" />
                   <span>{creator?.name}</span>
                   <span>•</span>
                   <span>{new Date(request.createdAt).toLocaleDateString()} às {new Date(request.createdAt).toLocaleTimeString()}</span>
                 </div>
               </div>
               <StatusBadge status={request.status} />
             </CardHeader>
             <CardContent className="border-b border-gray-100 dark:border-gray-700">
               <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                 {isEditing ? (
                    <div>
                         <label className="block text-xs text-gray-400 mb-1">Descrição</label>
                         <textarea 
                            rows={6}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                         />
                    </div>
                 ) : (
                    <p className="whitespace-pre-wrap">{request.description}</p>
                 )}
               </div>
               
               {/* Attachments Gallery */}
               {request.attachments && request.attachments.length > 0 && (
                 <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                   <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                     <Paperclip className="h-4 w-4" /> Anexos
                   </h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {request.attachments.map(att => (
                       <div 
                         key={att.id} 
                         className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 aspect-[4/3]"
                       >
                         <AttachmentThumbnail 
                           att={att} 
                           onClick={() => setViewingAttachment(att)} 
                           isImage={isImage}
                         />
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </CardContent>
          </Card>

          {/* Chat Timeline */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Histórico de Mensagens</h3>
            
            <div className="space-y-6">
                {requestComments.map((comment) => {
                  // Internal Message Logic
                  if (comment.isInternal && !canSeeInternal) return null;

                  const isMe = comment.userId === currentUser?.id;
                  const author = users.find(u => u.id === comment.userId);
                  const isInternal = comment.isInternal;
                  const isAdminUser = author?.role === UserRole.ADMIN;
                  const isLeaderUser = author?.role === UserRole.LEADER;
                  
                  return (
                    <div key={comment.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
                      <div className={`flex max-w-[90%] md:max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                        
                        {/* Avatar Column */}
                        <div className="flex-shrink-0 flex flex-col items-center gap-1">
                            <div className={`h-10 w-10 rounded-full bg-white border-2 flex-shrink-0 overflow-hidden shadow-sm z-10
                                ${isInternal ? 'border-amber-400 ring-2 ring-amber-100 dark:ring-amber-900' : isMe ? 'border-primary-200' : 'border-gray-200 dark:border-gray-700'}
                            `}>
                                <img src={author?.avatarUrl} alt="" className="h-full w-full object-cover" />
                            </div>
                        </div>

                        {/* Message Content */}
                        <div className="flex flex-col gap-1 min-w-0">
                            {/* Author Name and Badge */}
                            <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                                    {author?.name || 'Usuário Desconhecido'}
                                </span>
                                {(isAdminUser || isLeaderUser) && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border ${isAdminUser ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'}`}>
                                        {isAdminUser ? 'ADMIN' : 'LÍDER'}
                                    </span>
                                )}
                                {isInternal && (
                                    <span className="flex items-center gap-0.5 text-[10px] bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-medium dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                                        <Lock className="h-3 w-3" /> INTERNO
                                    </span>
                                )}
                            </div>

                            {/* Bubble */}
                            <div className={`
                                relative p-3 rounded-2xl shadow-sm text-sm break-words
                                ${isInternal 
                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100 border border-amber-100 dark:border-amber-800 rounded-tl-none' 
                                    : isMe 
                                        ? 'bg-primary-600 text-white rounded-tr-none' 
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-tl-none'
                                }
                            `}>
                                {comment.content}
                            </div>
                            
                            {/* Timestamp */}
                            <span className={`text-[10px] text-gray-400 ${isMe ? 'text-right' : 'text-left'}`}>
                                {new Date(comment.createdAt).toLocaleDateString()} {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={commentsEndRef} />
            </div>

            {/* Input Area */}
            {canEditContent ? (
                <div className="mt-4">
                    {/* Internal Toggle for Admins/Leaders */}
                    {canSeeInternal && (
                        <div className="flex justify-end mb-2">
                            <label className={`
                                inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all select-none border
                                ${isInternalComment 
                                    ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700' 
                                    : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                                }
                            `}>
                                <input 
                                    type="checkbox" 
                                    className="hidden"
                                    checked={isInternalComment}
                                    onChange={(e) => setIsInternalComment(e.target.checked)}
                                />
                                {isInternalComment ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                {isInternalComment ? 'Nota Interna (Privada)' : 'Mensagem Pública'}
                            </label>
                        </div>
                    )}

                    <form onSubmit={handleSendComment} className={`relative flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-xl border-2 transition-colors shadow-sm focus-within:ring-2 focus-within:ring-primary-500/20 ${isInternalComment ? 'border-amber-300 dark:border-amber-700' : 'border-gray-100 dark:border-gray-700'}`}>
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={isInternalComment ? "Escrever nota interna (visível apenas para admins/líderes)..." : "Escreva uma resposta..."}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-2 py-1"
                      />
                      <Button type="submit" size="sm" disabled={!newComment.trim()} className={isInternalComment ? 'bg-amber-600 hover:bg-amber-700' : ''}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                    {isInternalComment && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 pl-2 flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Esta mensagem não será visível para o solicitante (User).
                        </p>
                    )}
                </div>
            ) : (
                <div className="text-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-500">
                    O chat está encerrado para esta requisição.
                </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Prioridade</span>
                  <div className="mt-1">
                    {isEditing ? (
                        <select 
                            value={editPriority} 
                            onChange={(e: any) => setEditPriority(e.target.value)}
                            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                        >
                            <option value="Low">Baixa</option>
                            <option value="Medium">Média</option>
                            <option value="High">Alta</option>
                            <option value="Critical">Crítica</option>
                        </select>
                    ) : (
                        <PriorityBadge priority={request.priority} />
                    )}
                  </div>
               </div>

               <div>
                  <span className="text-xs text-gray-500 uppercase font-semibold">Unidade</span>
                  <div className="mt-1 text-sm font-medium">{unit?.name}</div>
                  <div className="text-xs text-gray-400">{unit?.location}</div>
               </div>

               {/* Product Link Field */}
               {(request.productUrl || isEditing) && (
                   <div>
                      <span className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1">
                          <ShoppingBag className="h-3 w-3" /> Produto Relacionado
                      </span>
                      <div className="mt-1">
                        {isEditing ? (
                             <input 
                                type="url" 
                                value={editUrl}
                                onChange={(e) => setEditUrl(e.target.value)}
                                className="w-full text-sm p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                                placeholder="https://..."
                             />
                        ) : request.productUrl ? (
                            <a 
                                href={request.productUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-primary-600 hover:underline flex items-center gap-1 break-all"
                            >
                                <ExternalLink className="h-3 w-3" /> {request.productUrl}
                            </a>
                        ) : null}
                      </div>
                   </div>
               )}

               {/* Admin Actions */}
               {canManageStatus && (
                 <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                   <label className="text-xs text-gray-500 uppercase font-semibold mb-2 block">Alterar Status</label>
                   <select 
                     value={request.status}
                     onChange={handleStatusChange}
                     className="w-full text-sm p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-primary-500"
                   >
                     {Object.values(RequestStatus).map(status => (
                       <option key={status} value={status}>{status}</option>
                     ))}
                   </select>
                 </div>
               )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
             <CardContent className="p-4 flex gap-3">
                 <Info className="h-5 w-5 text-blue-500 flex-shrink-0" />
                 <div className="text-xs text-blue-700 dark:text-blue-300">
                    <p className="font-semibold mb-1">Dica Rápida</p>
                    <p>Mantenha as conversas focadas. Para assuntos não relacionados a este ticket, abra uma nova requisição.</p>
                 </div>
             </CardContent>
          </Card>
        </div>
      </div>

      {/* Lightbox Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col animate-fade-in" onClick={() => setViewingAttachment(null)}>
           {/* Toolbar */}
           <div className="flex justify-between items-center p-4 text-white bg-black/50" onClick={e => e.stopPropagation()}>
              <div className="flex flex-col">
                  <span className="font-medium text-sm">{viewingAttachment.name}</span>
                  <span className="text-xs text-gray-400">{getFileSize(viewingAttachment.url)}</span>
              </div>
              <div className="flex items-center gap-4">
                  <a href={viewingAttachment.url} download={viewingAttachment.name} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Baixar">
                     <Download className="h-5 w-5" />
                  </a>
                  <button onClick={() => setViewingAttachment(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                     <X className="h-6 w-6" />
                  </button>
              </div>
           </div>

           {/* Image Container */}
           <div className="flex-1 flex items-center justify-center relative p-4 overflow-hidden">
               {/* Nav Buttons */}
               {imageAttachments.length > 1 && (
                   <>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                         className="absolute left-4 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
                       >
                           <ChevronLeft className="h-6 w-6" />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                         className="absolute right-4 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-colors z-10"
                       >
                           <ChevronRight className="h-6 w-6" />
                       </button>
                   </>
               )}

               <img 
                 src={viewingAttachment.url} 
                 alt={viewingAttachment.name} 
                 className="max-h-full max-w-full object-contain shadow-2xl"
                 onClick={e => e.stopPropagation()}
               />
           </div>
           
           {/* Thumbnails Strip */}
           {imageAttachments.length > 1 && (
               <div className="h-20 bg-black/80 flex items-center justify-center gap-2 p-2 overflow-x-auto" onClick={e => e.stopPropagation()}>
                   {imageAttachments.map(img => (
                       <button 
                         key={img.id}
                         onClick={() => setViewingAttachment(img)}
                         className={`h-14 w-14 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 ${viewingAttachment.id === img.id ? 'border-primary-500 scale-110 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}
                       >
                           <img src={img.url} className="w-full h-full object-cover" alt="" />
                       </button>
                   ))}
               </div>
           )}
        </div>
      )}
    </div>
  );
};