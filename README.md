
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

## 💻 Instalação e Execução

Siga os passos abaixo para executar o projeto completo, incluindo o frontend e o servidor opcional de banco de dados SQLite.

### Pré-requisitos
*   Node.js instalado (v16 ou superior)

### Passo 1: Configurar o Servidor Backend (Opcional)
Se você deseja usar o modo **SQLite Real-Time**, precisa rodar o `server.js`.

1.  Crie uma pasta para o projeto e coloque o arquivo `server.js` na raiz.
2.  Abra o terminal na pasta e instale as dependências do servidor:
    ```bash
    npm init -y
    npm install express socket.io sqlite3 cors
    ```
3.  Execute o servidor:
    ```bash
    node server.js
    ```
    *O servidor iniciará na porta 3000 e criará automaticamente o arquivo `database.sqlite`.*

### Passo 2: Executar o Frontend
Como este projeto utiliza módulos ES6 diretamente no navegador (via CDN), você pode executá-lo usando qualquer servidor estático.

**Opção A (VS Code):**
1.  Instale a extensão "Live Server".
2.  Clique com o botão direito em `index.html` e selecione "Open with Live Server".

**Opção B (Node.js/npx):**
1.  No terminal, execute:
    ```bash
    npx serve .
    ```
2.  Acesse o endereço mostrado (geralmente `http://localhost:5000`).

### Passo 3: Conectar o Frontend ao Backend
1.  Faça login na aplicação (Admin/admin).
2.  Vá até o menu **Banco de Dados** na barra lateral.
3.  Selecione a aba **SQLite Server**.
4.  Insira a URL do seu servidor (ex: `http://localhost:3000`).
5.  Clique em **Conectar Servidor**.

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

## 📂 Estrutura do Projeto

*   `/components`: Componentes de UI reutilizáveis.
*   `/contexts`: Gerenciamento de estado global e autenticação.
*   `/pages`: Telas da aplicação.
*   `/services`: Integrações externas.
*   `/types`: Definições de Tipos TypeScript e Enums.
*   `server.js`: Backend Node.js para SQLite (opcional).

---

Desenvolvido com foco em performance e UX moderna.