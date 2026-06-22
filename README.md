# FinancasMes - Dashboard de Controle Financeiro

Dashboard financeiro pessoal com design bege/marrom e modo noturno.

## Contas pre-cadastradas
- Pedro: pedro@finance.com / pedro123
- Sabrina: sabrina@finance.com / sabrina123

## Deploy na Vercel

### 1. Banco de dados - Vercel Postgres
No painel da Vercel: Storage > Create > Postgres
Copie a DATABASE_URL gerada.

### 2. Variaveis de ambiente
No painel do projeto > Settings > Environment Variables:
- DATABASE_URL = URL do Vercel Postgres
- JWT_SECRET = string secreta longa (ex: openssl rand -base64 32)

### 3. Build command (em Settings > General)
npx prisma generate && npx prisma db push && next build

### 4. Seed (primeira vez, via terminal local com env vars):
npx prisma db seed

## Desenvolvimento local
npm install
cp .env.example .env
# Preencha .env com sua DATABASE_URL
npx prisma db push
npx prisma db seed
npm run dev

## Funcionalidades
- Login/Cadastro com JWT
- Inserir, editar e excluir despesas
- Categorias personalizaveis (pre-cadastradas: Transporte, Alimentacao, Contas do Mes, Compras)
- Formas de pagamento: PIX, Debito, Credito (credito vai pro proximo mes)
- Salario mensal com calculo de saldo (pode ficar negativo)
- Graficos: linha por dia, pizza por categoria, barras por pagamento
- Modo noturno com paleta cafe/ambar
- Totalmente responsivo
