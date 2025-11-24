
# Link-Request SaaS - Plataforma de Gestão de Solicitações

Bem-vindo ao **Link-Request**, uma plataforma moderna de Helpdesk e gestão de solicitações internas (SaaS), desenvolvida com tecnologias de ponta para garantir eficiência e organização no atendimento.

## 🚀 Visão Geral

O Link-Request permite que empresas gerenciem solicitações entre diferentes unidades e departamentos. O sistema conta com perfis de acesso hierárquicos e dashboards analíticos integrados.

### ✨ Principais Funcionalidades

- **Gestão de Tickets:** Criação, acompanhamento e resolução de chamados.
- **Multi-Tenant (Simulado):** Estrutura preparada para gerenciar múltiplas empresas e unidades.
- **Banco de Dados Híbrido:** Funciona totalmente offline com `LocalStorage` (modo demo) ou conectado ao **Google Firebase Realtime Database** para persistência real e sincronização automática.
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
    *   **Configuração do Sistema:** Alterar nome/logo da empresa.
    *   Resetar senhas de outros usuários.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** React 19, TypeScript
*   **Estilização:** Tailwind CSS
*   **Ícones:** Lucide React
*   **Gráficos:** Recharts
*   **Banco de Dados:** Firebase Realtime Database (RTDB)
*   **Build Tool:** Vite

## 🔑 Acesso Admin (Demo)

O sistema vem pré-configurado com um acesso de administrador para demonstração:

| Perfil | Email | Senha |
| :--- | :--- | :--- |
| **Admin Geral** | `admin@admin` | `admin` |

> **Nota:** Este usuário tem acesso total para criar novas unidades, usuários e gerenciar as configurações da empresa.

## ⚙️ Configuração do Banco de Dados (Sincronização em Tempo Real)

O projeto utiliza **Variáveis de Ambiente** para conectar ao Firebase de forma segura e automática. Siga os passos abaixo:

### 1. Criar o Projeto no Firebase
1.  Acesse o [Firebase Console](https://console.firebase.google.com/).
2.  Crie um novo projeto.
3.  No menu lateral, vá em **Criação** > **Realtime Database** e clique em "Criar Banco de Dados".
4.  **IMPORTANTE (Regras de Segurança):** Vá na aba **Regras** e altere para o seguinte (como o app usa autenticação própria, precisamos liberar o acesso inicial):
    ```json
    {
      "rules": {
        ".read": true,
        ".write": true
      }
    }
    ```

### 2. Obter as Credenciais
1.  Nas configurações do projeto (ícone de engrenagem), vá em **Geral**.
2.  Em "Seus aplicativos", clique no ícone Web `</>`.
3.  Registre o app e copie as chaves exibidas no objeto `firebaseConfig`.

### 3. Criar o arquivo `.env`
Na **raiz do projeto** (junto com `package.json`), crie um arquivo chamado `.env` e preencha com suas chaves seguindo este modelo exato:

```env
VITE_FIREBASE_API_KEY=Cole_Sua_ApiKey_Aqui
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://seu-projeto-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=seu-projeto
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456:web:abcdef
```

> **Atenção:** Certifique-se de preencher `VITE_FIREBASE_DATABASE_URL`, pois é essencial para o funcionamento do Realtime Database.

### 4. Rodar o Projeto
Após criar o arquivo `.env`, você deve reiniciar o servidor de desenvolvimento para que as variáveis sejam carregadas:

```bash
# Pare o servidor atual (Ctrl + C) e rode novamente:
npm run dev
# ou
yarn dev
```

Se tudo estiver correto, você verá um indicador verde **"Sincronizado"** no canto superior direito da tela de login.

## 📂 Estrutura do Projeto

*   `/components`: Componentes de UI reutilizáveis.
*   `/contexts`: Gerenciamento de estado global e autenticação.
*   `/pages`: Telas da aplicação.
*   `/services`: Integrações externas (`firebaseService`).
*   `/types`: Definições de Tipos TypeScript e Enums.

---

Desenvolvido com foco em performance e UX moderna.
