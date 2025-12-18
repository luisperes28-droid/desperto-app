import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, Loader, CheckCircle, X, AlertTriangle, Smartphone } from 'lucide-react';
import { PaymentService } from '../../services/paymentService';
import { CouponService } from '../../services/couponService';
import { useApp } from '../../context/AppContext';

interface PaymentStepProps {
  amount: number;
  serviceName: string;
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentSkip: () => void;
  requirePayment: boolean;
  clientEmail?: string;
  serviceId?: string;
  stripePaymentLink?: string;
}

export function PaymentStep({
  amount,
  serviceName,
  onPaymentSuccess,
  onPaymentSkip,
  requirePayment,
  clientEmail,
  serviceId,
  stripePaymentLink
}: PaymentStepProps) {
  const { coupons, setCoupons, couponUsage, setCouponUsage, clients, services } = useApp();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [showPaymentLink, setShowPaymentLink] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string>('');
  const [couponPassword, setCouponPassword] = useState<string>('');
  const [inputCouponPassword, setInputCouponPassword] = useState<string>('');
  const [validatedCoupon, setValidatedCoupon] = useState<any>(null);
  const [couponValidationError, setCouponValidationError] = useState<string>('');
  const [mbwayPhone, setMbwayPhone] = useState<string>('');
  const [processingMBWay, setProcessingMBWay] = useState(false);
  const [mbwayPaymentId, setMbwayPaymentId] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [bankTransferDetails, setBankTransferDetails] = useState<any>(null);

  const paymentMethods = PaymentService.getPaymentMethods();

  const generateCouponPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Auto-generate bank transfer details when selected
  useEffect(() => {
    if (selectedMethod === 'bank_transfer' && !bankTransferDetails) {
      const generateBankDetails = async () => {
        try {
          const bankDetails = await PaymentService.generateBankTransferDetails(amount, 'temp-booking-id');
          setBankTransferDetails(bankDetails);
        } catch (error) {
          console.error('Error generating bank details:', error);
          setPaymentResult({ success: false, error: 'Erro ao gerar dados bancários' });
        }
      };
      generateBankDetails();
    }
    // Reset bank details when switching to another method
    if (selectedMethod !== 'bank_transfer' && bankTransferDetails) {
      setBankTransferDetails(null);
    }
  }, [selectedMethod, amount, bankTransferDetails]);

  const handlePayment = async () => {
    if (!selectedMethod) return;

    setIsProcessing(true);
    setPaymentResult(null);

    if (selectedMethod === 'mbway') {
      // Handle MB WAY payment via Easypay
      if (!mbwayPhone.trim()) {
        setPaymentResult({ success: false, error: 'Por favor, insira o número de telefone MB WAY' });
        setIsProcessing(false);
        return;
      }

      try {
        setProcessingMBWay(true);
        const result = await PaymentService.processMBWayPayment(amount, mbwayPhone, 'temp-booking-id');

        if (result.success && result.paymentIntent) {
          setMbwayPaymentId(result.paymentIntent.id);
          setQrCodeUrl(result.paymentIntent.qrCodeUrl);
          setProcessingMBWay(false);

          // Start checking payment status
          setCheckingPayment(true);

          // Check payment status every 3 seconds for 3 minutes
          const checkInterval = setInterval(async () => {
            const statusResult = await PaymentService.checkMBWayPaymentStatus(result.paymentIntent!.id);

            if (statusResult.success) {
              clearInterval(checkInterval);
              setCheckingPayment(false);
              setPaymentResult({ success: true });
              window.setTimeout(() => {
                onPaymentSuccess(result.paymentIntent!.id);
              }, 1500);
            }
          }, 3000);

          // Stop checking after 3 minutes
          setTimeout(() => {
            clearInterval(checkInterval);
            if (checkingPayment) {
              setCheckingPayment(false);
              setPaymentResult({
                success: false,
                error: 'Tempo esgotado. Verifique a sua app MB WAY e aprove o pagamento.'
              });
            }
          }, 180000);

        } else {
          setPaymentResult({ success: false, error: result.error || 'Erro no pagamento MB WAY' });
          setProcessingMBWay(false);
        }
      } catch (error) {
        console.error('MB WAY error:', error);
        setPaymentResult({ success: false, error: 'Erro ao processar MB WAY. Tente novamente.' });
        setProcessingMBWay(false);
      } finally {
        setIsProcessing(false);
      }
    } else if (selectedMethod === 'coupon') {
      // For coupon/ticket, validate password and confirm
      if (!inputCouponPassword.trim()) {
        setCouponValidationError('Por favor, insira a password do cupão fornecida pelo terapeuta.');
        setIsProcessing(false);
        return;
      }
      
      try {
        // Validar cupão usando o serviço
        const validation = CouponService.validateCouponPassword(
          inputCouponPassword,
          coupons,
          serviceId,
          clientEmail,
          clients
        );

        if (!validation.isValid) {
          setCouponValidationError(validation.error || 'Cupão inválido');
          setIsProcessing(false);
          return;
        }

        // Cupão válido
        setValidatedCoupon(validation.coupon);
        setCouponPassword(inputCouponPassword);
        setCouponValidationError('');
        
        // Calcular desconto real
        let finalDiscount = 0;
        if (validation.coupon.type === 'fixed_amount') {
          finalDiscount = Math.min(validation.coupon.value, amount);
        } else if (validation.coupon.type === 'percentage') {
          finalDiscount = (amount * validation.coupon.value) / 100;
        } else if (validation.coupon.type === 'free_service') {
          finalDiscount = amount;
        }

        // Marcar cupão como usado
        const client = clients?.find(c => c.email === clientEmail);
        if (client) {
          CouponService.useCoupon(
            validation.coupon.id,
            'temp-booking-id',
            client.id,
            finalDiscount,
            coupons,
            setCoupons,
            couponUsage,
            setCouponUsage
          );
        }

        setPaymentResult({ success: true });
        setTimeout(() => {
          onPaymentSuccess(`coupon_${inputCouponPassword}_discount_${finalDiscount}`);
        }, 1500);
        
      } catch (error) {
        console.error('Erro ao processar cupão:', error);
        setCouponValidationError('Erro ao processar cupão. Tente novamente.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      setPaymentResult({ success: false, error: 'Método de pagamento não suportado.' });
      setIsProcessing(false);
    }
  };

  const handlePaymentConfirmation = () => {
    // Simulate successful payment after external payment
    setPaymentResult({ success: true });
    setTimeout(() => {
      onPaymentSuccess('payment_confirmed');
    }, 1500);
  };

  if (paymentResult?.success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pagamento Processado!</h3>
        <p className="text-gray-600">O seu pagamento foi processado com sucesso.</p>
        
        {couponPassword && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-900 mb-2">🎫 Cupão Validado</h4>
            <div className="bg-white border-2 border-dashed border-yellow-300 rounded-lg p-4 mb-3">
              <p className="text-sm text-gray-600 mb-2">Password Utilizada:</p>
              <div className="text-2xl font-mono font-bold text-yellow-800 bg-yellow-100 px-4 py-2 rounded border">
                {couponPassword}
              </div>
            </div>
            <p className="text-sm text-yellow-700">
              ✅ <strong>Cupão validado com sucesso!</strong> O seu agendamento gratuito foi confirmado.
            </p>
          </div>
        )}
      </div>
    );
  }

  if (showPaymentLink) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete o Seu Pagamento</h3>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <p className="text-blue-800 mb-4">
              Clique no botão abaixo para completar o pagamento de <strong>€{amount}</strong> via {selectedMethod === 'mbway' ? 'MB WAY' : 'Cartão'}.
            </p>
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Pagar €{amount} via {selectedMethod === 'mbway' ? 'MB WAY' : 'Cartão'}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Pagamento Obrigatório
        </h3>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{serviceName}</span>
            <span className="text-2xl font-bold text-gray-900">€{amount}</span>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          O pagamento é obrigatório para confirmar o seu agendamento.
        </p>
      </div>

      {/* Payment Methods */}
      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">
          Escolha o método de pagamento:
        </h4>
        {paymentMethods.map((method) => (
          <div key={method.id}>
            <button
              onClick={() => setSelectedMethod(method.id)}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                selectedMethod === method.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ touchAction: 'manipulation' }}
            >
              <div className="flex items-start space-x-3">
                <span className="text-3xl mt-1">{method.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-base text-gray-900">{method.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{method.description}</div>
                </div>
              </div>
            </button>

            {/* MB WAY Phone Input */}
            {selectedMethod === 'mbway' && method.id === 'mbway' && (
              <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Smartphone className="w-5 h-5 text-blue-900" />
                    <span className="font-medium text-blue-900">Pagamento MB WAY Real (Easypay)</span>
                  </div>
                  <p className="text-sm text-blue-800 mb-2">
                    Insira o seu número de telemóvel associado ao MB WAY. Vai receber uma notificação na sua app para aprovar o pagamento.
                  </p>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• Abra a app MB WAY no seu telemóvel</p>
                    <p>• Aprove o pedido de pagamento de €{amount.toFixed(2)}</p>
                    <p>• Tem 5 minutos para aprovar</p>
                  </div>
                </div>

                <label className="block text-sm font-medium text-green-900 mb-2">
                  📱 Número de Telemóvel
                </label>
                <input
                  type="tel"
                  value={mbwayPhone}
                  onChange={(e) => setMbwayPhone(e.target.value)}
                  placeholder="912345678"
                  className="w-full px-4 py-4 border border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-lg min-h-[48px]"
                  style={{ touchAction: 'manipulation' }}
                  disabled={processingMBWay || checkingPayment}
                />

                {processingMBWay && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader className="w-4 h-4 animate-spin text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        A criar pedido de pagamento MB WAY...
                      </span>
                    </div>
                  </div>
                )}

                {checkingPayment && mbwayPaymentId && (
                  <div className="mt-3 p-4 bg-green-100 border-2 border-green-300 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <Smartphone className="w-5 h-5 text-green-700 animate-pulse" />
                      <span className="font-semibold text-green-900">
                        Pedido enviado para o seu telemóvel!
                      </span>
                    </div>

                    {qrCodeUrl && (
                      <div className="mb-4 p-3 bg-white rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-700 mb-2">Ou escaneie este QR Code com a app MB WAY:</p>
                        <img
                          src={qrCodeUrl}
                          alt="QR Code MB WAY"
                          className="mx-auto w-48 h-48 border-2 border-gray-300 rounded"
                        />
                      </div>
                    )}

                    <div className="text-sm text-green-800 space-y-2">
                      <p className="font-medium">📩 Abra a app MB WAY e aprove o pagamento de €{amount.toFixed(2)}</p>
                      <p className="text-xs">🕒 A aguardar aprovação...</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Loader className="w-3 h-3 animate-spin text-green-600" />
                        <span className="text-xs text-green-700">A verificar estado do pagamento...</span>
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-green-700 mt-2">
                  ✅ <strong>Sistema Real:</strong> Pagamento processado via Easypay (operador oficial MB WAY)
                </p>
              </div>
            )}

            {/* Coupon Password Input */}
            {selectedMethod === 'coupon' && method.id === 'coupon' && (
              <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                {/* Coupon Info */}
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-2xl">🎫</span>
                    <span className="font-medium text-blue-900">Como usar o seu cupão</span>
                  </div>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• A password foi fornecida pelo seu terapeuta</li>
                    <li>• Formato: XXXX-XXXX (8 caracteres)</li>
                    <li>• Verifique email, WhatsApp ou SMS</li>
                    <li>• Contacte o terapeuta se não recebeu</li>
                  </ul>
                </div>

                <label className="block text-sm font-medium text-yellow-900 mb-2">
                  🎫 Password do Cupão
                </label>
                <input
                  type="text"
                  value={inputCouponPassword}
                  onChange={(e) => setInputCouponPassword(e.target.value.toUpperCase())}
                  placeholder="Digite a password fornecida pelo terapeuta"
                  className="w-full px-4 py-4 border border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent font-mono text-center text-lg min-h-[48px]"
                  maxLength={9}
                  style={{ touchAction: 'manipulation' }}
                />
                
                {/* Validation Error */}
                {couponValidationError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-800 text-sm">{couponValidationError}</p>
                  </div>
                )}

                {/* Validated Coupon Info */}
                {validatedCoupon && !couponValidationError && (
                  <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="font-medium text-green-900">Cupão Válido!</span>
                    </div>
                    <div className="text-sm text-green-800">
                      <p><strong>Tipo:</strong> {
                        validatedCoupon.type === 'fixed_amount' ? `€${validatedCoupon.value} desconto` :
                        validatedCoupon.type === 'percentage' ? `${validatedCoupon.value}% desconto` :
                        'Serviço gratuito'
                      }</p>
                      <p><strong>Válido até:</strong> {new Date(validatedCoupon.validUntil).toLocaleDateString('pt-PT')}</p>
                      {validatedCoupon.description && (
                        <p><strong>Descrição:</strong> {validatedCoupon.description}</p>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-yellow-700 mt-2">
                  💡 <strong>Dica:</strong> A password foi fornecida pelo seu terapeuta via email, WhatsApp ou telefone.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bank Transfer Details */}
      {bankTransferDetails && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-3xl">🏦</span>
            <span className="font-bold text-blue-900 text-lg">Dados para Transferência Bancária</span>
          </div>
          <div className="space-y-3 text-blue-900">
            <div className="bg-white p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">IBAN</p>
              <p className="font-mono text-sm font-bold">{bankTransferDetails.iban}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Banco</p>
              <p className="text-sm font-semibold">{bankTransferDetails.bankName}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Titular</p>
              <p className="text-sm font-semibold">{bankTransferDetails.accountHolder}</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Valor</p>
              <p className="text-xl font-bold text-blue-700">€{amount.toFixed(2)}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-lg">
            <p className="text-sm text-blue-800">
              ✅ Após efetuar a transferência, o seu agendamento será confirmado automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {(paymentResult?.error || couponValidationError) && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <X className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{paymentResult?.error || couponValidationError}</span>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {/* Hide button for bank transfer when details are already shown */}
      {!(selectedMethod === 'bank_transfer' && bankTransferDetails) && (
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handlePayment}
            disabled={
              !selectedMethod ||
              isProcessing ||
              (selectedMethod === 'coupon' && !inputCouponPassword.trim()) ||
              (selectedMethod === 'mbway' && !mbwayPhone.trim())
            }
            className="w-full px-6 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center font-semibold text-base min-h-[48px]"
            style={{ touchAction: 'manipulation' }}
          >
            {isProcessing || processingMBWay ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                {processingMBWay ? 'Processando MB WAY...' : 'Processando...'}
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                {selectedMethod === 'coupon' ? 'Validar Cupão' :
                 selectedMethod === 'mbway' ? 'Pagar com MB WAY' :
                 `Pagar €${amount}`}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}