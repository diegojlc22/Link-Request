
# Link-Request SaaS - Plataforma de Gestão de Solicitações

![Banner Tecnologia](https://forbes.com.br/wp-content/uploads/2024/01/Tech_tecnologias2024_divulgacao.jpg)

<div align="center">

**[📖 Sobre o Projeto](#-sobre-o-projeto)** • **[☁️ Onde Hospedar (Compatibilidade)](#-guia-de-hospedagem-e-deploy)** • **[⚙️ Instalação Local](#-instalação-e-execução-local)**

</div>

---

## 📖 Sobre o Projeto

Bem-vindo ao **Link-Request**, uma plataforma moderna de Helpdesk e gestão de solicitações internas (SaaS), desenvolvida com tecnologias de ponta (**React 19, TypeScript, Firebase**) para garantir eficiência, performance e organização no atendimento corporativo.

O sistema opera com um **banco de dados híbrido**, funcionando imediatamente em modo local (demonstração) ou sincronizado em tempo real com o Firebase, ideal para gerenciar múltiplas unidades e departamentos.

### ✨ Funcionalidades Principais

*   **⚡ Performance Extrema:** Otimizações avançadas com *Lazy Loading* e *Memoization*.
*   **📸 Compressão de Imagens:** Upload de até 5 fotos com compressão automática (5MB -> 50kb).
*   **📊 Dashboard & Kanban:** Visualização de dados em gráficos e quadro de tarefas *drag-and-drop*.
*   **👥 Perfis de Acesso (RBAC):**
    *   **USER:** Cria e acompanha seus tickets.
    *   **LEADER:** Gerencia tickets da sua unidade.
    *   **ADMIN:** Controle total, gestão de usuários e configurações globais.

---

## ☁️ Guia de Hospedagem e Deploy

Este projeto é uma **SPA (Single Page Application)** construída com Vite. Abaixo está a lista oficial de provedores testados e **100% compatíveis** com a arquitetura do projeto e integração contínua (CI/CD) com GitHub.

### 🏆 Top 5 Provedores Recomendados

| Ranking | Provedor | Compatibilidade | Integração GitHub | Custo (Tier Grátis) | Dificuldade |
| :--- | :--- | :---: | :---: | :--- | :---: |
| 🥇 **1º** | **Vercel** | **100%** | ✅ Automática | Grátis Ilimitado (Hobby) | ⭐ (Muito Fácil) |
| 🥈 **2º** | **Netlify** | **100%** | ✅ Automática | Grátis Generoso | ⭐ (Muito Fácil) |
| 🥉 **3º** | **Firebase Hosting** | **100%** | ✅ Via GitHub Actions | Grátis (Spark) | ⭐⭐ (Médio) |
| **4º** | **Cloudflare Pages** | **100%** | ✅ Automática | Grátis Ilimitado | ⭐⭐ (Médio) |
| **5º** | **Render** | **98%*** | ✅ Automática | Grátis (Limitado) | ⭐⭐⭐ (Requer Config) |

> ***Render Nota:** Requer configuração manual de regra de reescrita (Rewrite) para SPAs direcionando todas as rotas para `index.html`.

### ⚠️ Configuração Importante para Deploy

Como o projeto usa **React Router**, ao hospedar, você deve garantir que o servidor redirecione todas as requisições para o `index.html` (Regra de SPA).

*   **Vercel / Cloudflare:** Configuração automática (Zero Config).
*   **Netlify:** O projeto já inclui (ou você deve criar) um arquivo `_redirects` na pasta `public` com o conteúdo: `/* /index.html 200`.
*   **Firebase:** Configurar `rewrites` no `firebase.json`.

---

## ⚙️ Instalação e Execução Local

Siga este guia se você é um desenvolvedor e deseja rodar o projeto na sua máquina.

### 1. Pré-requisitos
*   Node.js (Versão 18 ou superior)
*   NPM ou Yarn

### 2. Instalação
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/link-request.git

# Entre na pasta
cd link-request

# Instale as dependências
npm install
```

### 3. Rodando o Projeto
```bash
npm run dev
```
O projeto abrirá em `http://localhost:5173`.

### 4. Configuração Inicial (Setup Wizard)
Ao abrir o sistema pela primeira vez, você verá a tela de **Instalação do Sistema**.
1.  Defina o nome da empresa e crie o Admin.
2.  **Banco de Dados:** O sistema pedirá o JSON de configuração do Firebase.
    *   Vá ao [Console do Firebase](https://console.firebase.google.com/).
    *   Crie um projeto Web e copie o objeto `const firebaseConfig = { ... }`.
    *   Cole esse código na tela de instalação do Link-Request.

---

## 🛠️ Tecnologias

<div style="display: flex; gap: 10px;">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" />
</div>

