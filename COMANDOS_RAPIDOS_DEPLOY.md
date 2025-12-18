# ⚡ Comandos Rápidos - Deploy

## Para copiar e colar rapidamente

### 1. Preparar Git (primeira vez)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

### 2. Inicializar e fazer primeiro commit

```bash
git init
git add .
git commit -m "Aplicação Desperto pronta para produção"
```

### 3. Conectar ao GitHub

```bash
git remote add origin https://github.com/SEU-USERNAME/desperto-app.git
git branch -M main
git push -u origin main
```

**Nota:** Substitua `SEU-USERNAME` pelo seu username do GitHub

### 4. Fazer updates futuros

```bash
git add .
git commit -m "Descrição da alteração"
git push
```

---

## Variáveis de Ambiente para Netlify

Copie estas keys e os valores do seu ficheiro `.env`:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_EMAILJS_SERVICE_ID
VITE_EMAILJS_TEMPLATE_ID
VITE_EMAILJS_PUBLIC_KEY
```

---

## Links Importantes

- **GitHub:** https://github.com
- **Netlify:** https://www.netlify.com
- **Criar Token GitHub:** https://github.com/settings/tokens
- **Supabase Dashboard:** https://supabase.com/dashboard

---

## Build Settings Netlify

```
Branch: main
Build command: npm run build
Publish directory: dist
```

---

## Verificar se Git está instalado

```bash
git --version
```

Se não estiver: https://git-scm.com/downloads

---

## Troubleshooting Rápido

### Re-deploy forçado
```bash
git commit --allow-empty -m "Force redeploy"
git push
```

### Ver status Git
```bash
git status
```

### Ver histórico
```bash
git log --oneline
```

### Ver remotes configurados
```bash
git remote -v
```

---

## Ordem de Execução (Resumo)

1. ✅ Instalar Git
2. ✅ Configurar Git (nome + email)
3. ✅ `git init` + `git add .` + `git commit`
4. ✅ Criar conta GitHub
5. ✅ Criar repositório no GitHub
6. ✅ `git remote add` + `git push`
7. ✅ Criar conta Netlify (com GitHub)
8. ✅ Import project do GitHub
9. ✅ Configurar build settings
10. ✅ Adicionar variáveis de ambiente
11. ✅ Deploy!

---

**Tempo total estimado:** 30-45 minutos
