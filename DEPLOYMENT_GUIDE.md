# Guia de Deployment - Desperto

## IMPORTANTE: Por que o login não funciona em produção?

O ficheiro `.env` **NÃO é enviado** quando publicas a aplicação por razões de segurança. Tens que configurar as variáveis de ambiente **DIRETAMENTE na plataforma de hosting** (Netlify, Vercel, etc.).

## Como Publicar a Aplicação

### 1. Configurar Variáveis de Ambiente

Quando publicares a aplicação (ex: Netlify, Vercel, etc.), **TENS QUE** configurar estas variáveis de ambiente:

```
VITE_SUPABASE_URL=https://dnswlrvleqvsueawxzfy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuc3dscnZsZXF2c3VlYXd4emZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NDEyMjgLCJleHAiOjIwNTAwMTcyMjh9.bsg6sfD9d2CT5EiiGWOKtl1FeaeN1DnDYiUtLeqkOmQ
```

### 2. Plataformas de Deployment

#### Netlify
1. Vai a https://app.netlify.com
2. Seleciona o teu site
3. Vai a **Site settings → Environment variables**
4. Clica em "Add a variable"
5. Adiciona `VITE_SUPABASE_URL` com o valor acima
6. Adiciona `VITE_SUPABASE_ANON_KEY` com o valor acima
7. Clica "Save"
8. Vai a **Deploys → Trigger deploy → Clear cache and deploy site**

#### Vercel
1. Vai a https://vercel.com/dashboard
2. Seleciona o teu projeto
3. Vai a **Settings → Environment Variables**
4. Adiciona `VITE_SUPABASE_URL` com o valor acima
5. Adiciona `VITE_SUPABASE_ANON_KEY` com o valor acima
6. Clica "Save"
7. Vai a **Deployments** → clica nos 3 pontos → "Redeploy"

#### Outras Plataformas
Procura por "Environment Variables" ou "Build Environment" nas configurações do projeto.

### 3. Build Command

```bash
npm run build
```

### 4. Output Directory

```
dist
```

## Credenciais de Login de Teste

Podes usar estas credenciais para testar após deployment:

### Admin
- Email: `euestoudesperto@gmail.com`
- Password: `Dhvif2m1`

### Cliente
- Email: `cliente@teste.com`
- Password: `123456`

### Terapeuta
- Email: `luisperes28@gmail.com`
- Password: `Dhvif2m0`

## Verificar se Está a Funcionar

1. Abre a consola do browser (F12)
2. Deves ver: `✅ Supabase Configuration Loaded`
3. Se vires `❌ CRITICAL: Missing Supabase environment variables!`, as variáveis não foram configuradas corretamente

## Troubleshooting

### Erro: "Missing required Supabase environment variables"
- Verifica que configuraste as variáveis de ambiente na plataforma de hosting
- Verifica que os nomes estão corretos (começam com `VITE_`)
- Faz redeploy após adicionar as variáveis

### Login não funciona
- Abre a consola e verifica se há erros de rede
- Verifica se o URL do Supabase está correto
- Verifica se a base de dados tem utilizadores (pelo menos 9 users)

### "Network error" ao fazer login
- Verifica se o Supabase está online
- Verifica se a função `authenticate_user` existe na base de dados
- Verifica se a extensão `pgcrypto` está instalada no Supabase
