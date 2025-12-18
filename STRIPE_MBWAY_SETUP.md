# Configuração MB WAY via Stripe

O MB WAY foi integrado através do Stripe para processar pagamentos de forma segura.

## Como Funciona

O sistema usa a integração Stripe Multibanco que suporta:
- **MB WAY**: Pagamento direto através do telemóvel
- **Multibanco**: Referência de pagamento como fallback

## Configuração Necessária

### 1. Criar Conta Stripe

1. Aceda a [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Crie uma conta para Portugal
3. Complete o processo de verificação

### 2. Ativar Métodos de Pagamento Portugueses

1. Aceda ao Dashboard: [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Vá a **Settings** > **Payment methods**
3. Ative **Multibanco** (que inclui MB WAY)
4. Configure os detalhes da sua conta bancária portuguesa

### 3. Obter Chaves API

1. Vá a **Developers** > **API keys**
2. Copie as seguintes chaves:
   - **Publishable key** (começa com `pk_`)
   - **Secret key** (começa com `sk_`)

### 4. Configurar Variáveis de Ambiente

#### No ficheiro `.env` (frontend):
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### No Supabase (Edge Functions):
1. Aceda ao [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá ao seu projeto > **Settings** > **Edge Functions**
3. Adicione a variável:
   - `STRIPE_SECRET_KEY=sk_test_...`

## Como Usar no Sistema

### Para Clientes

1. No passo de pagamento, escolha **MB WAY**
2. Insira o número de telemóvel (formato: 912345678 ou +351912345678)
3. Clique em **Pagar com MB WAY (Stripe)**
4. O pagamento será processado através do Stripe
5. Se MB WAY falhar, uma referência Multibanco será gerada automaticamente

### Fluxo de Pagamento

```
Cliente escolhe MB WAY
      ↓
Insere número de telemóvel
      ↓
Sistema cria Payment Intent no Stripe
      ↓
Stripe processa MB WAY
      ↓
Se sucesso: Pagamento confirmado
Se falha: Mostra referência Multibanco
```

## Funcionalidades Implementadas

- ✅ Integração com Stripe Payment Intents
- ✅ Suporte para MB WAY através do método Multibanco
- ✅ Validação de número de telemóvel português
- ✅ Normalização automática para formato E.164 (+351...)
- ✅ Fallback para referência Multibanco
- ✅ Armazenamento de pagamentos na base de dados
- ✅ Estados de pagamento (pending, paid, failed)

## Testes

### Modo Test (Desenvolvimento)

Use as chaves de teste (começam com `pk_test_` e `sk_test_`)

Números de teste Stripe:
- **Sucesso**: 4242 4242 4242 4242
- **Falha**: 4000 0000 0000 0002

### Modo Live (Produção)

1. Complete a ativação da conta Stripe
2. Use as chaves de produção (`pk_live_` e `sk_live_`)
3. Configure webhooks para atualizações de pagamento

## Webhooks (Opcional mas Recomendado)

Para receber notificações automáticas de pagamentos:

1. No Stripe Dashboard > **Developers** > **Webhooks**
2. Adicione endpoint: `https://[seu-projeto].supabase.co/functions/v1/stripe-webhook`
3. Selecione eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copie o **Webhook signing secret** e adicione ao Supabase

## Custos Stripe

- **Multibanco/MB WAY**: 0.5% + €0.25 por transação
- Sem custos mensais
- Apenas paga por transações bem-sucedidas

## Suporte e Documentação

- [Stripe Multibanco Documentation](https://stripe.com/docs/payments/multibanco)
- [Stripe Payment Intents](https://stripe.com/docs/payments/payment-intents)
- [Stripe Dashboard](https://dashboard.stripe.com)

## Troubleshooting

### Erro: "Stripe não inicializado"
- Verifique se `VITE_STRIPE_PUBLISHABLE_KEY` está no `.env`
- Confirme que a chave começa com `pk_`

### Erro: "Failed to create payment intent"
- Verifique se `STRIPE_SECRET_KEY` está configurada no Supabase
- Confirme que a Edge Function está deployed

### MB WAY não funciona
- Verifique se Multibanco está ativo no Stripe Dashboard
- Confirme que a conta Stripe está verificada
- Teste com número de telemóvel português válido

## Próximos Passos

1. Configure as chaves do Stripe
2. Teste em modo desenvolvimento
3. Ative a conta Stripe para produção
4. Configure webhooks para sincronização automática
5. Monitore pagamentos no Stripe Dashboard
