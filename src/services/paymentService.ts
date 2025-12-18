import { supabase } from '../lib/supabase';

export interface PaymentResult {
  success: boolean;
  paymentIntent?: any;
  error?: string;
}

export class PaymentService {

  // 1. LISTAR MÉTODOS (Sem async para não dar erro de ecrã branco)
  static getPaymentMethods() {
    return [
      {
        id: 'mbway',
        name: 'MB WAY',
        icon: '📱',
        description: 'Pagamento instantâneo via app MB WAY ou QR Code'
      },
      {
        id: 'bank_transfer',
        name: 'Transferência Bancária',
        icon: '🏦',
        description: 'Transferência bancária direta'
      },
      {
        id: 'coupon',
        name: 'Cupão / Vale',
        icon: '🎫',
        description: 'Use um cupão de desconto ou vale'
      }
    ];
  }

  // 2. MB WAY (Via Servidor Supabase)
  static async processMBWayPayment(amount: number, phoneNumber: string, bookingId: string): Promise<PaymentResult> {
    console.log("📱 A iniciar pagamento MB WAY via Servidor...");

    try {
      const cleanPhone = phoneNumber.replace(/\s/g, '');
      if (!cleanPhone.match(/^(\+351)?9[1236]\d{7}$/)) {
        return { success: false, error: "Número de telemóvel inválido." };
      }

      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${url}/functions/v1/easypay-mbway`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          action: "create",
          phoneNumber: cleanPhone,
          amount,
          bookingId
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        return { success: false, error: result.error || "Erro ao comunicar com a Easypay." };
      }

      await supabase.from("payments").insert({
        id: result.paymentId,
        booking_id: bookingId,
        amount,
        method: "mbway",
        status: "pending",
        transaction_id: result.paymentId
      });

      return {
        success: true,
        paymentIntent: {
          id: result.paymentId,
          amount,
          status: "pending",
          paymentMethod: "mbway",
          qrCodeUrl: result.qrCodeUrl
        }
      };

    } catch (err) {
      console.error(err);
      return { success: false, error: "Erro interno no pagamento MB Way." };
    }
  }

  static async generateBankTransferDetails(amount: number, bookingId: string) {
    const transactionId = `BANK_${Date.now()}`;
    await supabase.from("payments").insert({
      id: transactionId,
      booking_id: bookingId,
      amount,
      method: "bank_transfer",
      status: "pending",
      transaction_id: transactionId
    });
    return {
      iban: "PT50 0193 0000 1050 6185 1975 9",
      bankName: "Banco CTT",
      accountHolder: "Luis Peres",
      amount
    };
  }

  static async checkMBWayPaymentStatus(paymentId: string): Promise<PaymentResult> {
    try {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${url}/functions/v1/easypay-mbway`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${key}`
        },
        body: JSON.stringify({
          action: "check",
          paymentId
        })
      });

      const result = await response.json();

      if (result.success && result.paid) {
        await supabase
          .from("payments")
          .update({ status: "completed" })
          .eq("transaction_id", paymentId);

        return { success: true };
      }

      return { success: false };
    } catch (err) {
      console.error("Error checking payment status:", err);
      return { success: false };
    }
  }
}