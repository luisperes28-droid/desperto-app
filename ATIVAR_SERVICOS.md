# Como Ativar EmailJS e Stripe

Guia passo-a-passo para ativar o envio de emails reais e pagamentos reais na aplicação Desperto.

---

## 📧 ATIVAR EMAILJS (15 minutos)

### Passo 1: Criar Conta EmailJS

1. Aceder a https://www.emailjs.com
2. Clicar em "Sign Up" (ou "Start for Free")
3. Criar conta com email: `euestoudesperto@gmail.com`
4. Confirmar email

### Passo 2: Adicionar Serviço de Email

1. No dashboard do EmailJS, clicar em "Email Services"
2. Clicar em "Add New Service"
3. Selecionar "Gmail"
4. Conectar a conta Gmail: `euestoudesperto@gmail.com`
5. Autorizar acesso
6. **COPIAR o Service ID** (formato: `service_xxxxxxx`)

### Passo 3: Criar Template de Email

1. No dashboard, clicar em "Email Templates"
2. Clicar em "Create New Template"
3. Dar nome ao template: "Desperto Booking Confirmation"
4. Configurar o template:

**Subject:**
```
{{subject}}
```

**Content:**
```html
<p>Olá,</p>

<p>{{message}}</p>

<p>Cumprimentos,<br>
Equipa Desperto<br>
{{from_email}}</p>
```

5. Em "Settings":
   - From Name: `Desperto`
   - From Email: `{{from_email}}`
   - To Email: `{{to_email}}`
   - Reply To: `{{reply_to}}`

6. Clicar em "Save"
7. **COPIAR o Template ID** (formato: `template_xxxxxxx`)

### Passo 4: Obter Public Key

1. No dashboard, clicar em "Account"
2. Ir para "General" tab
3. **COPIAR o Public Key** (formato: letras e números)

### Passo 5: Configurar na Aplicação

1. Iniciar a aplicação: `npm run dev`
2. Fazer login como admin (admin / Dhvif2m1)
3. Ir para menu "Configurar Email"
4. Preencher:
   - **Service ID:** (do Passo 2)
   - **Template ID:** (do Passo 3)
   - **Google OAuth Client ID:** (manter o que está)
   - **Google OAuth Client Secret:** (manter o que está)
5. Clicar em "Guardar Configuração"

### Passo 6: Testar

1. Criar um agendamento de teste
2. Verificar inbox de `euestoudesperto@gmail.com`
3. Confirmar recebimento do email

### Problemas Comuns

**Erro: "Invalid service ID"**
- Verificar se copiou o Service ID correto
- Verificar se não tem espaços no início/fim

**Erro: "Template not found"**
- Verificar se o template está ativo no EmailJS
- Verificar se copiou o Template ID correto

**Emails não chegam**
- Verificar pasta de spam
- Verificar quota mensal (300 emails grátis)
- Ver logs no dashboard do EmailJS

---

## 💳 ATIVAR STRIPE (30 minutos)

### Opção A: Stripe (Recomendado)

#### Passo 1: Criar Conta Stripe

1. Aceder a https://stripe.com
2. Clicar em "Start now" ou "Sign up"
3. Criar conta com email do negócio
4. Confirmar email
5. **Manter em modo "Test"** para começar

#### Passo 2: Obter Chaves de Teste

1. No dashboard, ir para "Developers"
2. Clicar em "API keys"
3. Ver as chaves de teste:
   - **Publishable key** (começa com `pk_test_`)
   - **Secret key** (começa com `sk_test_`)
4. **COPIAR ambas as chaves**

#### Passo 3: Ativar Métodos Portugueses

1. No dashboard, ir para "Settings"
2. Clicar em "Payment methods"
3. Ativar:
   - ✅ Cards
   - ✅ MB WAY (se disponível)
   - ✅ Multibanco
4. Guardar alterações

#### Passo 4: Configurar na Aplicação

**Frontend:**

Editar `src/services/paymentService.ts`:

```typescript
// Linha 17
private static STRIPE_PUBLISHABLE_KEY = 'pk_test_SEU_PUBLISHABLE_KEY_AQUI';
```

**Backend (Necessário):**

Para Stripe funcionar completamente, precisa de um backend para criar Payment Intents:

1. Criar ficheiro `supabase/functions/create-payment-intent/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@14.0.0'

const stripe = new Stripe('sk_test_SEU_SECRET_KEY_AQUI', {
  apiVersion: '2023-10-16',
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { amount, currency, payment_method_types, metadata } = await req.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method_types,
      metadata,
    })

    return new Response(
      JSON.stringify({ client_secret: paymentIntent.client_secret }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
```

2. Deploy da função:
```bash
# Via Supabase CLI (se instalado)
supabase functions deploy create-payment-intent
```

#### Passo 5: Configurar Webhooks

1. No dashboard Stripe, ir para "Developers" > "Webhooks"
2. Clicar em "Add endpoint"
3. URL: `https://SEU_PROJETO.supabase.co/functions/v1/stripe-webhook`
4. Selecionar eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. **COPIAR o Webhook Secret**

