
# Link-Request SaaS - Plataforma de Gestão de Solicitações

![Banner Tecnologia](https://forbes.com.br/wp-content/uploads/2024/01/Tech_tecnologias2024_divulgacao.jpg)

Bem-vindo ao **Link-Request**, uma plataforma moderna de Helpdesk e gestão de solicitações internas (SaaS), desenvolvida com tecnologias de ponta (React 19, TypeScript, Firebase) para garantir eficiência, performance e organização no atendimento corporativo.

## 🚀 Visão Geral do Sistema

O Link-Request foi projetado para gerenciar solicitações entre diferentes unidades e departamentos de uma empresa. O sistema opera com um **banco de dados híbrido**, funcionando imediatamente em modo local (demonstração) ou sincronizado em tempo real com o Firebase.

### ✨ Principais Funcionalidades

*   **⚡ Performance Extrema:** Otimizações avançadas com *Lazy Loading*, *Memoization* e *Debounce* na busca para garantir fluidez mesmo com muitos dados.
*   **📸 Compressão Inteligente de Imagens:** Upload de anexos com redimensionamento e compressão automática no navegador. Imagens de 5MB são convertidas para ~50kb instantaneamente, poupando dados e armazenamento.
*   **🛠️ Instalação "No-Code":** Configuração do banco de dados feita diretamente pela interface do usuário, sem necessidade de editar arquivos de código.
*   **Gestão Multi-Unidade:** Controle centralizado de múltiplas filiais ou departamentos.
*   **Dashboard Analítico:** Gráficos interativos (Recharts) para monitorar volume, status e KPIs.
*   **Segurança:** Proteção contra XSS (Sanitização de inputs) e Rate Limiting no login.

---

## 👥 Perfis de Acesso (RBAC)

O sistema possui controle de acesso baseado em funções (Role-Based Access Control):

### 1. 👤 Usuário Comum (USER)
*   **Perfil:** Colaborador / Solicitante.
*   **Acesso:** Visualiza apenas as requisições que **ele mesmo criou**.
*   **Permissões:** Abrir chamados, anexar fotos, comentar em seus tickets.

### 2. 🛡️ Líder de Unidade (LEADER)
*   **Perfil:** Gerente de Filial / Supervisor.
*   **Acesso:** Visualiza todas as requisições da **sua Unidade**.
*   **Permissões:** Além de criar, pode **Alterar Status** (Resolver, Cancelar, Em andamento) das requisições da sua filial.

### 3. 👑 Administrador (ADMIN)
*   **Perfil:** Gestão Global / TI / Suporte Nível 2.
*   **Acesso:** Visão total de **todas as unidades** e empresas.
*   **Permissões:**
    *   Gerenciar tickets de qualquer lugar.
    *   **Menu de Gerenciamento:** Criar/Excluir Unidades e Usuários.
    *   Alterar configurações globais da empresa (Nome, Logo).
    *   Resetar senhas de usuários.

---

## 🛠️ Tecnologias Utilizadas

*   **Core:** React 19, TypeScript, Vite.
*   **Estilização:** Tailwind CSS (com Dark Mode automático).
*   **Dados:** Firebase Realtime Database (RTDB) + LocalStorage (Cache/Offline).
*   **Gráficos:** Recharts.
*   **Ícones:** Lucide React.
*   **Performance:** Code-splitting manual, React.lazy, React.useMemo.

---

## 🚀 Guia de Instalação e Execução

### 1. Instalar Dependências
```bash
npm install
# ou
yarn install
```

### 2. Rodar o Projeto
```bash
npm run dev
# ou
yarn dev
```

### 3. Configuração Inicial (Assistente de Instalação)
Ao abrir o sistema pela primeira vez, você verá a tela de **Instalação do Sistema**. Siga os passos:

1.  **Dados da Empresa:** Defina o nome da sua organização.
2.  **Conta Admin:** Crie o usuário mestre (Seu email e senha).
3.  **Banco de Dados (Fácil):**
    *   O sistema pedirá o JSON de configuração do Firebase.
    *   Basta colar o objeto de configuração (obtido no Console do Firebase) na caixa de texto.
    *   O sistema salvará e conectará automaticamente.

> **Nota:** Não é obrigatório criar arquivos `.env` manualmente, embora o sistema ainda suporte `VITE_FIREBASE_...` para ambientes de CI/CD.

---

## ⚙️ Como obter a Configuração do Firebase

Para que o sistema sincronize em tempo real entre múltiplos dispositivos:

1.  Acesse [console.firebase.google.com](https://console.firebase.google.com/).
2.  Crie um projeto e adicione um app **Web**.
3.  Copie o código de configuração (`const firebaseConfig = { ... }`).
4.  Crie um **Realtime Database** e configure as regras de segurança para teste:
    ```json
    {
      "rules": {
        ".read": true,
        ".write": true
      }
    }
    ```
5.  Cole o JSON copiado na **Tela de Instalação** do Link-Request.

---

## 📂 Estrutura de Pastas

*   `/components`: Elementos de UI (Botões, Cards, Modal, Layout).
*   `/contexts`: Lógica global (Autenticação, Dados, Toast).
*   `/pages`: Telas da aplicação (Dashboard, Listas, Admin).
*   `/services`: Comunicação com Firebase e lógica de compressão.
*   `/types`: Tipagem TypeScript para garantir segurança de código.

---

## 🔐 Credenciais de Demonstração (Modo Local)

Se você pular a configuração do Firebase ou rodar em modo offline, o sistema pode ser reiniciado via LocalStorage.

| Perfil | Email | Senha Padrão |
| :--- | :--- | :--- |
| **Admin** | `admin@admin` | `admin` |

---

Desenvolvido com foco em **UX**, **Performance** e **Escalabilidade**.
