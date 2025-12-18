# 🚀 Guia Completo de Deploy - Aplicação Desperto

## Objetivo
Colocar a aplicação online para que clientes reais possam aceder através de um URL público.

---

## 📋 Pré-requisitos

Antes de começar, precisa de:
- ✅ Computador com internet
- ✅ Email válido
- ✅ 30-45 minutos de tempo disponível
- ✅ Acesso ao ficheiro `.env` do projeto

---

## PARTE 1: Preparar o Código (5 minutos)

### Passo 1.1: Verificar se Git está instalado

Abra o terminal/linha de comandos e execute:

```bash
git --version
```

**Se aparecer uma versão** (ex: `git version 2.x.x`):
- ✅ Continue para o Passo 1.2

**Se der erro "comando não encontrado"**:
- 📥 Descarregue Git em: https://git-scm.com/downloads
- Instale e reinicie o terminal
- Execute `git --version` novamente

### Passo 1.2: Configurar Git (primeira vez apenas)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

**Importante:** Use o mesmo email que vai usar no GitHub.

### Passo 1.3: Inicializar repositório Git

Na pasta do projeto, execute:

```bash
git init
```

Deve aparecer: `Initialized empty Git repository...`

### Passo 1.4: Adicionar todos os ficheiros

```bash
git add .
```

**Nota:** O ponto (.) significa "todos os ficheiros"

### Passo 1.5: Criar primeiro commit

```bash
git commit -m "Aplicação Desperto pronta para produção"
```

Deve aparecer uma lista de ficheiros adicionados.

---

## PARTE 2: Criar Conta GitHub (10 minutos)

### Passo 2.1: Registar-se no GitHub

1. Vá a: **https://github.com**
2. Clique no botão **"Sign up"** (canto superior direito)
3. Preencha:
   - **Email:** Use o mesmo do Git
   - **Password:** Escolha uma senha forte
   - **Username:** Escolha um nome de utilizador único
4. Complete a verificação (puzzle)
5. Clique **"Create account"**
6. Verifique o email e clique no link de confirmação

### Passo 2.2: Criar novo repositório

1. No GitHub, clique no **"+"** (canto superior direito)
2. Selecione **"New repository"**
3. Preencha:
   - **Repository name:** `desperto-app`
   - **Description:** "Aplicação de agendamentos Desperto"
   - **Visibilidade:** ✅ **Public** (para deploy gratuito)
   - **NÃO marque** "Add a README file"
4. Clique **"Create repository"**

### Passo 2.3: Copiar comandos de conexão

O GitHub vai mostrar uma página com instruções. Copie os comandos da secção:

**"...or push an existing repository from the command line"**

Deve ser algo como:

```bash
git remote add origin https://github.com/SEU-USERNAME/desperto-app.git
git branch -M main
git push -u origin main
```

### Passo 2.4: Executar comandos

Cole os 3 comandos no terminal (um de cada vez).

**Se pedir autenticação:**
- Username: seu username do GitHub
- Password: **NÃO use a senha da conta!** Use um "Personal Access Token"

#### Como criar Personal Access Token:

1. No GitHub, vá a: **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Clique **"Generate new token"** → **"Generate new token (classic)"**
3. Preencha:
   - **Note:** "Deploy Desperto"
   - **Expiration:** 90 days
   - **Marque:** ✅ `repo` (todos os sub-items)
4. Clique **"Generate token"**
5. **COPIE O TOKEN** (só aparece uma vez!)
6. Use este token como password no terminal

### Passo 2.5: Verificar upload

1. Recarregue a página do repositório no GitHub
2. Deve ver todos os ficheiros da aplicação listados
3. ✅ Se vir os ficheiros, está pronto!

---

## PARTE 3: Deploy no Netlify (15 minutos)

### Passo 3.1: Criar conta Netlify

1. Vá a: **https://www.netlify.com**
2. Clique **"Sign up"**
3. Escolha **"Sign up with GitHub"** (mais simples)
4. Autorize a conexão
5. Confirme o email se pedido

