<div align="center">

# 👨‍🏫 NSTeacher

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=for-the-badge&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-6.4-2D3748?style=for-the-badge&logo=prisma)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)

> **Plataforma completa para gestão de professores com IA integrada, autenticação segura e notificações em tempo real.**

</div>

---

## ✨ Funcionalidades

- 🔐 **Autenticação segura** — Login com sessão, 2FA (TOTP) e proteção de rotas
- 👨‍💼 **Painel Admin** — Gestão completa de professores, ativação de contas e configurações
- 👩‍🏫 **Painel do Professor** — Área dedicada para professores gerenciarem suas atividades
- 🤖 **IA Integrada** — Suporte a OpenAI, Anthropic Claude e xAI Grok
- 📧 **Notificações por Email** — SMTP configurável com Nodemailer
- 🔔 **Push Notifications** — Firebase Cloud Messaging para notificações em tempo real
- 🔄 **Recuperação de Senha** — Fluxo completo de forgot/reset password via email
- 🎨 **UI Moderna** — Tailwind CSS + Radix UI + Framer Motion
- 🛡️ **Segurança Avançada** — Headers CSP, HSTS, XSS Protection, CSRF protection

---

## 🚀 Começando

### Pré-requisitos

- **Node.js** 18+
- **npm** ou **pnpm**

### Instalação

```bash
# Clone o repositório
git clone https://github.com/brunoklebewdaw/nsteacher.git
cd nsteacher

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas credenciais

# Gere o cliente Prisma
npx prisma generate

# Execute as migrações do banco
npx prisma migrate dev
```

### Rodando o projeto

```bash
# Desenvolvimento (porta 5001)
npm run dev

# Desenvolvimento (porta 5000)
npm run dev:5000

# Produção
npm run build
npm start
```

---

## 🔑 Variáveis de Ambiente

| Variável | Descrição | Obrigatório |
|---|---|:---:|
| `SESSION_SECRET` | Chave secreta para sessões (min. 32 caracteres) | ✅ |
| `INTERNAL_API_KEY` | Chave API para proteção de endpoints | ✅ |
| `ALLOWED_HOSTS` | Hosts permitidos (separados por vírgula) | ✅ |
| `ADMIN_EMAIL` | Email do administrador | ✅ |
| `ADMIN_PASSWORD` | Senha do administrador | ✅ |
| `DATABASE_URL` | URL do banco de dados SQLite | ✅ |
| `OPENAI_API_KEY` | Chave API da OpenAI | ❌ |
| `ANTHROPIC_API_KEY` | Chave API da Anthropic | ❌ |
| `GROK_API_KEY` | Chave API da xAI Grok | ❌ |
| `EMAIL_USER` / `EMAIL_PASS` | Credenciais SMTP | ❌ |
| `NEXT_PUBLIC_FIREBASE_*` | Configurações do Firebase | ❌ |

---

## 📁 Estrutura do Projeto

```
nsteacher/
├── src/
│   ├── app/              # Rotas Next.js (App Router)
│   │   ├── admin/        # Painel administrativo
│   │   ├── teacher/      # Painel do professor
│   │   ├── login/        # Autenticação
│   │   ├── activate/     # Ativação de conta
│   │   ├── forgot-password/
│   │   ├── reset-password/
│   │   └── api/          # API Routes
│   ├── components/       # Componentes React reutilizáveis
│   ├── actions/          # Server Actions
│   ├── lib/              # Utilitários e configurações
│   └── types/            # Definições de tipos TypeScript
├── prisma/
│   └── schema.prisma     # Schema do banco de dados
├── public/               # Arquivos estáticos
└── .env.example          # Template de variáveis de ambiente
```

---

## 🛠️ Tecnologias

| Categoria | Tecnologias |
|---|---|
| **Framework** | Next.js 16, React 19 |
| **Linguagem** | TypeScript 5.8 |
| **Estilização** | Tailwind CSS, Radix UI, Framer Motion |
| **Banco de Dados** | SQLite + Prisma ORM |
| **IA** | OpenAI, Anthropic Claude, xAI Grok |
| **Autenticação** | JWT (jose), Bcrypt, TOTP (otplib) |
| **Notificações** | Nodemailer (email), Firebase (push) |
| **Validação** | Zod, React Hook Form |
| **Utilitários** | date-fns, lucide-react, QR Code |

---

## 📄 Licença

Este projeto é de uso privado. Todos os direitos reservados.

---

<div align="center">
  Feito com ❤️ por <strong>Bruno Klebe</strong>
</div>
