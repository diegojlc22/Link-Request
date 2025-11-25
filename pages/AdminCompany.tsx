
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Building, Save, Cloud, Loader2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

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
            showToast(`Erro na conexão: ${data.error?.message || 'Verifique as credenciais'}`, 'error');
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
    <div className="space-y-6 max-w-2xl">
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
      <Card>
        <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5 text-blue-500" /> Armazenamento de Imagens
             </CardTitle>
        </CardHeader>
        <CardContent>
             <form onSubmit={handleSaveStorage} className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Configure o <strong>Cloudinary</strong> para uploads rápidos e otimizados. 
                    Sem essa configuração, as imagens serão salvas diretamente no banco de dados (mais lento e limitado).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cloud Name</label>
                        <input 
                            placeholder="Ex: demo" 
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
                            value={storageConfig.cloudName}
                            onChange={e => setStorageConfig({...storageConfig, cloudName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Preset</label>
                        <input 
                            placeholder="Ex: unsigned_preset" 
                            className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
                            value={storageConfig.uploadPreset}
                            onChange={e => setStorageConfig({...storageConfig, uploadPreset: e.target.value})}
                        />
                    </div>
                </div>

                {/* Feedback de Teste */}
                {testResult === 'success' && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-sm text-green-700 dark:text-green-300 animate-fade-in">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <span><strong>Sucesso!</strong> Credenciais validadas. O armazenamento em nuvem está ativo.</span>
                  </div>
                )}
                {testResult === 'error' && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300 animate-shake">
                    <XCircle className="h-5 w-5 flex-shrink-0" />
                    <span><strong>Erro na conexão.</strong> Verifique se o Cloud Name e Preset estão corretos.</span>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4">
                    <a href="https://cloudinary.com/documentation/upload_presets" target="_blank" rel="noreferrer" className="text-xs text-primary-600 hover:underline">
                        Como obter essas credenciais?
                    </a>
                    
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button 
                            type="button" 
                            variant="secondary" 
                            onClick={handleTestStorage} 
                            disabled={isTesting || !storageConfig.cloudName}
                            className="flex-1 sm:flex-none"
                        >
                            {isTesting ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                            )}
                            {isTesting ? 'Testando...' : 'Testar Conexão'}
                        </Button>
                        <Button type="submit" className="flex-1 sm:flex-none">
                            <Save className="h-4 w-4 mr-2" /> Salvar
                        </Button>
                    </div>
                </div>
             </form>
        </CardContent>
      </Card>
    </div>
  );
};