### Passo 3.2: Criar novo site

1. No dashboard Netlify, clique **"Add new site"**
2. Selecione **"Import an existing project"**
3. Escolha **"Deploy with GitHub"**
4. Se pedir autorização, clique **"Authorize Netlify"**

### Passo 3.3: Selecionar repositório

1. Procure por `desperto-app` na lista
2. Clique no repositório
3. Se não aparecer, clique **"Configure the Netlify app on GitHub"** e dê permissões

### Passo 3.4: Configurar build settings

Na página de configuração, preencha:

- **Branch to deploy:** `main`
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Build settings:** Deixe as outras opções como estão

### Passo 3.5: Adicionar variáveis de ambiente

**MUITO IMPORTANTE!** Sem isto a aplicação não funciona.

1. Clique em **"Show advanced"**
2. Clique **"New variable"**
3. Adicione TODAS estas variáveis (uma por uma):

#### Variável 1: Supabase URL
- **Key:** `VITE_SUPABASE_URL`
- **Value:** [Copie do ficheiro `.env` local]

#### Variável 2: Supabase Key
- **Key:** `VITE_SUPABASE_ANON_KEY`
- **Value:** [Copie do ficheiro `.env` local]

#### Variável 3: EmailJS Service ID
- **Key:** `VITE_EMAILJS_SERVICE_ID`
- **Value:** [Copie do ficheiro `.env` local]

#### Variável 4: EmailJS Template ID
- **Key:** `VITE_EMAILJS_TEMPLATE_ID`
- **Value:** [Copie do ficheiro `.env` local]

#### Variável 5: EmailJS Public Key
- **Key:** `VITE_EMAILJS_PUBLIC_KEY`
- **Value:** [Copie do ficheiro `.env` local]

**Como encontrar os valores no `.env`:**

Abra o ficheiro `.env` na raiz do projeto e copie os valores após o `=`

Exemplo:
```
VITE_SUPABASE_URL=https://exemplo.supabase.co
```
Copie apenas: `https://exemplo.supabase.co`

### Passo 3.6: Iniciar deploy

1. Verifique que todas as 5 variáveis estão adicionadas
2. Clique **"Deploy [nome-do-site]"**
3. Aguarde 2-5 minutos
4. Acompanhe o progresso na secção "Deploy log"

### Passo 3.7: Verificar status

Quando o deploy terminar:

- ✅ **Success:** Vai ver "Site is live"
- ❌ **Failed:** Vá para secção "Problemas Comuns" abaixo

---

## PARTE 4: Testar a Aplicação (5 minutos)

### Passo 4.1: Abrir o site

1. No dashboard Netlify, copie o URL do site
2. Deve ser algo como: `https://nome-aleatorio-123.netlify.app`
3. Abra o URL num browser

### Passo 4.2: Testes básicos

Execute estes testes:

#### Teste 1: Página inicial carrega
- ✅ Deve ver o site Desperto
- ✅ Sem erros no ecrã

#### Teste 2: Login funciona
- Vá para a área de login
- Tente fazer login com credenciais de teste
- ✅ Deve conseguir entrar

#### Teste 3: Ver agendamentos
- Entre no dashboard
- ✅ Deve ver calendário e reservas

#### Teste 4: Teste de dispositivo móvel
- Abra o URL no telemóvel
- ✅ Deve ser responsivo e funcional

---

## PARTE 5: Configurar Domínio Próprio (Opcional)

### Se quiser usar seu próprio domínio:

1. No Netlify, vá a **"Domain settings"**
2. Clique **"Add custom domain"**
3. Digite seu domínio (ex: `desperto.pt`)
4. Siga as instruções para configurar DNS
5. Aguarde propagação (pode demorar até 48h)

---

## 🎉 Parabéns! Aplicação Online

O seu site está agora acessível em:
- 🌐 URL Netlify: `https://seu-site.netlify.app`
- 📱 Funciona em todos os dispositivos
- 🔒 HTTPS ativado automaticamente
- 🔄 Atualizações automáticas (quando fizer push no GitHub)

