# gestao-financeira

Aplicacao com frontend React/Vite, backend Spring Boot e autenticacao/banco no Supabase.

## Requisitos

- Node.js 20.19+
- Java 21+
- Maven 3.9+
- Projeto criado no Supabase

## Configurar o Supabase

1. Abra o SQL Editor do Supabase.
2. Execute o arquivo `supabase/schema.sql`.
3. Copie a URL e a chave publica do projeto em `Settings > API Keys`.

Crie `frontend/.env.local`:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
VITE_API_BASE_URL=http://localhost:8085
```

Defina as variaveis do backend no terminal ou na configuracao da IDE:

```powershell
$env:SUPABASE_URL="https://seu-projeto.supabase.co"
$env:SUPABASE_ANON_KEY="sua-chave-anon-publica"
```

Use somente a chave publica/anon nesse fluxo. O backend encaminha o token do usuario para o Supabase, e as politicas RLS limitam cada usuario aos proprios dados.

## Executar localmente

Backend:

```powershell
cd backend
mvn.cmd spring-boot:run
```

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

- Frontend: `http://localhost:5173`
- Healthcheck: `http://localhost:8085/api/health`

## Deploy do frontend na Vercel

O frontend esta pronto para deploy na Vercel usando a pasta `frontend` como Root Directory.

Configuracao recomendada na Vercel:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: `dist`

Se a Vercel mostrar `react-scripts build`, remova essa configuracao manual. Este projeto usa Vite, nao Create React App.

Variaveis de ambiente na Vercel:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-publica
VITE_API_BASE_URL=https://sua-api-em-producao.com
```

Depois de cadastrar as variaveis, faca o redeploy do projeto na Vercel.

No Supabase, configure tambem a URL publicada pela Vercel em `Authentication > URL Configuration`:

- Site URL: `https://seu-frontend.vercel.app`
- Redirect URLs: `https://seu-frontend.vercel.app/**`

## Docker

Copie o arquivo `.env.docker.example` para `.env` e preencha as chaves do Supabase:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-publica-anon

VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica-anon
```

Suba a aplicacao com Docker Compose:

```bash
docker compose up --build
```

URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8085/api/health`

Para parar:

```bash
docker compose down
```

## Funcionalidades

- Login e cadastro de usuario com Supabase Auth
- Sessao persistente e logout
- Cadastro de entradas e saidas
- Listagem, edicao e exclusao de movimentacoes
- Resumo de entradas, saidas e saldo
- Isolamento dos dados por usuario com Row Level Security