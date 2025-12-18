# 🚀 Desperto - Instruções de Configuração

## 📋 Passos para Configurar o Supabase

### 1. 🗄️ Executar a Migration SQL
1. Vá ao [Supabase Dashboard](https://supabase.com/dashboard/project/scztvsxakexamtsmsrou)
2. Clique em **SQL Editor** no menu lateral
3. Copie todo o conteúdo do arquivo `supabase/migrations/create_complete_schema.sql`
4. Cole no editor SQL e clique em **Run**

### 2. 📦 Instalar Dependências
Execute no terminal do projeto:
```bash
npm install @supabase/supabase-js
```

### 3. 🔐 Verificar Arquivo .env
O arquivo `.env` já está configurado com:
```env
VITE_SUPABASE_URL=https://scztvsxakexamtsmsrou.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjenR2c3hha2V4YW10c21zcm91Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2MDU4MjAsImV4cCI6MjA3MzE4MTgyMH0.gCyw20IRy1aPculhxndz9lBFpoZJbg1yiQ8gV2qNQpk
```

### 4. 🚀 Iniciar a Aplicação
```bash
npm run dev
```

## 👤 Utilizadores de Teste

### Administrador Padrão:
- **Username:** `luis_peres`
- **Password:** `admin123`
- **Email:** `luis@desperto.com`

### Criar Novo Cliente:
Use o formulário de registo na aplicação

## ✅ Funcionalidades Implementadas

- ✅ **Autenticação Completa** (username/password)
- ✅ **Proteção de Rotas** (só utilizadores autenticados acedem)
- ✅ **Políticas RLS** (segurança a nível de linha)
- ✅ **Tipos de Utilizador** (cliente, terapeuta, admin)
- ✅ **Gestão de Perfis**
- ✅ **Sistema de Agendamentos**
- ✅ **Gestão de Pagamentos**
- ✅ **Notas de Terapeuta**

## 🔧 Resolução de Problemas

### Erro "syntax error at or near npm"
- ❌ **Não execute comandos npm no SQL Editor**
- ✅ **Execute apenas código SQL no Supabase**
- ✅ **Execute comandos npm no terminal do projeto**

### Erro de Conexão
- Verifique se o arquivo `.env` está correto
- Confirme se a migration SQL foi executada
- Reinicie o servidor de desenvolvimento

## 📞 Suporte
Se encontrar problemas, verifique:
1. Migration SQL executada com sucesso
2. Dependências instaladas (`npm install`)
3. Arquivo `.env` configurado
4. Servidor reiniciado após mudanças