---

## 🔧 Problemas Comuns

### Problema 1: Deploy falhou
**Sintomas:** Build failed, erro vermelho

**Soluções:**
1. Verifique se todas as variáveis de ambiente estão corretas
2. Confirme que não há espaços antes/depois dos valores
3. Vá a "Deploys" → "Deploy settings" → "Environment variables"
4. Clique "Trigger deploy" → "Clear cache and deploy site"

### Problema 2: Página branca
**Sintomas:** Site carrega mas está em branco

**Soluções:**
1. Abra o console do browser (F12 → Console)
2. Procure erros relacionados com Supabase
3. Provavelmente falta variável de ambiente
4. Adicione a variável e faça re-deploy

### Problema 3: Login não funciona
**Sintomas:** Erro ao fazer login

**Soluções:**
1. Verifique se `VITE_SUPABASE_URL` está correto
2. Verifique se `VITE_SUPABASE_ANON_KEY` está correto
3. Confirme que o URL não tem `/` no final
4. Faça re-deploy após corrigir

### Problema 4: Emails não são enviados
**Sintomas:** Reservas funcionam mas sem emails

**Soluções:**
1. Verifique as 3 variáveis EmailJS
2. Confirme que o serviço EmailJS está ativo
3. Teste envio manual no dashboard EmailJS

### Problema 5: Git push falha
**Sintomas:** Erro ao fazer push

**Soluções:**
1. Confirme que criou Personal Access Token
2. Use token como password (não a senha da conta)
3. Execute: `git remote -v` para verificar URL
4. Se necessário, remova e adicione novamente:
   ```bash
   git remote remove origin
   git remote add origin https://github.com/SEU-USERNAME/desperto-app.git
   ```

---

## 📊 Monitorização e Manutenção

### Como ver estatísticas de uso:

1. No Netlify: **Analytics** → Ver visitantes, páginas, etc.
2. No Supabase: **Dashboard** → Ver uso de base de dados

### Como fazer updates:

1. Faça alterações no código local
2. Execute:
   ```bash
   git add .
   git commit -m "Descrição da alteração"
   git push
   ```
3. Netlify faz deploy automático em 2-3 minutos

### Como fazer rollback (voltar versão anterior):

1. No Netlify, vá a **"Deploys"**
2. Encontre o deploy anterior que funcionava
3. Clique nos 3 pontos → **"Publish deploy"**

---

## 📞 Suporte Adicional

Se encontrar problemas:

1. **Logs do Netlify:** Vá a "Deploys" → Clique no deploy → "Deploy log"
2. **Logs do Supabase:** Dashboard Supabase → "Logs"
3. **Console do Browser:** F12 → Console (para erros frontend)

---

## ✅ Checklist Final

Antes de considerar completo, confirme:

- [ ] Código está no GitHub
- [ ] Site está no ar (URL Netlify)
- [ ] Página inicial carrega sem erros
- [ ] Login funciona
- [ ] Dashboard é acessível
- [ ] Pode criar/ver agendamentos
- [ ] Testado no telemóvel
- [ ] Todas as variáveis de ambiente configuradas
- [ ] HTTPS está ativo (cadeado no browser)

---

## 🎯 Próximos Passos Recomendados

1. **Configurar domínio próprio** (ex: `www.desperto.pt`)
2. **Testar com clientes reais** (beta testers)
3. **Configurar Google Analytics** (monitorar visitas)
4. **Backup da base de dados** (Supabase faz automaticamente)
5. **Documentar processos internos** (manual para equipa)

---

**Data do Guia:** Dezembro 2024
**Versão:** 1.0
**Aplicação:** Desperto - Sistema de Agendamentos

---

## 💡 Dica Final

Guarde bem:
- ✅ URL do site publicado
- ✅ Credenciais GitHub
- ✅ Acesso Netlify
- ✅ Personal Access Token (em local seguro)
- ✅ Ficheiro `.env` (NUNCA publique no GitHub!)

**Sucesso com a aplicação!** 🚀
