# Problema: Login não funciona em Produção

## Diagnóstico

✅ **Base de dados:** Funciona perfeitamente
✅ **Função authenticate_user:** Funciona corretamente
✅ **Credenciais:** Testadas e verificadas
❌ **Problema:** Variáveis de ambiente não são carregadas em produção

## Causa

Quando publicas a aplicação (ex: Netlify, Vercel), o ficheiro `.env` **NÃO é enviado** por razões de segurança. Tens que configurar as variáveis de ambiente diretamente na plataforma de hosting.

## Solução

### Se usares Netlify:

1. Vai a https://app.netlify.com
2. Seleciona o teu site
3. Vai a "Site settings" → "Environment variables"
4. Adiciona estas 2 variáveis:

```
VITE_SUPABASE_URL=https://dnswlrvleqvsueawxzfy.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRuc3dscnZsZXF2c3VlYXd4emZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODEyMjIsImV4cCI6MjA3NDk1NzIyMn0.bsg6sfD9d2CT5EiiGWOKtl1FeaeN1DnDYiUtLeqkOmQ
```

5. Clica "Save"
6. Vai a "Deploys" → "Trigger deploy" → "Clear cache and deploy site"

### Se usares Vercel:

1. Vai a https://vercel.com/dashboard
2. Seleciona o teu projeto
3. Vai a "Settings" → "Environment Variables"
4. Adiciona as mesmas 2 variáveis acima
5. Clica "Save"
6. Vai a "Deployments" → clica nos 3 pontos → "Redeploy"

### Se usares outro hosting:

Procura na documentação como adicionar "Environment Variables" ou "Build Environment Variables".

## Credenciais de Teste (depois de configurar)

### Admin
- **Email:** euestoudesperto@gmail.com
- **Password:** Dhvif2m1

### Cliente
- **Email:** cliente@teste.com
- **Password:** 123456

## Verificação

Depois de configurar as variáveis e fazer redeploy:

1. Abre o site publicado
2. Abre as Developer Tools (F12)
3. Vai ao Console
4. Deves ver: `✅ Supabase Configuration Loaded`
5. Tenta fazer login

Se ainda não funcionar, verifica no Console se aparece algum erro.
