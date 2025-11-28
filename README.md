<div align="center">

![Link-Request Banner](https://forbes.com.br/wp-content/uploads/2024/01/Tech_tecnologias2024_divulgacao.jpg)

# Link-Request SaaS
### Plataforma Corporativa de Gestão de Solicitações (Secure Edition)

<!-- MENU DE NAVEGAÇÃO ESTILO ABAS -->
<p align="center">
  <a href="#-modos-de-operacao">
    <img src="https://img.shields.io/badge/🚀_MODOS_DE_OPERAÇÃO-2563eb?style=for-the-badge&logoColor=white" alt="Modos" />
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="#-passo-a-passo-saas">
    <img src="https://img.shields.io/badge/📚_PASSO_A_PASSO_(NOVO_CLIENTE)-10b981?style=for-the-badge&logoColor=white" alt="Passo a Passo" />
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="#-seguranca">
    <img src="https://img.shields.io/badge/🔒_SEGURANÇA_DB-dc2626?style=for-the-badge&logoColor=white" alt="Segurança" />
  </a>
</p>

</div>

---

<div id="-modos-de-operacao"></div>

## 🚀 Modos de Operação

Este sistema suporta duas arquiteturas simultaneamente:

1.  **Modo SaaS (Recomendado):**
    *   **Como funciona:** Um único site (`app.seusistema.com`) atende infinitos clientes.
    *   **Dados:** Cada cliente tem seu próprio banco de dados Firebase isolado.
    *   **Acesso:** O cliente é identificado pelo subdomínio (ex: `nike.app.com`) ou pelo Portal de Login.
    *   **Configuração:** Feita no arquivo `src/config/tenants.ts`.

2.  **Modo Instância Única (Legacy):**
    *   **Como funciona:** Uma instalação para uma única empresa.
    *   **Configuração:** Feita via **Variáveis de Ambiente** (.env) na hospedagem.

---

<div id="-passo-a-passo-saas"></div>

## 📚 Passo a Passo: Adicionar Novo Cliente (Modo SaaS)

Para vender para uma nova empresa e liberar o acesso dela **sem criar um novo deploy na Vercel**, siga estes passos:

### 1. Crie o Banco de Dados (Firebase)
1.  Acesse o [Console do Firebase](https://console.firebase.google.com/).
2.  Clique em **Adicionar projeto** (Ex: "Cliente-Padaria").
3.  Desative o Google Analytics (opcional) e crie o projeto.
4.  No menu lateral, vá em **Criação (Build)** > **Authentication**.
5.  Clique em **Vamos começar** > Selecione **Email/Senha** > **Ativar**.
6.  Vá em **Realtime Database** e crie um banco.
7.  **IMPORTANTE:** Vá na aba **Regras** do Database e cole as regras de segurança (veja a seção [Segurança](#-seguranca) abaixo).

### 2. Pegue as Credenciais
1.  No Firebase, clique na engrenagem ⚙️ > **Configurações do projeto**.
2.  Role até "Seus aplicativos" e clique no ícone **</> (Web)**.
3.  Registre o app (Ex: "App Web").
4.  Copie o objeto `firebaseConfig` que aparecerá na tela.

### 3. Registre no Código
1.  Abra o arquivo `src/config/tenants.ts` no seu editor de código.
2.  Adicione um novo item na lista `tenants`:

```typescript
export const tenants: Tenant[] = [
  // ... outros clientes ...
  {
    id: 'cliente-02',
    name: 'Padaria do João',
    slug: 'padaria', // O cliente usará este ID para entrar
    config: {
      apiKey: "AIzaSy...", // Cole as credenciais do Passo 2 aqui
      authDomain: "cliente-padaria.firebaseapp.com",
      projectId: "cliente-padaria",
      storageBucket: "cliente-padaria.firebasestorage.app",
      messagingSenderId: "...",
      appId: "...",
      databaseURL: "https://..."
    }
  }
];
```

### 4. Publique
1.  Faça o commit e push para o GitHub:
    ```bash
    git add .
    git commit -m "Adicionando cliente Padaria"
    git push origin main
    ```
2.  Pronto! Seu site principal será atualizado automaticamente.
3.  O cliente já pode acessar.

### 5. Configuração Inicial (Primeiro Acesso)
1.  Acesse o link do cliente (ex: `padaria.seusistema.com` ou via Portal).
2.  Você verá uma tela de "Configuração Inicial".
3.  Crie a conta do Administrador.
4.  **O sistema criará automaticamente o usuário no Firebase Authentication e no Banco de Dados.**

---

<div id="-seguranca"></div>

## 🔒 Segurança do Banco de Dados (Obrigatório)

Agora que o sistema usa Autenticação Nativa, você DEVE proteger o banco de dados.

1.  Vá no Console Firebase do cliente > **Realtime Database** > **Regras**.
2.  Apague tudo e cole:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
       ".indexOn": ["email"]
    },
    "requests": {
       ".indexOn": ["createdAt", "updatedAt", "companyId", "unitId", "creatorId"]
    }
  }
}
```

Isso garante que apenas usuários logados (autenticados pelo Google) possam ler ou escrever dados.

---

<div align="center">
  <small>Link-Request SaaS © 2024</small>
</div>