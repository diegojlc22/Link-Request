
# NexRequest SaaS - Plataforma de Gestão de Solicitações

Bem-vindo ao **NexRequest**, uma plataforma moderna de Helpdesk e gestão de solicitações internas (SaaS), desenvolvida com tecnologias de ponta para garantir eficiência e organização no atendimento.

## 🚀 Visão Geral

O NexRequest permite que empresas gerenciem solicitações entre diferentes unidades e departamentos. O sistema conta com perfis de acesso hierárquicos e dashboards analíticos integrados.

### ✨ Principais Funcionalidades

- **Gestão de Tickets:** Criação, acompanhamento e resolução de chamados.
- **Multi-Tenant (Simulado):** Estrutura preparada para gerenciar múltiplas empresas e unidades.
- **Banco de Dados Híbrido:** Funciona totalmente offline com `LocalStorage` (modo demo) ou conectado ao **Google Firebase** (Firestore) para persistência real.
- **Dashboard Analítico:** Gráficos de volume, status e desempenho por unidade.
- **Modo Escuro (Dark Mode):** Interface adaptável para conforto visual.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** React 19, TypeScript
*   **Estilização:** Tailwind CSS
*   **Ícones:** Lucide React
*   **Gráficos:** Recharts
*   **Banco de Dados:** Firebase Firestore
*   **Datas:** Date-fns

## 🔑 Acesso Admin (Demo)

O sistema vem pré-configurado com um acesso de administrador para demonstração:

| Perfil | Email | Senha |
| :--- | :--- | :--- |
| **Admin Geral** | `admin@admin` | `admin` |

> **Nota:** Este usuário tem acesso total para criar novas unidades, usuários e gerenciar as configurações da empresa.

## ⚙️ Configuração

### 1. Banco de Dados (Firebase)
Por padrão, o sistema usa dados fictícios salvos no navegador. Para conectar a um banco real:

1.  Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2.  Crie um banco de dados **Firestore**.
3.  No NexRequest, logue como **Admin**.
4.  Vá até o menu **Banco de Dados**.
5.  Cole o objeto de configuração `const firebaseConfig = { ... }` fornecido pelo Firebase.
6.  Clique em **Salvar e Conectar**.

## 📂 Estrutura do Projeto

*   `/components`: Componentes de UI reutilizáveis.
*   `/contexts`: Gerenciamento de estado global.
*   `/pages`: Telas da aplicação.
*   `/services`: Integrações externas (`firebaseService`).
*   `/types`: Definições de Tipos TypeScript.

---

Desenvolvido com foco em performance e UX moderna.
