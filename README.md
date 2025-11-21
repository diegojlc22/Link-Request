
# Link-Request SaaS - Plataforma de Gestão de Solicitações

Bem-vindo ao **Link-Request**, uma plataforma moderna de Helpdesk e gestão de solicitações internas (SaaS), desenvolvida com tecnologias de ponta para garantir eficiência e organização no atendimento.

## 🚀 Visão Geral

O Link-Request permite que empresas gerenciem solicitações entre diferentes unidades e departamentos. O sistema conta com perfis de acesso hierárquicos e dashboards analíticos integrados.

### ✨ Principais Funcionalidades

- **Gestão de Tickets:** Criação, acompanhamento e resolução de chamados.
- **Multi-Tenant (Simulado):** Estrutura preparada para gerenciar múltiplas empresas e unidades.
- **Banco de Dados Híbrido:** Funciona totalmente offline com `LocalStorage` (modo demo) ou conectado ao **Google Firebase Realtime Database** para persistência real.
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
*   **Banco de Dados:** Firebase Realtime Database (RTDB)
*   **Datas:** Date-fns

## 🔑 Acesso Admin (Demo)

O sistema vem pré-configurado com um acesso de administrador para demonstração:

| Perfil | Email | Senha |
| :--- | :--- | :--- |
| **Admin Geral** | `admin@admin` | `admin` |

> **Nota:** Este usuário tem acesso total para criar novas unidades, usuários e gerenciar as configurações da empresa.

## ⚙️ Configuração do Banco de Dados

### 1. Configurando o Firebase
Este projeto usa o **Realtime Database** (e não o Firestore).

1.  Crie um projeto no [Firebase Console](https://console.firebase.google.com/).
2.  No menu lateral esquerdo, clique em **Criação** (Build) > **Realtime Database**.
3.  Clique em **Criar Banco de Dados**.
4.  **IMPORTANTE (Regras):**
    *   Vá na aba **Regras** (Rules) do Realtime Database.
    *   Cole o seguinte JSON (isso libera o banco para leitura/escrita sem autenticação do Firebase, já que usamos Auth próprio no app):
    ```json
    {
      "rules": {
        ".read": true,
        ".write": true
      }
    }
    ```
    *   *Se der erro de sintaxe, verifique se você não está na aba de Regras do Cloud Firestore por engano.*

### 2. Conectando o App
1.  Vá nas configurações do projeto (ícone de engrenagem) > Geral.
2.  Em "Seus aplicativos" (Your apps), clique no ícone Web `</>`.
3.  Copie o objeto `firebaseConfig`. Verifique se ele contém a linha `databaseURL`.
4.  No Link-Request, logue como **Admin** e vá ao menu **Banco de Dados**.
5.  Cole o código e salve.

## 📂 Estrutura do Projeto

*   `/components`: Componentes de UI reutilizáveis.
*   `/contexts`: Gerenciamento de estado global e autenticação.
*   `/pages`: Telas da aplicação.
*   `/services`: Integrações externas (`firebaseService`).
*   `/types`: Definições de Tipos TypeScript e Enums.

---

Desenvolvido com foco em performance e UX moderna.
