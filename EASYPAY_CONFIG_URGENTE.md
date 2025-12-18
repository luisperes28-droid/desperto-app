# Configuração URGENTE - Easypay MB WAY

## Problema
A mensagem "Contact administrator to configure Easypay" aparece porque as variáveis de ambiente não estão configuradas no Supabase.

## SOLUÇÃO RÁPIDA (2 minutos)

### Passo 1: Aceder às Configurações
Abra este link no navegador:
```
https://supabase.com/dashboard/project/dnswlrvleqvsueawxzfy/settings/functions
```

### Passo 2: Adicionar Variáveis de Ambiente
Na secção **"Edge Function Secrets"**, clique em **"Add new secret"** e adicione:

**Primeira variável:**
- Name: `EASYPAY_ACCOUNT_ID`
- Value: `998699971`

**Segunda variável:**
- Name: `EASYPAY_API_KEY`
- Value: `65cf2bcb-d572-4155-811e-38fdc5d3ef13`

### Passo 3: Guardar
Clique em **"Save"** ou **"Add secret"** para cada variável.

### Passo 4: Testar
Recarregue a aplicação e tente fazer um pagamento MB WAY novamente. Deve funcionar imediatamente.

---

## O que acontece?
A Edge Function `easypay-mbway` precisa destas credenciais para comunicar com a API do Easypay. Sem elas, retorna o erro que está a ver.

## Confirmação
Depois de adicionar as variáveis, a função vai:
1. ✅ Aceitar o número de telemóvel
2. ✅ Criar o pedido de pagamento no Easypay
3. ✅ Enviar notificação para a app MB WAY do cliente
4. ✅ Confirmar quando o pagamento for aprovado

---

**NOTA:** O ficheiro `.env` local já está configurado, mas as Edge Functions no Supabase precisam das suas próprias variáveis de ambiente configuradas no dashboard.
