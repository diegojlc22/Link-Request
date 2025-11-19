# NexRequest SaaS - Plataforma de Gestão de Solicitações

Bem-vindo ao **NexRequest**, uma plataforma moderna de Helpdesk e gestão de solicitações internas (SaaS), desenvolvida com tecnologias de ponta para garantir eficiência, organização e inteligência no atendimento.

## 🚀 Visão Geral

O NexRequest permite que empresas gerenciem solicitações entre diferentes unidades e departamentos. O sistema conta com perfis de acesso hierárquicos, dashboards analíticos e **Inteligência Artificial** integrada para auxiliar na comunicação.

### ✨ Principais Funcionalidades

- **Gestão de Tickets:** Criação, acompanhamento e resolução de chamados.
- **IA Integrada (Gemini 2.5):** Sugestão automática de respostas profissionais e empáticas para os tickets.
- **Multi-Tenant (Simulado):** Estrutura preparada para gerenciar múltiplas empresas e unidades.
- **Banco de Dados Híbrido:** Funciona totalmente offline com `LocalStorage` (modo demo) ou conectado ao **Google Firebase** (Firestore) para persistência real.
- **Dashboard Analítico:** Gráficos de volume, status e desempenho por unidade.
- **Modo Escuro (Dark Mode):** Interface adaptável para conforto visual.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** React 19, TypeScript
*   **Estilização:** Tailwind CSS
*   **Ícones:** Lucide React
*   **Gráficos:** Recharts
*   **Inteligência Artificial:** Google Gemini API (`@google/genai`)
*   **Banco de Dados:** Firebase Firestore (SDK v10/v12)
*   **Datas:** Date-fns

## 🔑 Credenciais de Acesso (Demo)

O sistema vem pré-configurado com dados de demonstração. Utilize as contas abaixo para testar os diferentes níveis de permissão (Senha padrão: `123`):

| Perfil | Email | Permissões |
| :--- | :--- | :--- |
| **Admin Geral** | `admin@techcorp.com` | Acesso total: Configurações, Banco de Dados, Usuários, Unidades e Tickets globais. |
| **Líder de Unidade** | `roberto@techcorp.com` | Gerencia tickets e usuários apenas da sua unidade específica. |
| **Usuário Comum** | `ana@techcorp.com` | Apenas abre tickets e visualiza suas próprias solicitações. |

## ⚙️ Configuração

### 1. Inteligência Artificial (Google Gemini)
O sistema utiliza a API do Google Gemini para sugerir respostas. A chave de API (`API_KEY`) é injetada automaticamente via variável de ambiente (`process.env.API_KEY`) no ambiente de execução.
*   Funcionalidade: No detalhe de um chamado, clique no ícone de "brilho" (✨) no campo de resposta para gerar um texto automático.

### 2. Banco de Dados (Firebase)
Por padrão, o sistema usa dados fictícios salvos no navegador. Para conectar a um banco real:

1.  Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2.  Crie um banco de dados **Firestore**.
3.  No NexRequest, logue como **Admin**.
4.  Vá até o menu **Banco de Dados**.
5.  Cole o objeto de configuração `const firebaseConfig = { ... }` fornecido pelo Firebase.
6.  Clique em **Salvar e Conectar**.

## 📂 Estrutura do Projeto

*   `/components`: Componentes de UI reutilizáveis (Cards, Buttons, Modal, Layout).
*   `/contexts`: Gerenciamento de estado global (`DataContext` para dados, `AuthContext` para login).
*   `/pages`: Telas da aplicação (Dashboard, Listas, Configurações).
*   `/services`: Integrações externas (`firebaseService` e `geminiService`).
*   `/types`: Definições de Tipos TypeScript.

---

Desenvolvido com foco em performance e UX moderna.
