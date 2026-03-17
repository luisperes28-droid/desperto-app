import { SupabaseDataService } from './supabaseDataService';

export interface CouponValidationResult {
  isValid: boolean;
  coupon?: any;
  error?: string;
  discountAmount?: number;
}

export interface CouponGenerationData {
  type: 'percentage' | 'fixed_amount' | 'free_service';
  value: number;
  serviceId?: string;
  clientId?: string;
  validUntil: Date;
  usageLimit: number;
  description?: string;
  createdBy: string;
}

export class CouponService {
  /**
   * Gera uma password única para cupão
   * Formato: XXXX-XXXX (8 caracteres alfanuméricos)
   */
  static generateCouponPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    
    // Gerar 4 caracteres
    for (let i = 0; i < 4; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    password += '-';
    
    // Gerar mais 4 caracteres
    for (let i = 0; i < 4; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return password;
  }

  /**
   * Cria um novo cupão com password
   * Apenas admins e terapeutas podem criar
   */
  static async createCoupon(
    data: CouponGenerationData,
    currentUser: any,
    existingCoupons: any[]
  ): Promise<{ success: boolean; coupon?: any; error?: string }> {
    try {
      // Verificar permissões
      if (!currentUser || (currentUser.userType !== 'admin' && currentUser.userType !== 'therapist')) {
        return {
          success: false,
          error: 'Apenas administradores e terapeutas podem criar cupões'
        };
      }

      // Validar dados
      if (!data.type || data.value <= 0 || !data.validUntil) {
        return {
          success: false,
          error: 'Dados do cupão inválidos'
        };
      }

      // Verificar se a data de validade não é no passado
      if (new Date(data.validUntil) <= new Date()) {
        return {
          success: false,
          error: 'Data de validade deve ser no futuro'
        };
      }

      // Gerar password única
      let password = this.generateCouponPassword();
      let attempts = 0;
      
      // Garantir que a password é única
      while (existingCoupons.some(c => c.code === password) && attempts < 10) {
        password = this.generateCouponPassword();
        attempts++;
      }

      if (attempts >= 10) {
        return {
          success: false,
          error: 'Erro ao gerar password única. Tente novamente.'
        };
      }

      // Criar cupão
      const newCoupon = {
        id: Date.now().toString(),
        code: password,
        type: data.type,
        value: data.value,
        serviceId: data.serviceId || null,
        clientId: data.clientId || null,
        createdBy: currentUser.id,
        validFrom: new Date(),
        validUntil: new Date(data.validUntil),
        usageLimit: data.usageLimit,
        usedCount: 0,
        status: 'active',
        description: data.description || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      console.log('✅ Cupão criado:', {
        code: newCoupon.code,
        type: newCoupon.type,
        value: newCoupon.value,
        createdBy: currentUser.fullName
      });

      return {
        success: true,
        coupon: newCoupon
      };

    } catch (error) {
      console.error('❌ Erro ao criar cupão:', error);
      return {
        success: false,
        error: 'Erro interno ao criar cupão'
      };
    }
  }

  /**
   * Valida uma password de cupão
   * Verifica se existe, está ativo e não expirou
   */
  static validateCouponPassword(
    password: string,
    coupons: any[],
    serviceId?: string,
    clientEmail?: string,
    clients?: any[]
  ): CouponValidationResult {
    try {
      console.log('🔍 Validando cupão:', { password, serviceId, clientEmail });

      // Normalizar password (remover espaços, converter para maiúsculas)
      const normalizedPassword = password.trim().toUpperCase();

      if (!normalizedPassword) {
        return {
          isValid: false,
          error: 'Password do cupão é obrigatória'
        };
      }

      // Procurar cupão
      const coupon = coupons.find(c => c.code.toUpperCase() === normalizedPassword);

      if (!coupon) {
        console.log('❌ Cupão não encontrado:', normalizedPassword);
        return {
          isValid: false,
          error: 'Password do cupão inválida'
        };
      }

      console.log('🎫 Cupão encontrado:', coupon);

      // Verificar status
      if (coupon.status !== 'active') {
        return {
          isValid: false,
          error: `Cupão ${coupon.status === 'used' ? 'já foi utilizado' : 
                           coupon.status === 'expired' ? 'expirado' : 'cancelado'}`
        };
      }

      // Verificar data de validade
      const now = new Date();
      const validUntil = new Date(coupon.validUntil);
      
      if (validUntil < now) {
        return {
          isValid: false,
          error: 'Cupão expirado'
        };
      }

      // Verificar limite de uso
      if (coupon.usedCount >= coupon.usageLimit) {
        return {
          isValid: false,
          error: 'Cupão já atingiu o limite de utilizações'
        };
      }

      // Verificar se é para cliente específico
      if (coupon.clientId && clientEmail && clients) {
        // Procurar cliente registado
        const client = clients.find(c => c.email === clientEmail);

        // Se o cupão é para um cliente específico, verificar se corresponde
        if (client && client.id !== coupon.clientId) {
          return {
            isValid: false,
            error: 'Este cupão não é válido para o seu email'
          };
        }

        // Se não há cliente registado mas o cupão exige um clientId específico,
        // permitir apenas se o cupão for genérico (clientId = null)
        if (!client) {
          return {
            isValid: false,
            error: 'Este cupão requer registo prévio. Por favor, faça login ou registe-se.'
          };
        }
      }

      // Verificar se é para serviço específico
      if (coupon.serviceId && serviceId && coupon.serviceId !== serviceId) {
        return {
          isValid: false,
          error: 'Este cupão não é válido para o serviço selecionado'
        };
      }

      // Calcular desconto
      let discountAmount = 0;
      if (coupon.type === 'fixed_amount') {
        discountAmount = coupon.value;
      } else if (coupon.type === 'percentage' && serviceId) {
        // Precisaria do preço do serviço para calcular
        discountAmount = 0; // Será calculado no componente
      } else if (coupon.type === 'free_service') {
        discountAmount = 100; // 100% de desconto
      }

      console.log('✅ Cupão válido:', {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discountAmount
      });

      return {
        isValid: true,
        coupon,
        discountAmount
      };

    } catch (error) {
      console.error('❌ Erro na validação do cupão:', error);
      return {
        isValid: false,
        error: 'Erro interno na validação do cupão'
      };
    }
  }

  static useCoupon(
    couponId: string,
    bookingId: string,
    clientId: string,
    discountApplied: number,
    coupons: any[],
    setCoupons: (coupons: any[]) => void,
    couponUsage: any[],
    setCouponUsage: (usage: any[]) => void
  ): boolean {
    try {
      const coupon = coupons.find((c: any) => c.id === couponId);
      if (!coupon) return false;

      const newUsedCount = coupon.usedCount + 1;
      const newStatus = newUsedCount >= coupon.usageLimit ? 'used' : 'active';

      const updatedCoupons = coupons.map((c: any) =>
        c.id === couponId
          ? { ...c, usedCount: newUsedCount, status: newStatus, updatedAt: new Date() }
          : c
      );

      const usage = {
        id: Date.now().toString(),
        couponId,
        bookingId,
        usedBy: clientId,
        usedAt: new Date(),
        discountApplied
      };

      setCoupons(updatedCoupons);
      setCouponUsage([...couponUsage, usage]);

      SupabaseDataService.updateCoupon(couponId, {
        usedCount: newUsedCount,
        status: newStatus,
      });

      return true;
    } catch (error) {
      console.error('Error using coupon:', error);
      return false;
    }
  }

  /**
   * Obtém estatísticas de cupões
   */
  static getCouponStats(coupons: any[], couponUsage: any[]) {
    const now = new Date();
    
    return {
      total: coupons.length,
      active: coupons.filter(c => c.status === 'active' && new Date(c.validUntil) > now).length,
      used: coupons.filter(c => c.status === 'used').length,
      expired: coupons.filter(c => new Date(c.validUntil) <= now && c.status !== 'used').length,
      cancelled: coupons.filter(c => c.status === 'cancelled').length,
      totalDiscount: couponUsage.reduce((sum, usage) => sum + usage.discountApplied, 0),
      totalUsage: couponUsage.length
    };
  }
}