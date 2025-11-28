import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Database, Download, AlertTriangle, CheckCircle2, Activity, ServerCrash, Trash2 } from 'lucide-react';
import { formatISO } from 'date-fns';

export const AdminDatabase: React.FC = () => {
  const { requests, users, comments, units, resetSystem } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  // Métricas de Capacidade (Baseado na arquitetura Client-Side)
  const LIMIT_WARNING = 3000;
  const LIMIT_CRITICAL = 8000;
  
  const totalDocs = requests.length + users.length + comments.length + units.length;
  const requestCount = requests.length;

  const getSystemHealth = () => {
    if (requestCount > LIMIT_CRITICAL) return { status: 'Crítico', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', icon: ServerCrash, msg: 'O sistema está sobrecarregado. Considere arquivar requisições antigas.' };
    if (requestCount > LIMIT_WARNING) return { status: 'Atenção', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', icon: AlertTriangle, msg: 'O volume de dados está alto. O carregamento inicial pode ficar lento.' };
    return { status: 'Saudável', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', icon: CheckCircle2, msg: 'O sistema está rodando com performance otimizada.' };
  };

  const health = getSystemHealth();
  const HealthIcon = health.icon;

  const downloadBackup = () => {
    const backupData = {
      exportedAt: formatISO(new Date()),
      stats: { requests: requests.length, users: users.length, comments: comments.length, units: units.length },
      data: {
        requests,
        units,
        users,
        comments // Note: comments might be partial due to limit in DataContext
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `link_request_backup_${formatISO(new Date()).slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (confirmationInput !== currentUser.password && confirmationInput.toLowerCase() !== 'confirmar') {
        showToast('Senha ou confirmação incorreta.', 'error');
        return;
    }

    setIsResetting(true);
    try {
        await resetSystem(currentUser.id);
        showToast('Sistema resetado com sucesso! Dados limpos.', 'success');
        setIsResetModalOpen(false);
        setConfirmationInput('');
    } catch (error: any) {
        showToast('Erro ao resetar sistema: ' + error.message, 'error');
    } finally {
        setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="h-6 w-6" /> Diagnóstico do Sistema
        </h1>
        <Button onClick={downloadBackup} variant="secondary">
            <Download className="h-4 w-4 mr-2" /> Backup JSON
        </Button>
      </div>

      {/* Health Status Banner */}
      <div className={`p-6 rounded-xl border ${health.bg} border-transparent flex items-start gap-4`}>
         <div className={`p-3 rounded-full bg-white dark:bg-gray-800 shadow-sm ${health.color}`}>
            <HealthIcon className="h-6 w-6" />
         </div>
         <div>
            <h3 className={`text-lg font-bold ${health.color}`}>Status: {health.status}</h3>
            <p className="text-gray-700 dark:text-gray-300 mt-1">{health.msg}</p>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statistics Card */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary-500" /> Volume de Dados
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Requisições</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">{requestCount}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Comentários</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">{comments.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Usuários Ativos</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">{users.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Unidades</span>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">{units.length}</span>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                         <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Uso da Capacidade Recomendada (Client-Side)</span>
                            <span>{Math.min(100, Math.round((requestCount / LIMIT_CRITICAL) * 100))}%</span>
                         </div>
                         <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                            <div 
                                className={`h-2.5 rounded-full ${requestCount > LIMIT_WARNING ? 'bg-amber-500' : 'bg-green-500'} ${requestCount > LIMIT_CRITICAL ? 'bg-red-600' : ''}`} 
                                style={{ width: `${Math.min(100, (requestCount / LIMIT_CRITICAL) * 100)}%` }}
                            ></div>
                         </div>
                         <p className="text-xs text-gray-400 mt-2 text-center">
                            Baseado no limite recomendado de {LIMIT_CRITICAL} requisições para performance fluida.
                         </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Maintenance Tips */}
        <Card>
            <CardHeader>
                <CardTitle>Dicas de Manutenção</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                <p>
                    Para manter o aplicativo rápido, siga estas recomendações:
                </p>
                <ul className="list-disc pl-4 space-y-2">
                    <li>
                        <strong>Imagens:</strong> Incentive os usuários a usar imagens leves. O sistema já usa compressão básica, mas uploads muito pesados afetam a abertura dos tickets.
                    </li>
                    <li>
                        <strong>Limpeza:</strong> Se o sistema atingir o status "Atenção", considere exportar o Backup JSON e excluir requisições muito antigas (Status "Cancelado" ou "Resolvido") manualmente.
                    </li>
                    <li>
                        <strong>Backup:</strong> Faça o download do backup JSON semanalmente para garantir a segurança dos seus dados.
                    </li>
                </ul>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-800 dark:text-blue-300 text-xs">
                    <strong>Nota Técnica:</strong> Este aplicativo utiliza arquitetura SPA com sincronização em tempo real. Isso garante velocidade instantânea de navegação, mas consome mais memória do dispositivo conforme o banco de dados cresce.
                </div>
            </CardContent>
        </Card>
      </div>

      {/* DANGER ZONE */}
      <div className="mt-6 border border-red-200 dark:border-red-900 rounded-xl overflow-hidden shadow-lg">
          <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-200 dark:border-red-900 flex items-center gap-3">
             <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
             <div>
                 <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Zona de Perigo</h3>
                 <p className="text-xs text-red-600 dark:text-red-400">Ações irreversíveis que afetam todo o sistema.</p>
             </div>
          </div>
          <div className="p-6 bg-white dark:bg-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
             <div>
                 <h4 className="font-bold text-gray-900 dark:text-white">Resetar Banco de Dados</h4>
                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Esta ação irá <strong>apagar permanentemente</strong> todas as requisições, comentários, unidades e usuários (exceto você).
                    <br/>
                    Use isto apenas para reiniciar o sistema do zero.
                 </p>
             </div>
             <Button 
                variant="danger" 
                onClick={() => setIsResetModalOpen(true)}
                className="whitespace-nowrap flex items-center"
             >
                <Trash2 className="h-4 w-4 mr-2" /> Resetar Sistema
             </Button>
          </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Confirmar Reset do Sistema"
      >
        <form onSubmit={handleReset} className="space-y-6">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-bold mb-1">Você tem certeza absoluta?</p>
                    <p>Todos os dados serão perdidos. O único dado preservado será o seu usuário Admin e a empresa principal.</p>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Digite sua senha de admin ou escreva "confirmar"
                </label>
                <input 
                    type="password"
                    required
                    value={confirmationInput}
                    onChange={(e) => setConfirmationInput(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="Sua senha ou 'confirmar'"
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={() => setIsResetModalOpen(false)}>Cancelar</Button>
                <Button type="submit" variant="danger" disabled={!confirmationInput || isResetting}>
                    {isResetting ? 'Apagando...' : 'Confirmar e Resetar'}
                </Button>
            </div>
        </form>
      </Modal>

    </div>
  );
};