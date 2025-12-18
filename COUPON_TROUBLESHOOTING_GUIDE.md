# 🎫 Guia de Resolução de Problemas - Sistema de Cupões

## 📋 **Causas Potenciais de Mau Funcionamento**

### 1. **Problemas de Geração de Passwords**
- Password não está a ser gerada corretamente
- Formato incorreto (deve ser XXXX-XXXX)
- Passwords duplicadas no sistema
- Permissões insuficientes para criar cupões

### 2. **Problemas de Validação**
- Password inserida incorretamente pelo cliente
- Cupão expirado ou já utilizado
- Restrições de cliente ou serviço não cumpridas
- Erro na normalização da password (maiúsculas/minúsculas)

### 3. **Problemas de Permissões**
- Utilizador não é admin nem terapeuta
- Sessão expirada ou inválida
- Dados de utilizador corrompidos no localStorage

## 🔧 **Passos de Diagnóstico**

### **Passo 1: Verificar Permissões do Utilizador**
```javascript
// Verificar no console do browser
const user = JSON.parse(localStorage.getItem('desperto_user') || '{}');
console.log('Utilizador atual:', user);
console.log('Tipo de utilizador:', user.userType);
console.log('Pode criar cupões:', user.userType === 'admin' || user.userType === 'therapist');
```

### **Passo 2: Verificar Estado dos Cupões**
```javascript
// Verificar cupões existentes
const coupons = JSON.parse(localStorage.getItem('coupons') || '[]');
console.log('Cupões existentes:', coupons);
console.log('Cupões ativos:', coupons.filter(c => c.status === 'active'));
```

### **Passo 3: Testar Geração de Password**
```javascript
// Testar geração manual
import { CouponService } from './src/services/couponService';
const newPassword = CouponService.generateCouponPassword();
console.log('Password gerada:', newPassword);
```

### **Passo 4: Testar Validação de Cupão**
```javascript
// Testar validação
const validation = CouponService.validateCouponPassword(
  'ABCD-1234', // password de teste
  coupons,
  'service-id', // opcional
  'cliente@email.com', // opcional
  clients // opcional
);
console.log('Resultado da validação:', validation);
```

## 🛠️ **Soluções Específicas**

### **Problema 1: Terapeuta não consegue criar cupões**
**Solução:**
1. Verificar se está logado como terapeuta ou admin
2. Limpar localStorage se necessário: `localStorage.clear()`
3. Fazer login novamente
4. Verificar se aparece o menu "Cupões"

### **Problema 2: Password de cupão não funciona**
**Solução:**
1. Verificar formato: deve ser XXXX-XXXX
2. Confirmar que o cupão não expirou
3. Verificar se não foi já utilizado
4. Contactar o terapeuta para nova password

### **Problema 3: Cupão não aparece após criação**
**Solução:**
1. Atualizar a página (F5)
2. Verificar se foi guardado: `localStorage.getItem('coupons')`
3. Verificar console para erros JavaScript

### **Problema 4: Cliente específico não consegue usar cupão**
**Solução:**
1. Verificar se o email do cliente coincide
2. Confirmar se o cupão foi criado para "qualquer cliente" ou cliente específico
3. Verificar se o serviço coincide (se aplicável)

## 🔒 **Verificações de Segurança**

### **Controlo de Acesso:**
- ✅ Apenas admins e terapeutas podem criar cupões
- ✅ Cupões têm data de validade obrigatória
- ✅ Limite de utilizações configurável
- ✅ Auditoria completa de uso

### **Validações Implementadas:**
- ✅ Password única (sem duplicados)
- ✅ Formato padronizado (XXXX-XXXX)
- ✅ Verificação de expiração
- ✅ Controlo de limite de uso
- ✅ Restrições por cliente/serviço

## 📞 **Contacto para Suporte**

### **Para Terapeutas:**
1. Verificar se tem permissões de terapeuta
2. Contactar admin se não conseguir aceder
3. Verificar email para passwords de cupões criados

### **Para Clientes:**
1. Contactar o terapeuta para obter password
2. Verificar email/WhatsApp para password
3. Confirmar formato correto (XXXX-XXXX)

### **Para Administradores:**
1. Verificar logs do sistema
2. Limpar dados corrompidos se necessário
3. Recriar cupões se houver problemas

## 🚨 **Medidas Preventivas**

### **Para Evitar Problemas Futuros:**
1. **Backup regular:** Exportar dados dos cupões
2. **Formação:** Treinar terapeutas na criação de cupões
3. **Comunicação:** Protocolo claro para partilhar passwords
4. **Monitorização:** Verificar cupões expirados regularmente

### **Boas Práticas:**
- Criar cupões com validade adequada (não muito curta)
- Usar descrições claras nos cupões
- Comunicar passwords de forma segura
- Verificar dados antes de criar cupões

---

## 🎯 **Teste Rápido do Sistema**

### **Como Admin/Terapeuta:**
1. Login → Menu "Cupões"
2. Criar cupão → Copiar password gerada
3. Partilhar password com cliente

### **Como Cliente:**
1. Processo de agendamento normal
2. Escolher "Cupão/Ticket" no pagamento
3. Inserir password fornecida
4. Confirmar desconto aplicado

**Sistema totalmente funcional e seguro!** ✅