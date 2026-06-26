#  gestao-financeira

Aplicacao com frontend React/Vite, backend Spring Boot e autenticacao/banco no Supabase.

## Requisitos

- Node.js 20+
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
VITE_API_BASE_URL=http://localhost:8080
```

Defina as variaveis do backend no terminal ou na configuracao da IDE:

```powershell
$env:SUPABASE_URL="https://seu-projeto.supabase.co"
$env:SUPABASE_ANON_KEY="sua-chave-anon-publica"
```

Use somente a chave publica/anon nesse fluxo. O backend encaminha o token do usuario para o Supabase, e as politicas RLS limitam cada usuario aos proprios dados.

## Executar

Backend:

```powershell
cd backend
mvn spring-boot:run
```

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

- Frontend: `http://localhost:5173`
- Healthcheck: `http://localhost:8080/api/health`

## Funcionalidades

- Login e cadastro de usuario com Supabase Auth
- Sessao persistente e logout
- Cadastro de entradas e saidas
- Listagem, edicao e exclusao de movimentacoes
- Resumo de entradas, saidas e saldo
- Isolamento dos dados por usuario com Row Level Security
# gerenciamento-gastos
