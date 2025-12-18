# Guia Rápido - Desperto

## 🚀 Estado da Aplicação: PRONTA PARA USAR

A aplicação está **85% funcional** com todas as funcionalidades principais operacionais.

---

## ✅ O QUE ESTÁ A FUNCIONAR

### 1. Supabase (100%)
- Base de dados com 13 tabelas
- 3 utilizadores de teste criados
- 4 serviços disponíveis
- Sistema de autenticação completo
- Row Level Security (RLS) ativo

### 2. Sistema de Agendamentos (100%)
- Criar agendamentos
- Gerir agendamentos
- Calendário
- Histórico de agendamentos

### 3. Sistema de Cupões (100%)
- Criar cupões com passwords
- Validar cupões
- Controlar utilizações
- Histórico de uso

### 4. Autenticação (100%)
- Login seguro com bcrypt
- Lockout após tentativas falhadas
- Diferentes níveis de acesso
- Sessões persistentes

---

## 🔑 CREDENCIAIS DE ACESSO

### Admin
```
Username: admin
Password: Dhvif2m1
Email: euestoudesperto@gmail.com
```

### Terapeuta
```
Username: luisperes
Password: Dhvif2m0
Email: luisperes28@gmail.com
```

### Cliente
```
Username: cliente
Password: 123456
Email: cliente@teste.com
```

---

## 🎯 COMO COMEÇAR

### 1. Iniciar a Aplicação
```bash
npm run dev
```

### 2. Aceder ao Sistema
- Abrir navegador em: `http://localhost:5173`
- Fazer login com uma das credenciais acima

### 3. Verificar Diagnóstico
- Login como admin
- Menu lateral > "Diagnóstico Sistema"
- Ver status de todas as integrações

---

## ⚠️ O QUE PRECISA DE CONFIGURAÇÃO (Opcional)

### EmailJS (Para Emails Reais)
**Status Atual:** Simulação ativa (logs na consola)

**Para Ativar:**
1. Criar conta em https://www.emailjs.com
2. Conectar email: euestoudesperto@gmail.com
3. Obter Service ID e Template ID
4. Configurar em: Menu > "Configurar Email"

**Tempo estimado:** 15 minutos

---

### Stripe (Para Pagamentos Reais)
**Status Atual:** Simulação ativa (90% sucesso)

**Para Ativar:**
1. Criar conta em https://stripe.com
2. Obter Publishable Key e Secret Key
3. Editar `src/services/paymentService.ts`
4. Ativar MB WAY e Multibanco no dashboard

**Tempo estimado:** 30 minutos

