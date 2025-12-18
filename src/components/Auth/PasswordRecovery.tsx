import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Lock, Eye, EyeOff, Phone, HelpCircle, Shield } from 'lucide-react';
import { EmailService } from '../../services/emailService';
import { supabase } from '../../lib/supabase';

interface PasswordRecoveryProps {
  onBack: () => void;
  onSuccess: () => void;
  isStaffLogin?: boolean;
}

interface SecurityQuestion {
  id: number;
  question_text: string;
}

export function PasswordRecovery({ onBack, onSuccess, isStaffLogin = false }: PasswordRecoveryProps) {
  const [step, setStep] = useState<'method' | 'email' | 'sms' | 'security' | 'newPassword' | 'success'>('method');
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'sms' | 'security'>('email');
  const [identifier, setIdentifier] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [foundUser, setFoundUser] = useState<any>(null);
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);
  const [securityAnswers, setSecurityAnswers] = useState<{ [key: number]: string }>({});

  const handleMethodSelection = () => {
    setError('');
    if (recoveryMethod === 'email') {
      setStep('email');
    } else if (recoveryMethod === 'sms') {
      setStep('sms');
    } else if (recoveryMethod === 'security') {
      setStep('security');
    }
  };

  const handleFindUser = async () => {
    if (!identifier.trim()) {
      setError('Por favor, insira o seu email, telefone ou username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Procurar utilizador na base de dados
      const { data: users, error } = await supabase
        .from('users')
        .select('id, username, email, phone_number, user_type')
        .or(`email.eq.${identifier},username.eq.${identifier},phone_number.eq.${identifier}`)
        .limit(1);

      if (error) throw error;

      if (!users || users.length === 0) {
        // Não revelar se o utilizador existe ou não (segurança)
        setError('Se o email/telefone/username estiver registado, receberá instruções de recuperação.');
        setLoading(false);
        return;
      }

      const user = users[0];
      
      // Verificar se é o tipo de utilizador correto
      if (isStaffLogin && user.user_type === 'client') {
        setError('Esta área é apenas para staff/admin. Clientes devem usar a área de cliente.');
        setLoading(false);
        return;
      }

      if (!isStaffLogin && (user.user_type === 'therapist' || user.user_type === 'admin')) {
        setError('Esta área é apenas para clientes. Staff/admin devem usar a área administrativa.');
        setLoading(false);
        return;
      }

      setFoundUser(user);

      if (recoveryMethod === 'email') {
        await handleSendRecoveryEmail(user);
      } else if (recoveryMethod === 'sms') {
        await handleSendRecoverySMS(user);
      } else if (recoveryMethod === 'security') {
        await handleLoadSecurityQuestions(user);
      }

    } catch (error: any) {
      console.error('Error finding user:', error);
      setError('Erro ao processar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRecoveryEmail = async (user: any) => {
    try {
      // Gerar token de recuperação
      const token = generateSecureToken();
      const tokenHash = await hashToken(token);
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

      // Guardar token na base de dados
      const { error } = await supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      // Enviar email de recuperação
      const recoveryEmail = {
        subject: 'Recuperação de Password - Desperto',
        body: `
Olá,

Recebemos um pedido para redefinir a password da sua conta na Desperto.

🔐 **Link de Recuperação:**
${window.location.origin}/reset-password?token=${token}

⏰ **Importante:** Este link é válido por 30 minutos e só pode ser usado uma vez.

Se não solicitou esta alteração, pode ignorar este email. A sua conta permanece segura.

**Dicas de Segurança:**
• Nunca partilhe este link com ninguém
• Certifique-se de que está no site oficial da Desperto
• Use uma password forte e única

Se tiver dificuldades, contacte-nos através de euestoudesperto@gmail.com

Cumprimentos,
Equipa Desperto
        `
      };

      await EmailService.sendEmail(user.email, recoveryEmail);
      setResetToken(token);
      setStep('email');

    } catch (error) {
      console.error('Error sending recovery email:', error);
      setError('Erro ao enviar email de recuperação. Tente novamente.');
    }
  };

  const handleSendRecoverySMS = async (user: any) => {
    if (!user.phone_number) {
      setError('Este utilizador não tem número de telefone registado. Use recuperação por email.');
      return;
    }

    try {
      // Gerar código de 6 dígitos
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedCode(code);

      // Guardar código na base de dados (como token)
      const tokenHash = await hashToken(code);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      const { error } = await supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      // Enviar SMS (simulado)
      const smsMessage = `Desperto: O seu código de recuperação é ${code}. Válido por 15 minutos. Não partilhe este código.`;
      await EmailService.sendSMS(user.phone_number, smsMessage);
      
      setStep('sms');

    } catch (error) {
      console.error('Error sending recovery SMS:', error);
      setError('Erro ao enviar SMS de recuperação. Tente novamente.');
    }
  };

  const handleLoadSecurityQuestions = async (user: any) => {
    try {
      // Carregar perguntas de segurança do utilizador
      const { data: userQuestions, error } = await supabase
        .from('security_questions')
        .select(`
          question_id,
          predefined_security_questions!inner(id, question_text)
        `)
        .eq('user_id', user.id)
        .limit(3);

      if (error) throw error;

      if (!userQuestions || userQuestions.length === 0) {
        setError('Este utilizador não tem perguntas de segurança configuradas. Use recuperação por email.');
        return;
      }

      const questions = userQuestions.map(uq => ({
        id: uq.question_id,
        question_text: (uq.predefined_security_questions as any).question_text
      }));

      setSecurityQuestions(questions);
      setStep('security');

    } catch (error) {
      console.error('Error loading security questions:', error);
      setError('Erro ao carregar perguntas de segurança. Use recuperação por email.');
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Por favor, insira o código de verificação');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Verificar código na base de dados
      const tokenHash = await hashToken(verificationCode);
      
      const { data: tokens, error } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('user_id', foundUser.id)
        .eq('token_hash', tokenHash)
        .eq('used', false)
        .gte('expires_at', new Date().toISOString())
        .limit(1);

      if (error) throw error;

      if (!tokens || tokens.length === 0) {
        setError('Código inválido ou expirado');
        setLoading(false);
        return;
      }

      setResetToken(verificationCode);
      setStep('newPassword');

    } catch (error) {
      console.error('Error verifying code:', error);
      setError('Erro ao verificar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySecurityQuestions = async () => {
    setLoading(true);
    setError('');

    try {
      // Verificar respostas das perguntas de segurança
      let allCorrect = true;

      for (const question of securityQuestions) {
        const userAnswer = securityAnswers[question.id];
        if (!userAnswer) {
          setError('Por favor, responda a todas as perguntas');
          setLoading(false);
          return;
        }

        const answerHash = await hashToken(userAnswer.toLowerCase().trim());
        
        const { data: storedAnswers, error } = await supabase
          .from('security_questions')
          .select('answer_hash')
          .eq('user_id', foundUser.id)
          .eq('question_id', question.id)
          .limit(1);

        if (error) throw error;

        if (!storedAnswers || storedAnswers.length === 0 || storedAnswers[0].answer_hash !== answerHash) {
          allCorrect = false;
          break;
        }
      }

      if (!allCorrect) {
        setError('Uma ou mais respostas estão incorretas');
        setLoading(false);
        return;
      }

      // Gerar token temporário para redefinição
      const token = generateSecureToken();
      setResetToken(token);
      setStep('newPassword');

    } catch (error) {
      console.error('Error verifying security questions:', error);
      setError('Erro ao verificar respostas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      setError('Por favor, insira a nova password');
      return;
    }

    if (newPassword.length < 6) {
      setError('A password deve ter pelo menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As passwords não coincidem');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Hash da nova password
      const passwordHash = await hashToken(newPassword);

      // Atualizar password na base de dados
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: passwordHash,
          failed_login_attempts: 0,
          lockout_until: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', foundUser.id);

      if (updateError) throw updateError;

      // Marcar token como usado (se aplicável)
      if (step === 'newPassword' && resetToken) {
        const tokenHash = await hashToken(resetToken);
        await supabase
          .from('password_reset_tokens')
          .update({ used: true })
          .eq('user_id', foundUser.id)
          .eq('token_hash', tokenHash);
      }

      // Enviar email de confirmação
      const confirmationEmail = {
        subject: 'Password Alterada com Sucesso - Desperto',
        body: `
Olá,

A password da sua conta Desperto foi alterada com sucesso.

📅 **Data/Hora:** ${new Date().toLocaleString('pt-PT')}
🌐 **IP:** ${await getUserIP()}

Se não foi você que alterou a password, contacte-nos imediatamente através de euestoudesperto@gmail.com

**Dicas de Segurança:**
• Use uma password única para a Desperto
• Ative a verificação em duas etapas nas definições da conta
• Nunca partilhe a sua password

Cumprimentos,
Equipa Desperto
        `
      };

      await EmailService.sendEmail(foundUser.email, confirmationEmail);

      setStep('success');

    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Erro ao alterar password. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const generateSecureToken = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  };

  const hashToken = async (token: string): Promise<string> => {
    // Simular hash (em produção, usar bcrypt no backend)
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const getUserIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'Desconhecido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {step === 'method' && 'Recuperar Password'}
          {step === 'email' && 'Verificar Email'}
          {step === 'sms' && 'Verificar SMS'}
          {step === 'security' && 'Perguntas de Segurança'}
          {step === 'newPassword' && 'Nova Password'}
          {step === 'success' && 'Password Alterada'}
        </h3>
        <p className="text-gray-600 text-sm">
          {step === 'method' && 'Escolha como deseja recuperar a sua password'}
          {step === 'email' && 'Enviámos um link de recuperação para o seu email'}
          {step === 'sms' && 'Enviámos um código para o seu telefone'}
          {step === 'security' && 'Responda às suas perguntas de segurança'}
          {step === 'newPassword' && 'Defina a sua nova password'}
          {step === 'success' && 'A sua password foi alterada com sucesso'}
        </p>
      </div>

      {/* Step 1: Choose Recovery Method */}
      {step === 'method' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email, Telefone ou Username
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={isStaffLogin ? "Email ou username de staff" : "seu@email.com ou username"}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Método de Recuperação
            </label>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="recoveryMethod"
                  value="email"
                  checked={recoveryMethod === 'email'}
                  onChange={(e) => setRecoveryMethod(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <Mail className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">Email</div>
                  <div className="text-sm text-gray-500">Receber link de recuperação por email</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="recoveryMethod"
                  value="sms"
                  checked={recoveryMethod === 'sms'}
                  onChange={(e) => setRecoveryMethod(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <Phone className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">SMS</div>
                  <div className="text-sm text-gray-500">Receber código por SMS</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="recoveryMethod"
                  value="security"
                  checked={recoveryMethod === 'security'}
                  onChange={(e) => setRecoveryMethod(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <HelpCircle className="w-5 h-5 text-purple-600" />
                <div>
                  <div className="font-medium text-gray-900">Perguntas de Segurança</div>
                  <div className="text-sm text-gray-500">Responder às suas perguntas de segurança</div>
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleFindUser}
            disabled={loading || !identifier.trim()}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Continuar</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 2a: Email Sent */}
      {step === 'email' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Email Enviado</span>
            </div>
            <p className="text-blue-800 text-sm mt-1">
              Enviámos um link de recuperação para <strong>{foundUser?.email}</strong>
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-900">Próximos Passos</span>
            </div>
            <ol className="text-amber-800 text-sm mt-2 space-y-1 list-decimal list-inside">
              <li>Verifique a sua caixa de entrada (e pasta de spam)</li>
              <li>Clique no link "Redefinir Password"</li>
              <li>O link é válido por 30 minutos</li>
            </ol>
          </div>

          <div className="text-center">
            <button
              onClick={() => handleSendRecoveryEmail(foundUser)}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Reenviar Email
            </button>
          </div>
        </div>
      )}

      {/* Step 2b: SMS Code Verification */}
      {step === 'sms' && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">SMS Enviado</span>
            </div>
            <p className="text-green-800 text-sm mt-1">
              Enviámos um código para <strong>{foundUser?.phone_number}</strong>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código de Verificação
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleVerifyCode}
            disabled={loading || !verificationCode.trim()}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verificando...' : 'Verificar Código'}
          </button>

          <div className="text-center">
            <button
              onClick={() => handleSendRecoverySMS(foundUser)}
              disabled={loading}
              className="text-blue-600 hover:text-blue-800 font-medium text-sm"
            >
              Reenviar SMS
            </button>
          </div>
        </div>
      )}

      {/* Step 2c: Security Questions */}
      {step === 'security' && (
        <div className="space-y-4">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <span className="font-medium text-purple-900">Perguntas de Segurança</span>
            </div>
            <p className="text-purple-800 text-sm mt-1">
              Responda às suas perguntas de segurança para verificar a sua identidade
            </p>
          </div>

          <div className="space-y-4">
            {securityQuestions.map((question, index) => (
              <div key={question.id}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {index + 1}. {question.question_text}
                </label>
                <input
                  type="text"
                  value={securityAnswers[question.id] || ''}
                  onChange={(e) => setSecurityAnswers(prev => ({
                    ...prev,
                    [question.id]: e.target.value
                  }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="A sua resposta..."
                />
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleVerifySecurityQuestions}
            disabled={loading || securityQuestions.some(q => !securityAnswers[q.id])}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Verificando...' : 'Verificar Respostas'}
          </button>
        </div>
      )}

      {/* Step 3: New Password */}
      {step === 'newPassword' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nova Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nova password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Confirmar password"
                required
              />
            </div>
          </div>

          {/* Password Strength Indicator */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-gray-700 text-sm font-medium mb-2">Requisitos da Password:</p>
            <ul className="text-gray-600 text-xs space-y-1">
              <li className={newPassword.length >= 6 ? 'text-green-600' : ''}>
                • Mínimo 6 caracteres {newPassword.length >= 6 && '✓'}
              </li>
              <li className={/[A-Z]/.test(newPassword) ? 'text-green-600' : ''}>
                • Pelo menos uma letra maiúscula {/[A-Z]/.test(newPassword) && '✓'}
              </li>
              <li className={/[a-z]/.test(newPassword) ? 'text-green-600' : ''}>
                • Pelo menos uma letra minúscula {/[a-z]/.test(newPassword) && '✓'}
              </li>
              <li className={/[0-9]/.test(newPassword) ? 'text-green-600' : ''}>
                • Pelo menos um número {/[0-9]/.test(newPassword) && '✓'}
              </li>
              <li className={newPassword === confirmPassword && newPassword ? 'text-green-600' : ''}>
                • Passwords devem coincidir {newPassword === confirmPassword && newPassword && '✓'}
              </li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleResetPassword}
            disabled={loading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Alterando...' : 'Alterar Password'}
          </button>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-green-900 mb-2">Password Alterada!</h3>
            <p className="text-green-700">
              A sua password foi alterada com sucesso. Receberá um email de confirmação.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Dicas de Segurança</span>
            </div>
            <ul className="text-green-800 text-sm space-y-1 text-left">
              <li>• Use uma password única para a Desperto</li>
              <li>• Considere ativar a verificação em duas etapas</li>
              <li>• Nunca partilhe a sua password</li>
            </ul>
          </div>

          <button
            onClick={onSuccess}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            Voltar ao Login
          </button>
        </div>
      )}

      {/* Back Button (except on success step) */}
      {step !== 'success' && (
        <button
          onClick={step === 'method' ? onBack : () => setStep('method')}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </button>
      )}
    </div>
  );
}