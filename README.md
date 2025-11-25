
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
  <a href="#-configuracao-fixa">
    <img src="https://img.shields.io/badge/⚙️_CONFIGURAÇÃO_FIXA-f59e0b?style=for-the-badge&logoColor=white" alt="Configuração" />
  </a>
  &nbsp;&nbsp;&nbsp;
  <a href="#-instalacao-e-deploy">
    <img src="https://img.shields.io/badge/🚀_INSTALAÇÃO_E_DEPLOY-10b981?style=for-the-badge&logoColor=white" alt="Instalação" />
  </a>
</p>

</div>

---

<div id="-sobre-o-projeto"></div>

## 🏠 Sobre o Projeto

O **Link-Request** é uma solução SaaS (Software as a Service) desenvolvida para modernizar o Helpdesk e a comunicação interna de empresas multi-unidades.

Diferente de sistemas de tickets tradicionais, o Link-Request foca em **agilidade visual** e **hierarquia simplificada**, permitindo que líderes de unidades abram chamados que são gerenciados centralmente ou distribuídos por setores.

### ✨ Principais Recursos

<table>
  <tr>
    <td width="50%">
      <h3>🎨 Experiência do Usuário</h3>
      <ul>
        <li><strong>Dashboard Interativo:</strong> Métricas em tempo real com gráficos.</li>
        <li><strong>Kanban Drag & Drop:</strong> Gestão visual de tarefas arrastando cards.</li>
        <li><strong>Modo Escuro:</strong> Suporte nativo a Dark Mode.</li>
        <li><strong>Responsivo:</strong> Funciona perfeitamente em Mobile e Desktop.</li>
      </ul>
    </td>
    <td width="50%">
      <h3>⚙️ Potência Técnica</h3>
      <ul>
        <li><strong>Compressão Automática:</strong> Uploads de imagens são otimizados no cliente (5MB vira 50KB).</li>
        <li><strong>Offline-First:</strong> O sistema carrega instantaneamente, mesmo com internet instável.</li>
        <li><strong>Multitenancy (Simulado):</strong> Suporte a múltiplas empresas e unidades no mesmo banco.</li>
      </ul>
    </td>
  </tr>
</table>

### 🛠️ Stack Tecnológica

O projeto utiliza as versões mais recentes e estáveis do ecossistema React:

<div align="center">
  <img src="https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-10-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" />
</div>

<br/><br/>

---

<div id="-configuracao-fixa"></div>

## ⚙️ Configuração Fixa (Deploy Automático)

Para não precisar configurar o banco de dados toda vez que acessar de um novo dispositivo, você tem duas opções. Escolha a que melhor se adapta ao seu caso:

### Opção A: Inserir no Código (Mais fácil)
*Ideal se o seu repositório for privado.*

1. Abra o arquivo `services/firebaseService.ts`.
2. Logo no início, encontre a constante `FIXED_CONFIG`.
3. Preencha os campos com os dados do seu Firebase:

```typescript
const FIXED_CONFIG: FirebaseConfig | null = {
  apiKey: "AIzaSyD...",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456...",
  appId: "1:123456..."
};
```
4. Faça o Commit e Push. O site já subirá configurado.

### Opção B: Variáveis de Ambiente (Mais Seguro)
*Ideal para Vercel, Netlify e repositórios públicos.*

No painel da sua hospedagem, procure por **"Environment Variables"** e adicione as seguintes chaves (use o prefixo `VITE_`):

* `VITE_FIREBASE_API_KEY`
* `VITE_FIREBASE_AUTH_DOMAIN`
* `VITE_FIREBASE_DATABASE_URL`
* `VITE_FIREBASE_PROJECT_ID`
* `VITE_FIREBASE_STORAGE_BUCKET`
* `VITE_FIREBASE_MESSAGING_SENDER_ID`
* `VITE_FIREBASE_APP_ID`

#### Onde configurar em cada plataforma:

| Plataforma | Caminho no Painel |
| :--- | :--- |
| **Vercel** | Settings -> Environment Variables |
| **Netlify** | Site configuration -> Environment variables |
| **Cloudflare** | Settings -> Environment variables |
| **Firebase** | Requer `Github Secrets` se usar Actions |

---

<div id="-instalacao-e-deploy"></div>

## 🚀 Instalação e Deploy

Guia completo para colocar seu projeto no ar ou rodar em sua máquina.

### ☁️ Onde Hospedar (Compatibilidade 100%)

Este projeto é uma SPA (Single Page Application). Abaixo, os melhores lugares para hospedar gratuitamente com integração automática ao GitHub.

| Provedor | Custo | Dificuldade | Integração GitHub | Observação |
| :--- | :--- | :---: | :---: | :--- |
| **Vercel** 🥇 | Grátis | ⭐ | ✅ Automática | **Recomendado.** Detecta Vite automaticamente. Zero config. |
| **Netlify** 🥈 | Grátis | ⭐ | ✅ Automática | Adicione o arquivo `_redirects` na pasta public. |
| **Cloudflare Pages** ⚡ | Grátis | ⭐ | ✅ Automática | **Ultra Rápido.** CDN Global e suporte nativo a Vite. |
| **Firebase Hosting** 🥉 | Grátis | ⭐⭐ | ✅ Actions | Ótimo para manter Front e Banco no mesmo lugar. |

### 🔧 Instalação Local (Desenvolvedores)

Siga os passos abaixo para rodar o ambiente de desenvolvimento em sua máquina.

**1. Pré-requisitos**
*   Node.js v18+
*   Git

**2. Passo a Passo**

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/link-request.git

# 2. Acesse a pasta
cd link-request

# 3. Instale as dependências
npm install

# 4. Inicie o servidor local
npm run dev
```

**3. Configuração Inicial**
Ao abrir `http://localhost:5173` pela primeira vez, você verá o **Setup Wizard** (se não tiver feito a Configuração Fixa).
1. Crie o nome da empresa e o usuário Admin.
2. Cole as credenciais do seu projeto Firebase quando solicitado.

---

<div align="center">
  <small>Desenvolvido com ❤️ para gestão eficiente.</small>
</div>
