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

## ☁️ Configuração de Variáveis (Cloudflare, Vercel, Netlify)

Para que o sistema funcione, você deve configurar as credenciais do Firebase nas "Environment Variables" da sua hospedagem.

### 📋 Lista de Variáveis Necessárias

Você encontrará esses valores no Console do Firebase > Project Settings > General (Role até o final na seção SDK Setup).

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=...
```

### 🟧 Cloudflare Pages (Passo a Passo)

1. Faça o deploy do repositório no **Cloudflare Pages**.
2. Após o deploy, vá no painel do projeto no Cloudflare.
3. Clique na aba **Settings** > **Environment variables**.
4. Clique em **Add variable** para cada item da lista acima.
   * *Produção e Preview:* Certifique-se de adicionar para ambos ou apenas Production conforme sua necessidade.
5. **IMPORTANTE:** Após salvar as variáveis, vá na aba **Deployments** e clique em **Retrying deployment** (ou faça um novo push) para que as variáveis sejam embutidas no site.

### ▲ Vercel (Passo a Passo)

1. Importe o projeto na Vercel.
2. Na tela de configuração de importação, abra a aba **Environment Variables**.
3. Copie e cole as variáveis.
4. Clique em Deploy.
5. Se precisar alterar depois: Vá em **Settings** > **Environment Variables**, adicione as novas e faça um **Redeploy** na aba Deployments.

### 💠 Netlify (Passo a Passo)

1. Importe o projeto.
2. Vá em **Site configuration** > **Environment variables**.
3. Adicione as variáveis.
4. Vá na aba **Deploys** e clique em **Trigger deploy**.

---

<div id="-instalacao-local"></div>

## 🚀 Instalação Local (Desenvolvimento)

Para rodar em sua máquina, crie um arquivo `.env` na raiz do projeto com as variáveis citadas acima.

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/link-request.git

# 2. Acesse a pasta
cd link-request

# 3. Crie o arquivo .env
# (Cole as variáveis VITE_FIREBASE... nele)

# 4. Instale e rode
npm install
npm run dev
```

---

<div align="center">
  <small>Desenvolvido com ❤️ para gestão eficiente.</small>
</div>