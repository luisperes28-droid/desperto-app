import { supabase } from '../lib/supabase';

export interface LoginResult {
  success: boolean;
  user?: any;
  error?: string;
  requiresTwoFactor?: boolean;
  isLocked?: boolean;
  lockoutUntil?: Date;
}

export class AuthService {
  static async login(username: string, password: string, userType?: 'client' | 'therapist' | 'admin'): Promise<LoginResult> {
    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Serviço de autenticação indisponível. Por favor, verifique a configuração.'
        };
      }

      // Verificar se a conta está bloqueada
      const lockoutCheck = await this.checkAccountLockout(username);
      if (lockoutCheck.isLocked) {
        return {
          success: false,
          error: `Conta bloqueada. Tente novamente em ${Math.ceil((lockoutCheck.lockoutUntil!.getTime() - Date.now()) / 60000)} minutos.`,
          isLocked: true,
          lockoutUntil: lockoutCheck.lockoutUntil
        };
      }

      // USAR FUNÇÃO DO SUPABASE para autenticar com bcrypt
      const { data: authResult, error: authError } = await supabase
        .rpc('authenticate_user', {
          p_identifier: username,
          p_password: password
        });

      if (authError || !authResult || !authResult.success) {
        // Tentar encontrar o user para incrementar failed attempts
        const { data: users } = await supabase
          .from('users')
          .select('id')
          .or(`email.eq.${username},username.eq.${username}`)
          .limit(1);

        if (users && users.length > 0) {
          const failedAttempts = await this.handleFailedLogin(users[0].id, username);
          return {
            success: false,
            error: `Credenciais incorretas. Restam ${Math.max(0, 5 - failedAttempts)} tentativas.`
          };
        }

        return { success: false, error: authResult?.error || 'Credenciais incorretas' };
      }

      const authenticatedUser = authResult.user;

      // Verificar tipo de utilizador se especificado
      if (userType && authenticatedUser.user_type !== userType) {
        return {
          success: false,
          error: userType === 'client'
            ? 'Esta área é apenas para clientes'
            : 'Esta área é apenas para staff/admin'
        };
      }

      // Set user context for RLS before making queries
      try {
        await supabase.rpc('set_current_user', { user_id: authenticatedUser.id });
      } catch (error) {
        console.error(error);
      }

      // Verificar se 2FA está ativado
      const { data: twoFactor } = await supabase
        .from('two_factor_auth_settings')
        .select('*')
        .eq('user_id', authenticatedUser.id)
        .eq('enabled', true)
        .limit(1);

      if (twoFactor && twoFactor.length > 0) {
        await this.send2FACode(authenticatedUser);
        return {
          success: false,
          requiresTwoFactor: true,
          error: 'Código de verificação enviado'
        };
      }

      // Login bem-sucedido
      await this.handleSuccessfulLogin(authenticatedUser.id);

      return {
        success: true,
        user: {
          id: authenticatedUser.id,
          username: authenticatedUser.username,
          email: authenticatedUser.email,
          userType: authenticatedUser.user_type,
          fullName: authenticatedUser.full_name || authenticatedUser.username
        }
      };

    } catch (error) {
      console.error(error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  static async checkAccountLockout(username: string) {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('lockout_until')
        .or(`email.eq.${username},username.eq.${username}`)
        .limit(1);

      if (error || !users || users.length === 0) {
        return { isLocked: false };
      }

      const user = users[0];
      if (user.lockout_until) {
        const lockoutUntil = new Date(user.lockout_until);
        if (lockoutUntil > new Date()) {
          return { isLocked: true, lockoutUntil };
        }
      }

      return { isLocked: false };
    } catch (error) {
      console.error(error);
      return { isLocked: false };
    }
  }

  static async handleFailedLogin(userId: string, username: string): Promise<number> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('failed_login_attempts')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const newFailedAttempts = (user.failed_login_attempts || 0) + 1;
      
      let updateData: any = {
        failed_login_attempts: newFailedAttempts
      };

      // Bloquear conta após 5 tentativas
      if (newFailedAttempts >= 5) {
        const lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
        updateData.lockout_until = lockoutUntil.toISOString();
      }

      await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId);

      
      return newFailedAttempts;
    } catch (error) {
      console.error(error);
      return 1;
    }
  }

  static async handleSuccessfulLogin(userId: string) {
    try {
      const userAgent = navigator.userAgent;
      const ipResponse = await fetch('https://api.ipify.org?format=json');
      const { ip } = await ipResponse.json();

      // Reset failed attempts e atualizar último login
      await supabase
        .from('users')
        .update({
          failed_login_attempts: 0,
          lockout_until: null,
          last_login_at: new Date().toISOString(),
          last_login_ip: ip
        })
        .eq('id', userId);


    } catch (error) {
      console.error(error);
    }
  }


  static async send2FACode(user: any) {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    const tokenHash = await this.hashToken(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString()
      });

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (user.phone_number) {
      try {
        await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: user.phone_number,
            message: `Desperto: O seu codigo de verificacao 2FA e ${code}. Valido por 10 minutos.`
          })
        });
      } catch (error) {
        console.error(error);
      }
    }

    try {
      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_email: user.email,
          subject: 'Codigo de Verificacao - Desperto',
          message: `O seu codigo de verificacao e: ${code}\n\nEste codigo e valido por 10 minutos.\nSe nao solicitou este codigo, ignore esta mensagem.`
        })
      });
    } catch (error) {
      console.error(error);
    }
  }

  static async requestPasswordReset(identifier: string, method: 'email' | 'sms' | 'security'): Promise<{ success: boolean; error?: string }> {
    try {
      // Procurar utilizador
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${identifier},username.eq.${identifier},phone_number.eq.${identifier}`)
        .limit(1);

      if (error || !users || users.length === 0) {
        // Não revelar se o utilizador existe
        return { success: true };
      }

      const user = users[0];

      if (method === 'email') {
        return await this.sendPasswordResetEmail(user);
      } else if (method === 'sms') {
        return await this.sendPasswordResetSMS(user);
      } else if (method === 'security') {
        return await this.loadSecurityQuestions(user);
      }

      return { success: false, error: 'Método inválido' };

    } catch (error) {
      console.error(error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }

  static async sendPasswordResetEmail(user: any): Promise<{ success: boolean; error?: string }> {
    try {
      const token = this.generateSecureToken();
      const tokenHash = await this.hashToken(token);
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

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to_email: user.email,
          subject: 'Recuperacao de Password - Desperto',
          message: `Recebemos um pedido para redefinir a password da sua conta.\n\nLink de Recuperacao:\n${window.location.origin}/reset-password?token=${token}\n\nEste link e valido por 30 minutos e so pode ser usado uma vez.\n\nSe nao solicitou esta alteracao, pode ignorar este email.`
        })
      });

      return { success: true };

    } catch (error) {
      console.error(error);
      return { success: false, error: 'Erro ao enviar email' };
    }
  }

  static async sendPasswordResetSMS(user: any): Promise<{ success: boolean; error?: string }> {
    if (!user.phone_number) {
      return { success: false, error: 'Utilizador não tem telefone registado' };
    }

    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const tokenHash = await this.hashToken(code);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      // Guardar código na base de dados
      const { error } = await supabase
        .from('password_reset_tokens')
        .insert({
          user_id: user.id,
          token_hash: tokenHash,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: user.phone_number,
          message: `Desperto: O seu codigo de recuperacao e ${code}. Valido por 15 minutos.`
        })
      });

      return { success: true };

    } catch (error) {
      console.error(error);
      return { success: false, error: 'Erro ao enviar SMS' };
    }
  }

  static async loadSecurityQuestions(user: any): Promise<{ success: boolean; error?: string; questions?: any[] }> {
    try {
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
        return { success: false, error: 'Utilizador não tem perguntas de segurança configuradas' };
      }

      const questions = userQuestions.map(uq => ({
        id: uq.question_id,
        question_text: (uq.predefined_security_questions as any).question_text
      }));

      return { success: true, questions };

    } catch (error) {
      console.error(error);
      return { success: false, error: 'Erro ao carregar perguntas de segurança' };
    }
  }

  static generateSecureToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }

  static async hashToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async signUp(email: string, password: string, fullName: string, phone?: string): Promise<LoginResult> {
    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Serviço de autenticação indisponível.'
        };
      }

      // Verificar se email já existe
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .limit(1);

      if (existingUsers && existingUsers.length > 0) {
        return {
          success: false,
          error: 'Email já registado.'
        };
      }

      // Gerar username a partir do email (parte antes do @)
      const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      // Criar hash da password
      const { data: hashData } = await supabase.rpc('hash_password', {
        password: password
      });

      if (!hashData) {
        return {
          success: false,
          error: 'Erro ao processar password.'
        };
      }

      // Criar novo utilizador
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          username,
          email,
          password_hash: hashData,
          user_type: 'client',
          phone_number: phone,
          is_active: true
        })
        .select()
        .single();

      if (createError || !newUser) {
        return {
          success: false,
          error: 'Erro ao criar conta.'
        };
      }

      // Criar perfil do utilizador
      await supabase
        .from('user_profiles')
        .insert({
          user_id: newUser.id,
          full_name: fullName,
          phone: phone
        });

      return {
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          userType: newUser.user_type,
          fullName: fullName
        }
      };

    } catch (error) {
      console.error(error);
      return { success: false, error: 'Erro interno do servidor' };
    }
  }
}