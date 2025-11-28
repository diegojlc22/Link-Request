<div align="center">

![Link-Request Banner](https://forbes.com.br/wp-content/uploads/2024/01/Tech_tecnologias2024_divulgacao.jpg)

# Link-Request SaaS
### Plataforma Corporativa de Gestão de Solicitações

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
4.  No menu lateral, ative o **Authentication** (Email/Senha).
5.  Ative o **Realtime Database** e crie um banco (pode começar em modo bloqueado).
6.  **IMPORTANTE:** Vá na aba **Regras** do Database e cole as regras de segurança (veja a seção [Segurança](#-seguranca) abaixo).

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

### 5. Como o Cliente Acessa?
Existem duas formas:
1.  **Pelo Portal:** O cliente acessa `seusistema.com`, digita o slug **"padaria"** e entra.
2.  **Link Direto:** Se você configurar subdomínios, ele pode acessar `padaria.seusistema.com` (requer config de DNS no Cloudflare/Vercel).

---

<div id="-seguranca"></div>

## 🔒 Segurança do Banco de Dados (Obrigatório)

Para cada novo cliente (Projeto Firebase), você **DEVE** configurar as regras abaixo para garantir que o sistema funcione e seja seguro.

1.  Vá no Console Firebase do cliente > **Realtime Database** > **Regras**.
2.  Apague tudo e cole:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
         // Impede que um usuário mude a senha de outro
         ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'ADMIN'",
         ".indexOn": ["email", "companyId", "unitId"]
      }
    },
    "requests": {
      // Índices para performance
      ".indexOn": ["companyId", "unitId", "creatorId", "assigneeId", "status", "createdAt"]
    },
    "comments": {
      ".indexOn": ["requestId", "createdAt"]
    },
    "companies": {
      ".indexOn": ["id"]
    },
    "units": {
      ".indexOn": ["companyId"]
    }
  }
}
```

---

## ☁️ Configuração Alternativa (Variáveis de Ambiente)

Se você preferir usar o modo antigo (uma hospedagem por cliente) ou quiser configurar um ambiente de desenvolvimento local rápido, use o arquivo `.env`:

```bash
# Firebase Config (Modo Single Tenant)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projeto-id
VITE_FIREBASE_STORAGE_BUCKET=projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456
VITE_FIREBASE_APP_ID=1:12345:web:abc
VITE_FIREBASE_DATABASE_URL=https://projeto-default-rtdb.firebaseio.com

# Cloudinary (Opcional - para Upload de Imagens)
VITE_CLOUDINARY_CLOUD_NAME=seu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=seu_unsigned_preset
```

---

<div align="center">
  <small>Link-Request SaaS © 2024</small>
</div>
