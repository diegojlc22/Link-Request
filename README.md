<div align="center">

![Link-Request Banner](https://forbes.com.br/wp-content/uploads/2024/01/Tech_tecnologias2024_divulgacao.jpg)

# Link-Request SaaS
### Plataforma Corporativa de Gestão de Solicitações

<!-- MENU DE NAVEGAÇÃO ESTILO ABAS -->
<p align="center">
  <a href="#-sobre-o-projeto">
    <img src="https://img.shields.io/badge/🏠_SOBRE_O_PROJETO-2563eb?style=for-the-badge&logoColor=white" alt="Sobre" />
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="#-configuracao-cloudflare">
    <img src="https://img.shields.io/badge/☁️_CLOUDFLARE_&_ENV-f59e0b?style=for-the-badge&logoColor=white" alt="Configuração" />
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="#-seguranca">
    <img src="https://img.shields.io/badge/🔒_SEGURANÇA_DB-dc2626?style=for-the-badge&logoColor=white" alt="Segurança" />
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="#-instalacao-local">
    <img src="https://img.shields.io/badge/🚀_INSTALAÇÃO_LOCAL-10b981?style=for-the-badge&logoColor=white" alt="Instalação" />
  </a>
</p>

</div>

---

<div id="-sobre-o-projeto"></div>

## 🏠 Sobre o Projeto

O **Link-Request** é uma solução para modernizar o Helpdesk de empresas multi-unidades.

Este projeto foi desenhado para o modelo **Single-Tenant Deploy**. Ou seja, você cria uma instância separada para cada cliente na sua hospedagem (Cloudflare, Vercel, etc), e configura o banco de dados através de **Variáveis de Ambiente**.

Isso garante segurança total dos dados e facilidade de gestão.

---

<div id="-configuracao-cloudflare"></div>

## ☁️ Configuração de Variáveis (Cloudflare, Vercel)

Para que o sistema funcione, você deve configurar as credenciais do Firebase nas "Environment Variables" da sua hospedagem.

**IMPORTANTE:** Você deve criar **uma variável para cada linha** da tabela abaixo. Não cole tudo junto.

### 📋 Tabela de Preenchimento (Firebase)

No painel do Firebase (Project Settings > General > SDK Setup), pegue os valores e cadastre assim na hospedagem:

| Nome da Variável (Copie daqui) | Valor (Pegue no Firebase) |
| :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `AIzaSy...` (apiKey) |
| `VITE_FIREBASE_AUTH_DOMAIN` | `projeto.firebaseapp.com` (authDomain) |
| `VITE_FIREBASE_PROJECT_ID` | `projeto-id` (projectId) |
| `VITE_FIREBASE_STORAGE_BUCKET` | `projeto.firebasestorage.app` (storageBucket) |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `123456789` (messagingSenderId) |
| `VITE_FIREBASE_APP_ID` | `1:123456:web:abcd...` (appId) |
| `VITE_FIREBASE_DATABASE_URL` | `https://projeto...firebasedatabase.app` (databaseURL) |

### ☁️ Tabela de Preenchimento (Cloudinary - Armazenamento de Imagens)

Para habilitar upload de imagens (recomendado), configure o Cloudinary:

| Nome da Variável | Valor | Descrição |
| :--- | :--- | :--- |
| `VITE_CLOUDINARY_CLOUD_NAME` | `demo123` | Seu "Cloud Name" no dashboard do Cloudinary |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `meu_preset` | **IMPORTANTE:** Deve ser um preset **Unsigned** |

### 🟧 Cloudflare Pages (Passo a Passo)

1. Faça o deploy do repositório no **Cloudflare Pages**.
2. Após o deploy, vá no painel do projeto no Cloudflare.
3. Clique na aba **Settings** > **Environment variables**.
4. Clique em **Add variable** e adicione cada item da tabela acima, um por um.
   * *Produção e Preview:* Adicione para ambos se quiser testar antes.
5. **MUITO IMPORTANTE:** Após salvar as variáveis, vá na aba **Deployments** e clique em **Retrying deployment** (nos três pontinhos do último deploy) para que o site seja reconstruído com as novas chaves.

### ▲ Vercel (Passo a Passo)

1. Importe o projeto na Vercel.
2. Na tela de configuração de importação, abra a aba **Environment Variables**.
3. Copie e cole as variáveis da tabela.
4. Clique em Deploy.
5. Se precisar alterar depois: Vá em **Settings** > **Environment Variables**, adicione as novas e faça um **Redeploy** na aba Deployments.

---

<div id="-seguranca"></div>

## 🔒 Segurança do Banco de Dados (Crítico)

Para garantir que o aplicativo funcione rápido (com índices) e seja seguro, você deve configurar as Regras do Realtime Database.

**Isso é obrigatório para evitar erros de permissão e lentidão.**

### Passo a Passo:

1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Selecione seu projeto e vá em **Realtime Database** no menu lateral.
3. Clique na aba **Regras** (Rules).
4. **Apague tudo** que estiver lá e cole o JSON abaixo:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null",
    "users": {
      "$uid": {
         // REGRA DE SEGURANÇA:
         // Apenas o próprio usuário ou um Admin pode editar dados de usuário.
         // Isso impede que um usuário comum altere a senha de outro.
         ".write": "$uid === auth.uid || root.child('users').child(auth.uid).child('role').val() === 'ADMIN'",
         ".indexOn": ["email", "companyId", "unitId"]
      }
    },
    "requests": {
      // ÍNDICES DE PERFORMANCE:
      // Necessários para filtrar requisições por unidade, status, criador, etc.
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

5. Clique no botão **Publicar**.

> **Nota Técnica:** Estas regras definem que qualquer usuário logado na empresa pode ler o banco (necessário para a operação em tempo real), mas aplicam validações específicas na escrita de usuários e criam índices vitais para que o aplicativo não fique lento com muitos dados.

---

<div id="-instalacao-local"></div>

## 🚀 Instalação Local (Desenvolvimento)

Para rodar em sua máquina, crie um arquivo chamado `.env` na raiz do projeto e cole o conteúdo abaixo, substituindo os valores:

```bash
# Firebase Config
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projeto-id
VITE_FIREBASE_STORAGE_BUCKET=projeto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456
VITE_FIREBASE_APP_ID=1:12345:web:abc
VITE_FIREBASE_DATABASE_URL=https://projeto-default-rtdb.firebaseio.com

# Cloudinary Config
VITE_CLOUDINARY_CLOUD_NAME=seu_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=seu_unsigned_preset
```

Depois rode:

```bash
npm install
npm run dev
```

---

<div align="center">
  <small>Desenvolvido com ❤️ para gestão eficiente.</small>
</div>