import React, { ReactNode, ErrorInfo } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- MAGIC LINK BOOTSTRAP ---
// Verifica se a URL contém uma configuração codificada (Magic Link)
// Se tiver, salva no LocalStorage e recarrega a página limpa.
// Isso permite que usuários entrem no sistema já configurados apenas clicando em um link.
const params = new URLSearchParams(window.location.search);
const encodedConfig = params.get('config');

if (encodedConfig) {
  try {
    const decoded = atob(encodedConfig);
    const configObj = JSON.parse(decoded);
    
    // Validação básica para garantir que é uma config válida
    if (configObj.apiKey && configObj.projectId) {
      localStorage.setItem('firebase_config_override', JSON.stringify(configObj));
      
      // Limpa a URL para não ficar feio e recarrega para aplicar
      const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
      window.location.reload();
    }
  } catch (e) {
    console.error("Erro ao processar Link de Configuração:", e);
    alert("O link de acesso parece estar inválido ou corrompido.");
  }
}

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// Error Boundary to catch crashes and prevent white screen
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          fontFamily: 'sans-serif', 
          height: '100vh', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#fef2f2',
          color: '#991b1b'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Algo deu errado.</h1>
          <p>Ocorreu um erro ao carregar a aplicação.</p>
          <pre style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: '#fff', 
            borderRadius: '8px', 
            overflow: 'auto', 
            maxWidth: '800px',
            border: '1px solid #f87171'
          }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Tentar Novamente
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);