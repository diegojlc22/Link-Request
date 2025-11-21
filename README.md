
# Link-Request SaaS - Plataforma de Gestão de Solicitações

Bem-vindo ao **Link-Request**, uma plataforma moderna de Helpdesk e gestão de solicitações internas (SaaS), desenvolvida com tecnologias de ponta para garantir eficiência e organização no atendimento.

## 🚀 Visão Geral

O Link-Request permite que empresas gerenciem solicitações entre diferentes unidades e departamentos. O sistema conta com perfis de acesso hierárquicos e dashboards analíticos integrados.

### ✨ Principais Funcionalidades

- **Gestão de Tickets:** Criação, acompanhamento e resolução de chamados.
- **Multi-Tenant (Simulado):** Estrutura preparada para gerenciar múltiplas empresas e unidades.
- **Múltiplas Opções de Banco de Dados:**
    1.  **Local (Demo):** Funciona 100% offline usando LocalStorage.
    2.  **Cloud (Firebase):** Conecta-se ao Google Firestore para persistência em nuvem.
    3.  **On-Premise (SQLite):** Suporte para conexão com servidor próprio rodando SQLite em tempo real (via WebSockets).
- **Dashboard Analítico:** Gráficos de volume, status e desempenho por unidade.
- **Modo Escuro (Dark Mode):** Interface adaptável para conforto visual.

## 👥 Perfis de Acesso e Permissões

O sistema é dividido em 3 níveis hierárquicos, determinando o que cada usuário pode visualizar e gerenciar:

### 1. 👤 Usuário Comum (USER)
*   **Foco:** Solicitante / Operacional.
*   **Visibilidade:** Enxerga apenas as requisições que **ele mesmo criou**.
*   **Ações:**
    *   Criar novas requisições.
    *   Interagir via comentários nos seus tickets.
    *   Anexar arquivos e imagens.

### 2. 🛡️ Líder de Unidade (LEADER)
*   **Foco:** Gestão Local / Gerente de Filial.
*   **Visibilidade:** Enxerga **todas** as requisições pertencentes à sua **Unidade** (ex: Filial Centro), independente de quem criou.
*   **Ações:**
    *   Todas as permissões de Usuário Comum.
    *   **Alterar Status** das requisições da sua unidade (Resolver, Colocar em andamento, Cancelar).
    *   Visualizar métricas da sua unidade no Dashboard.

### 3. 👑 Administrador (ADMIN)
*   **Foco:** Gestão Global / Superusuário.
*   **Visibilidade:** Acesso total a **todas as unidades** e requisições da empresa.
*   **Ações:**
    *   Gerenciar tickets de qualquer unidade.
    *   **Gestão de Cadastro:** Criar, editar e excluir **Unidades** e **Usuários**.
    *   **Configuração do Sistema:** Alterar nome/logo da empresa e configurar conexão com Banco de Dados.
    *   Resetar senhas de outros usuários.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** React 19, TypeScript
*   **Estilização:** Tailwind CSS
*   **Ícones:** Lucide React
*   **Gráficos:** Recharts
*   **Banco de Dados:** Firebase Firestore ou SQLite (via Socket Server)
*   **Datas:** Date-fns

## 🔑 Acesso Admin (Demo)

O sistema vem pré-configurado com um acesso de administrador para demonstração:

| Perfil | Email | Senha |
| :--- | :--- | :--- |
| **Admin Geral** | `admin@admin` | `admin` |

> **Nota:** Este usuário tem acesso total para criar novas unidades, usuários e gerenciar as configurações da empresa.

## ⚙️ Configuração de Banco de Dados

O Link-Request suporta 3 modos de operação. Acesse o menu **Banco de Dados** no painel Admin para configurar.

### Opção A: Firebase (Nuvem)
1.  Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2.  Crie um banco de dados **Firestore**.
3.  Copie a configuração do projeto e cole no sistema.

### Opção B: SQLite (Servidor Próprio)
Para usar SQLite com sincronização em tempo real, você precisa rodar um servidor backend simples (Node.js + Socket.io) que gerencie o arquivo `.sqlite`.
1.  Inicie o servidor backend (ex: `http://localhost:3000`).
2.  Insira a URL no sistema.
3.  O frontend se conectará via WebSocket para enviar/receber atualizações instantâneas.

## 📂 Estrutura do Projeto

*   `/components`: Componentes de UI reutilizáveis.
*   `/contexts`: Gerenciamento de estado global e autenticação.
*   `/pages`: Telas da aplicação.
*   `/services`: Integrações externas.
*   `/types`: Definições de Tipos TypeScript e Enums.

---

Desenvolvido com foco em performance e UX moderna.