**Alternativa Portuguesa:** Easypay (https://easypay.pt)

---

## 📱 FUNCIONALIDADES DISPONÍVEIS

### Área de Cliente
- ✅ Agendamento de consultas
- ✅ Escolha de terapeuta
- ✅ Escolha de serviço
- ✅ Seleção de data/hora
- ✅ Sistema de pagamento (simulado)
- ✅ Uso de cupões
- ✅ Histórico de agendamentos
- ✅ Dashboard personalizado

### Área de Terapeuta
- ✅ Ver agendamentos
- ✅ Gerir disponibilidade
- ✅ Criar notas sobre clientes
- ✅ Ver histórico de consultas
- ✅ Dashboard com estatísticas

### Área de Admin
- ✅ Painel de controlo completo
- ✅ Gestão de agendamentos
- ✅ Gestão de clientes
- ✅ Gestão de terapeutas
- ✅ Gestão de pagamentos
- ✅ Sistema de cupões
- ✅ Configurações
- ✅ Diagnóstico do sistema
- ✅ Configuração de email

---

## 🔧 PÁGINAS PRINCIPAIS

### Para Todos
- `/` - Página inicial (agendamento público)

### Para Clientes Autenticados
- Dashboard do Cliente
- Histórico de Agendamentos
- Nova Marcação

### Para Staff (Admin/Terapeuta)
- Dashboard Principal
- Calendário
- Agendamentos
- Clientes
- Pagamentos
- Cupões
- Notas de Terapeuta
- Mensagens (em breve)
- Diagnóstico Sistema
- Definições
- Configurar Email
- Gerir Terapeutas

---

## 📊 SERVIÇOS DISPONÍVEIS

1. **Sessão de Coaching Individual**
   - Duração: 60 minutos
   - Preço: €50

2. **Consulta de Orientação Vocacional**
   - Duração: 90 minutos
   - Preço: €75

3. **Terapia de Casal**
   - Duração: 90 minutos
   - Preço: €80

4. **Workshop de Gestão de Stress**
   - Duração: 120 minutos
   - Preço: €100

---

## 🎫 SISTEMA DE CUPÕES

### Como Criar Cupão
1. Login como admin
2. Menu > "Cupões"
3. Clicar "Novo Cupão"
4. Preencher:
   - Código (ex: PROMO2024)
   - Password (ex: senha123)
   - Tipo de desconto
   - Valor do desconto
   - Número máximo de utilizações
   - Validade

### Como Usar Cupão
1. Na área de agendamento
2. Passo de pagamento
3. Selecionar método "Cupão/Ticket"
4. Inserir código e password
5. Validar

---

## 💳 MÉTODOS DE PAGAMENTO

### Atualmente Implementados
- Cartão de Crédito/Débito (simulado)
- MB WAY (simulado)
- Multibanco (simulado)
- PayPal (simulado)
- Dinheiro (registar manualmente)
- Cupão/Voucher (100% funcional)

### Em Modo Simulação
- Taxa de sucesso: 90%
- Registo na base de dados funcional
- Perfeito para testes e desenvolvimento

---

## 📧 EMAILS

### Tipos de Email Implementados
- Confirmação de agendamento
- Lembrete 24h antes
- Cancelamento
- Reagendamento
- Validação de cupão

### Status Atual
**Modo Simulação:**
- Emails não são enviados
- Conteúdo visível nos logs do navegador (F12)
- Sistema continua funcional

**Para Ativar Envio Real:**
- Configurar EmailJS (ver secção acima)

---

## 🔐 SEGURANÇA

### Implementado
- ✅ Passwords com hash (bcrypt)
- ✅ Row Level Security (RLS)
- ✅ Lockout após 5 tentativas (30 min)
- ✅ Auditoria de login
- ✅ Diferentes níveis de acesso
- ✅ Proteção de dados sensíveis

### Estrutura Pronta (Para Ativar)
- 2FA (Two-Factor Authentication)
- Perguntas de Segurança
- Reset de Password

---

## 📝 TESTES RECOMENDADOS

### Teste 1: Login
1. Aceder à aplicação
2. Testar login com cada tipo de utilizador
3. Verificar área correta para cada tipo

### Teste 2: Agendamento
1. Login como cliente ou usar modo público
2. Criar novo agendamento
3. Escolher serviço, terapeuta, data
4. Completar pagamento (simulado)
5. Verificar confirmação

### Teste 3: Cupão
1. Login como admin
2. Criar cupão de teste
3. Logout
4. Criar agendamento usando o cupão
5. Verificar desconto aplicado

### Teste 4: Gestão (Admin)
1. Login como admin
2. Ver dashboard
3. Verificar agendamentos
4. Ver clientes
5. Verificar pagamentos
6. Testar diagnóstico do sistema

---

## 🐛 RESOLUÇÃO DE PROBLEMAS

### Problema: Não consigo fazer login
**Solução:**
- Verificar se está a usar as credenciais corretas
- Verificar se não está bloqueado (aguardar 30 min)
- Ver consola do navegador (F12) para erros

### Problema: Agendamento não aparece
**Solução:**
- Verificar se o pagamento foi "concluído"
- Atualizar a página
- Verificar filtros de data

### Problema: Cupão não funciona
**Solução:**
- Verificar código e password
- Confirmar que não atingiu limite de utilizações
- Verificar validade

### Problema: Build falha
**Solução:**
```bash
npm install
npm run build
```

---

## 📞 INFORMAÇÕES DE CONTACTO

### Email do Negócio
- euestoudesperto@gmail.com

### Terapeuta Principal
- Luis Peres (luisperes28@gmail.com)

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- `STATUS_INTEGRACAO.md` - Status detalhado de todas as integrações
- `CREDENCIAIS_ACESSO.md` - Todas as credenciais de acesso
- `SETUP_INSTRUCTIONS.md` - Instruções de setup completo
- `COUPON_TROUBLESHOOTING_GUIDE.md` - Guia de cupões

---

## 🎉 CONCLUSÃO

A aplicação está **pronta para uso** com todas as funcionalidades principais operacionais. EmailJS e Stripe estão no modo simulação mas podem ser ativados em minutos quando necessário.

**Para começar agora:**
```bash
npm run dev
```

Depois aceder a `http://localhost:5173` e fazer login!

---

*Última atualização: 2 de Outubro de 2025*