#### Passo 6: Modo Produção

Quando pronto para aceitar pagamentos reais:

1. Completar verificação de conta no Stripe
2. Ativar modo Live
3. Obter novas chaves (começam com `pk_live_` e `sk_live_`)
4. Substituir no código
5. Testar com pagamento real pequeno

---

### Opção B: Easypay (Alternativa Portuguesa)

#### Passo 1: Criar Conta

1. Aceder a https://easypay.pt
2. Clicar em "Abrir conta"
3. Preencher dados da empresa
4. Aguardar aprovação (1-2 dias úteis)

#### Passo 2: Obter Credenciais

1. Aceder ao backoffice
2. Ir para "Configurações" > "API"
3. **COPIAR:**
   - Account ID
   - API Key

#### Passo 3: Configurar na Aplicação

Editar `src/services/paymentService.ts`:

```typescript
// Linha 18
private static EASYPAY_ACCOUNT_ID = 'SEU_ACCOUNT_ID';

// Linha 155
'AccountId': this.EASYPAY_ACCOUNT_ID,
'ApiKey': 'SUA_API_KEY',
```

#### Passo 4: Ativar Métodos

No backoffice Easypay:
1. Ir para "Métodos de Pagamento"
2. Ativar:
   - MB WAY
   - Multibanco
   - Cartões

---

## 🧪 TESTAR PAGAMENTOS

### Cartões de Teste Stripe

Para testar no modo test do Stripe:

**Cartão de Sucesso:**
- Número: `4242 4242 4242 4242`
- Data: Qualquer data futura
- CVC: Qualquer 3 dígitos
- Código postal: Qualquer

**Cartão com Erro:**
- Número: `4000 0000 0000 0002`
- Testa decline de cartão

**Cartão 3D Secure:**
- Número: `4000 0027 6000 3184`
- Testa autenticação adicional

### MB WAY de Teste

No modo teste, usar:
- Número: `+351 912 345 678`
- Código: `123456`

---

## 📊 MONITORIZAÇÃO

### EmailJS

Ver estatísticas em:
- Dashboard EmailJS > "Analytics"
- Emails enviados
- Taxa de entrega
- Erros

### Stripe

Ver transações em:
- Dashboard Stripe > "Payments"
- Ver todas as transações
- Filtrar por estado
- Exportar relatórios

---

## 💰 CUSTOS

### EmailJS
- **Grátis:** 300 emails/mês
- **Paid Plans:** A partir de $15/mês (1000 emails)

### Stripe
- **Setup:** Grátis
- **Por transação:** 1.4% + €0.25 (cartões europeus)
- **MB WAY:** ~2%
- **Sem taxas mensais**

### Easypay
- **Setup:** Grátis
- **Por transação:** 1.5% - 2.5%
- **Possível taxa mensal:** Consultar

---

## 🔒 SEGURANÇA

### Boas Práticas

1. **NUNCA** commitar chaves secretas no Git
2. Usar variáveis de ambiente para chaves
3. Manter chaves de test e live separadas
4. Renovar chaves periodicamente
5. Ativar notificações de transações suspeitas

### Ficheiro .env.local (Criar)

```env
# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# EmailJS
VITE_EMAILJS_SERVICE_ID=service_...
VITE_EMAILJS_TEMPLATE_ID=template_...
VITE_EMAILJS_PUBLIC_KEY=...

# Easypay (Opcional)
EASYPAY_ACCOUNT_ID=...
EASYPAY_API_KEY=...
```

---

## ✅ CHECKLIST FINAL

### EmailJS
- [ ] Conta criada
- [ ] Serviço Gmail conectado
- [ ] Template criado
- [ ] Service ID copiado
- [ ] Template ID copiado
- [ ] Public Key copiado
- [ ] Configurado na aplicação
- [ ] Email de teste enviado

### Stripe
- [ ] Conta criada
- [ ] Em modo test
- [ ] Publishable key copiada
- [ ] Secret key copiada
- [ ] Métodos de pagamento ativados
- [ ] Configurado na aplicação
- [ ] Backend/Edge Function criada
- [ ] Webhook configurado
- [ ] Pagamento de teste realizado

---

## 📞 SUPORTE

### EmailJS
- Documentação: https://www.emailjs.com/docs/
- Suporte: support@emailjs.com

### Stripe
- Documentação: https://stripe.com/docs
- Suporte: https://support.stripe.com

### Easypay
- Documentação: https://docs.easypay.pt
- Suporte: suporte@easypay.pt

---

## 🎯 NOTA IMPORTANTE

A aplicação **já funciona perfeitamente** sem estas configurações em modo simulação. Estas integrações são necessárias apenas quando quiser:

- 📧 Enviar emails reais para clientes
- 💳 Processar pagamentos reais
- 🚀 Colocar em produção

Para desenvolvimento e testes, pode continuar a usar o sistema como está!

---

*Última atualização: 2 de Outubro de 2025*
