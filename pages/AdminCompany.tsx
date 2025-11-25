
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Building, Save, Cloud, Loader2, CheckCircle2, AlertTriangle, XCircle, HelpCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export const AdminCompany: React.FC = () => {
  const { companies, updateCompany } = useData();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  
  // Assuming single tenant for this view, or finding the user's company
  const company = companies.find(c => c.id === currentUser?.companyId) || companies[0];

  const [name, setName] = useState(company?.name || '');

  // Storage Config State (Cloudinary)
  const [storageConfig, setStorageConfig] = useState({
    cloudName: '',
    uploadPreset: ''
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'idle' | 'success' | 'error'>('idle');
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (company) {
      setName(company.name);
    }
    
    // Load storage config
    try {
      const stored = localStorage.getItem('link_req_storage_config');
      if (stored) {
        setStorageConfig(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, [company]);

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (company) {
        updateCompany(company.id, { name });
        showToast('Identidade visual atualizada!', 'success');
    }
  };

  const handleSaveStorage = (e: React.FormEvent) => {
    e.preventDefault();
    if (storageConfig.cloudName && storageConfig.uploadPreset) {
      localStorage.setItem('link_req_storage_config', JSON.stringify(storageConfig));
      showToast('Configuração de armazenamento salva!', 'success');
      setTestResult('idle'); // Reset test result on save
    } else {
      localStorage.removeItem('link_req_storage_config');
      showToast('Configuração de armazenamento removida (Modo Local).', 'info');
      setTestResult('idle');
    }
  };

  const handleTestStorage = async () => {
    if (!storageConfig.cloudName || !storageConfig.uploadPreset) {
        showToast('Preencha os campos Cloud Name e Upload Preset antes de testar.', 'warning');
        return;
    }

    setIsTesting(true);
    setTestResult('idle');
    
    try {
        const formData = new FormData();
        // Tiny 1x1 transparent GIF base64
        formData.append("file", "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7");
        formData.append("upload_preset", storageConfig.uploadPreset);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${storageConfig.cloudName}/image/upload`, 
            { method: "POST", body: formData }
        );
        
        const data = await response.json();
        
        if (response.ok && data.secure_url) {
            setTestResult('success');
            showToast('Conexão com Cloudinary realizada com sucesso! ✅', 'success');
        } else {
            console.error("Cloudinary Error:", data);
            setTestResult('error');
            
            // Helpful error messages based on common mistakes
            let msg = 'Erro na conexão.';
            if (data.error?.message?.includes('preset')) msg = 'O nome do Preset está incorreto ou não é "Unsigned".';
            if (data.error?.message?.includes('cloud_name')) msg = 'O Cloud Name não foi encontrado.';
            
            showToast(msg, 'error');
        }
    } catch (error) {
         console.error(error);
         setTestResult('error');
         showToast('Erro de rede ao conectar com Cloudinary.', 'error');
    } finally {
        setIsTesting(false);
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

      {/* CARD 2: STORAGE CONFIG */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/10">
             <div className="flex items-center justify-between">
                 <CardTitle className="flex items-center gap-2">
                    <Cloud className="h-5 w-5 text-blue-500" /> Armazenamento de Imagens
                 </CardTitle>
                 <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowTutorial(!showTutorial)}
                    className="text-primary-600"
                 >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    {showTutorial ? 'Esconder Ajuda' : 'Como Configurar?'}
                 </Button>
             </div>
        </CardHeader>

        {showTutorial && (
            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 border-b border-blue-100 dark:border-blue-800 animate-fade-in text-sm text-gray-700 dark:text-gray-300 space-y-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Passo a Passo Rápido (Cloudinary)
                </h4>
                <ol className="list-decimal list-inside space-y-3 ml-2">
                    <li>
                        Crie uma conta grátis no <a href="https://cloudinary.com/users/register/free" target="_blank" className="text-blue-600 hover:underline font-medium inline-flex items-center">Cloudinary <ExternalLink className="h-3 w-3 ml-1"/></a>.
                    </li>
                    <li>
                        No <strong>Dashboard</strong>, copie o valor do <strong>"Cloud Name"</strong> e cole no campo abaixo.
                    </li>
                    <li>
                        Vá em <strong>Settings (Engrenagem)</strong> &rarr; <strong>Upload</strong>.
                    </li>
                    <li>
                        Role até "Upload presets" e clique em <strong>"Add upload preset"</strong>.
                    </li>
                    <li>
                        Em <strong>"Signing Mode"</strong>, mude para <strong className="text-red-600 dark:text-red-400">"Unsigned"</strong> (Isso é crucial!).
                    </li>
                    <li>
                        Copie o nome gerado (ex: <code>ml_default</code>) e cole no campo <strong>Upload Preset</strong> abaixo.
                    </li>
                    <li>
                        Clique em Salvar no Cloudinary e Salvar aqui no sistema.
                    </li>
                </ol>
            </div>
        )}

        <CardContent className="pt-6">
             <form onSubmit={handleSaveStorage} className="space-y-6">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Cloud Name
                        </label>
                        <input 
                            placeholder="Ex: demo123" 
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-sm font-mono"
                            value={storageConfig.cloudName}
                            onChange={e => setStorageConfig({...storageConfig, cloudName: e.target.value})}
                        />
                        <p className="text-xs text-gray-500 mt-1">Nome da sua nuvem no Dashboard.</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Upload Preset (Unsigned)
                        </label>
                        <input 
                            placeholder="Ex: meu_preset_unsigned" 
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-sm font-mono"
                            value={storageConfig.uploadPreset}
                            onChange={e => setStorageConfig({...storageConfig, uploadPreset: e.target.value})}
                        />
                        <p className="text-xs text-gray-500 mt-1">Deve estar configurado como "Unsigned" no Cloudinary.</p>
                    </div>
                </div>

                {/* Feedback de Teste */}
                {testResult === 'success' && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-sm text-green-700 dark:text-green-300 animate-fade-in">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Conectado com Sucesso!</p>
                        <p className="text-xs opacity-90">Suas imagens agora serão salvas na nuvem, deixando o sistema mais rápido.</p>
                    </div>
                  </div>
                )}
                
                {testResult === 'error' && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-sm text-red-700 dark:text-red-300 animate-shake">
                    <XCircle className="h-5 w-5 flex-shrink-0" />
                    <div>
                        <p className="font-semibold">Falha na Conexão</p>
                        <p className="text-xs opacity-90">Verifique se o Cloud Name está correto e se o Preset está marcado como <strong>Unsigned</strong>.</p>
                    </div>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row items-center justify-end pt-2 gap-3 border-t border-gray-100 dark:border-gray-700 mt-4">
                    <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={handleTestStorage} 
                        disabled={isTesting || !storageConfig.cloudName}
                        className="w-full sm:w-auto text-gray-600 dark:text-gray-400"
                    >
                        {isTesting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                        )}
                        {isTesting ? 'Verificando...' : 'Testar Credenciais'}
                    </Button>
                    <Button type="submit" className="w-full sm:w-auto">
                        <Save className="h-4 w-4 mr-2" /> Salvar Configuração
                    </Button>
                </div>
             </form>
        </CardContent>
      </Card>
    </div>
  );
};
