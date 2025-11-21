
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { RequestStatus, RequestAttachment } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { ArrowLeft, Send, Paperclip, User as UserIcon, ExternalLink, ShoppingBag, Image as ImageIcon, X, Download, ZoomIn } from 'lucide-react';

export const RequestDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { requests, comments, users, units, addComment, updateRequestStatus } = useData();
  const { currentUser, isAdmin, isLeader } = useAuth();
  
  const request = requests.find(r => r.id === id);
  const requestComments = comments.filter(c => c.requestId === id);
  const [newComment, setNewComment] = useState('');
  
  // State for Image Lightbox
  const [viewingAttachment, setViewingAttachment] = useState<RequestAttachment | null>(null);
  
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [requestComments]);

  // Close lightbox on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewingAttachment(null);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

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
  
  const canManage = isAdmin || (isLeader && currentUser?.unitId === request.unitId);

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;
    if (id) {
        addComment(id, currentUser.id, newComment);
    }
    setNewComment('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <Button variant="ghost" onClick={() => navigate('/requests')} className="mb-4 pl-0 hover:bg-transparent hover:text-primary-600">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para a lista
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content: Ticket Info & Chat */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
             <CardHeader className="flex flex-row items-start justify-between">
               <div>
                 <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{request.title}</h1>
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
                 <p>{request.description}</p>
               </div>
               
               {/* Attachments Gallery */}
               {request.attachments && request.attachments.length > 0 && (
                 <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                   <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                     <ImageIcon className="h-4 w-4" /> Anexos
                   </h3>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {request.attachments.map(att => (
                       <div 
                         key={att.id} 
                         className="relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 cursor-pointer aspect-square bg-gray-100 dark:bg-gray-800"
                         onClick={() => setViewingAttachment(att)}
                       >
                         <img 
                           src={att.url} 
                           alt={att.name} 
                           className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                         />
                         {/* Hover Overlay */}
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <ZoomIn className="text-white h-8 w-8 drop-shadow-md" />
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
               )}
             </CardContent>
          </Card>

          {/* Chat Timeline */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-4">
            {requestComments.map((comment) => {
              const isMe = comment.userId === currentUser?.id;
              const author = users.find(u => u.id === comment.userId);
              return (
                <div key={comment.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                      <img src={author?.avatarUrl} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className={`p-4 rounded-2xl text-sm ${
                      isMe 
                        ? 'bg-primary-600 text-white rounded-br-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm rounded-bl-none'
                    }`}>
                      <p>{comment.content}</p>
                      <p className={`text-[10px] mt-1 opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={commentsEndRef} />
          </div>

          {/* Input Area */}
          <Card className="sticky bottom-4">
            <CardContent className="p-4">
              <form onSubmit={handleSendComment} className="flex flex-col gap-2">
                <div className="relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva uma resposta..."
                    className="w-full p-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500 resize-none h-24"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                     <button type="button" className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                       <Paperclip className="h-4 w-4" />
                     </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-xs text-gray-400">Pressione Enter para enviar (Shift+Enter para pular linha)</span>
                   <Button type="submit" disabled={!newComment.trim()}>
                     Enviar <Send className="h-3 w-3 ml-2" />
                   </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Meta Info & Actions */}
        <div className="space-y-6">
           <Card>
             <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
             <CardContent className="space-y-4 text-sm">
               <div>
                 <label className="text-gray-500 block mb-1">Unidade</label>
                 <div className="font-medium dark:text-white">{unit?.name}</div>
               </div>
               <div>
                 <label className="text-gray-500 block mb-1">Prioridade</label>
                 <PriorityBadge priority={request.priority} />
               </div>
               <div>
                 <label className="text-gray-500 block mb-1">Responsável</label>
                 <div className="flex items-center gap-2 mt-1">
                   <div className="h-6 w-6 rounded-full bg-gray-200 overflow-hidden">
                      <img src={users.find(u => u.id === request.assigneeId)?.avatarUrl || 'https://ui-avatars.com/api/?name=?'} alt="" />
                   </div>
                   <span className="dark:text-white">{users.find(u => u.id === request.assigneeId)?.name || 'Não atribuído'}</span>
                 </div>
               </div>

               {request.productUrl && (
                 <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                   <label className="text-gray-500 block mb-2 flex items-center gap-2">
                     <ShoppingBag className="h-4 w-4" /> Link do Produto
                   </label>
                   <a 
                     href={request.productUrl} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                   >
                     Acessar Link <ExternalLink className="h-3 w-3" />
                   </a>
                 </div>
               )}
             </CardContent>
           </Card>

           {canManage && request && (
             <Card>
               <CardHeader><CardTitle>Gerenciar</CardTitle></CardHeader>
               <CardContent className="space-y-3">
                 <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alterar Status</label>
                 <select 
                   value={request.status}
                   onChange={(e) => updateRequestStatus(request.id, e.target.value as RequestStatus)}
                   className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                 >
                   {Object.values(RequestStatus).map(s => (
                     <option key={s} value={s}>{s}</option>
                   ))}
                 </select>
               </CardContent>
             </Card>
           )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
          <button
            onClick={() => setViewingAttachment(null)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
            title="Fechar (Esc)"
          >
            <X className="h-8 w-8" />
          </button>

          <div className="relative flex flex-col items-center max-w-full max-h-full">
            <img
              src={viewingAttachment.url}
              alt={viewingAttachment.name}
              className="max-w-full max-h-[80vh] object-contain rounded-md shadow-2xl"
            />
            
            <div className="mt-6 flex items-center gap-4 bg-black/50 px-6 py-3 rounded-full backdrop-blur-md border border-white/10">
              <span className="text-white font-medium truncate max-w-[200px]">{viewingAttachment.name}</span>
              <div className="w-px h-4 bg-white/20"></div>
              <a
                href={viewingAttachment.url}
                download={viewingAttachment.name}
                className="flex items-center gap-2 text-primary-300 hover:text-primary-200 font-medium transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-4 w-4" />
                Baixar
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
