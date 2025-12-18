import React, { useState } from 'react';
import { Save, Upload, Clock, DollarSign, Bell, Palette, Globe, CreditCard, Shield } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SecuritySettings } from './SecuritySettings';

export function Settings() {
  const { businessSettings, setBusinessSettings } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [currentUser, setCurrentUser] = useState<any>(null);

  React.useEffect(() => {
    const savedUser = localStorage.getItem('desperto_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('O ficheiro é muito grande. Máximo 5MB.');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecione um ficheiro de imagem.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBusinessSettings(prev => ({ ...prev, logo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setBusinessSettings(prev => ({ ...prev, logo: '' }));
  };

  const handleSave = () => {
    try {
      console.log('💾 Saving settings:', businessSettings);
      localStorage.setItem('businessSettings', JSON.stringify(businessSettings));
      
      // Show success notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.innerHTML = '✅ Definições guardadas com sucesso!';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
      
      console.log('✅ Settings saved successfully');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      
      // Show error notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
      notification.innerHTML = '❌ Erro ao guardar definições';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    }
  };

  const tabs = [
    { id: 'general', label: 'Geral', icon: Globe },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'booking', label: 'Regras de Agendamento', icon: Clock },
    { id: 'payments', label: 'Pagamentos', icon: CreditCard },
    { id: 'branding', label: 'Marca', icon: Palette },
    { id: 'notifications', label: 'Notificações', icon: Bell },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações do Negócio</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome do Negócio
                    </label>
                    <input
                      type="text"
                      value={businessSettings.businessName}
                      onChange={(e) => setBusinessSettings(prev => ({ ...prev, businessName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logótipo do Negócio
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                        {businessSettings.logo ? (
                          <img src={businessSettings.logo} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <Upload className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          id="logo-upload"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors inline-block"
                        >
                        Carregar Logótipo
                        </label>
                        {businessSettings.logo && (
                          <button
                            onClick={handleRemoveLogo}
                            className="ml-2 px-3 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm"
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Horário de Funcionamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Início
                    </label>
                    <input
                      type="time"
                      value={businessSettings.workingHours.start}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, start: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de Fim
                    </label>
                    <input
                      type="time"
                      value={businessSettings.workingHours.end}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        workingHours: { ...prev.workingHours, end: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && currentUser && (
            <SecuritySettings userId={currentUser.id} />
          )}

          {/* Booking Rules */}
          {activeTab === 'booking' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Regras de Agendamento</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aviso Prévio Mínimo (horas)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={businessSettings.bookingRules.minAdvanceNotice}
                    onChange={(e) => setBusinessSettings(prev => ({
                      ...prev,
                      bookingRules: { ...prev.bookingRules, minAdvanceNotice: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agendamento Antecipado Máximo (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={businessSettings.bookingRules.maxAdvanceBooking}
                    onChange={(e) => setBusinessSettings(prev => ({
                      ...prev,
                      bookingRules: { ...prev.bookingRules, maxAdvanceBooking: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração Padrão (minutos)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={businessSettings.bookingRules.defaultDuration}
                    onChange={(e) => setBusinessSettings(prev => ({
                      ...prev,
                      bookingRules: { ...prev.bookingRules, defaultDuration: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo de Intervalo (minutos)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={businessSettings.bookingRules.bufferTime}
                    onChange={(e) => setBusinessSettings(prev => ({
                      ...prev,
                      bookingRules: { ...prev.bookingRules, bufferTime: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payment Settings */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Configuração de Pagamentos</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="requireDeposit"
                    checked={businessSettings.paymentSettings.requireDeposit}
                    onChange={(e) => setBusinessSettings(prev => ({
                      ...prev,
                      paymentSettings: { ...prev.paymentSettings, requireDeposit: e.target.checked }
                    }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="requireDeposit" className="text-sm font-medium text-gray-700">
                    Exigir depósito para agendamentos
                  </label>
                </div>
                
                {businessSettings.paymentSettings.requireDeposit && (
                  <div className="ml-7">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor do Depósito (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={businessSettings.paymentSettings.depositAmount}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        paymentSettings: { ...prev.paymentSettings, depositAmount: parseInt(e.target.value) }
                      }))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Métodos de Pagamento Aceites
                </label>
                <div className="space-y-2">
                  {['card', 'paypal', 'square', 'mbway', 'cash'].map((method) => (
                    <div key={method} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={method}
                        checked={businessSettings.paymentSettings.acceptedMethods.includes(method)}
                        onChange={(e) => {
                          const methods = businessSettings.paymentSettings.acceptedMethods;
                          if (e.target.checked) {
                            setBusinessSettings(prev => ({
                              ...prev,
                              paymentSettings: { ...prev.paymentSettings, acceptedMethods: [...methods, method] }
                            }));
                          } else {
                            setBusinessSettings(prev => ({
                              ...prev,
                              paymentSettings: { ...prev.paymentSettings, acceptedMethods: methods.filter(m => m !== method) }
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor={method} className="text-sm text-gray-700 capitalize">
                        {method === 'card' ? 'Cartão de Crédito/Débito' : 
                         method === 'mbway' ? 'MB WAY' : method}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Branding */}
          {activeTab === 'branding' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Cores da Marca</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor Primária
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={businessSettings.colors.primary}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        colors: { ...prev.colors, primary: e.target.value }
                      }))}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={businessSettings.colors.primary}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        colors: { ...prev.colors, primary: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor Secundária
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={businessSettings.colors.secondary}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        colors: { ...prev.colors, secondary: e.target.value }
                      }))}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={businessSettings.colors.secondary}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        colors: { ...prev.colors, secondary: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor de Destaque
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={businessSettings.colors.accent}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        colors: { ...prev.colors, accent: e.target.value }
                      }))}
                      className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={businessSettings.colors.accent}
                      onChange={(e) => setBusinessSettings(prev => ({
                        ...prev,
                        colors: { ...prev.colors, accent: e.target.value }
                      }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Preferências de Notificação</h3>
              
              <div className="space-y-4">
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Lembretes de Agendamento</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="email24h" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" defaultChecked />
                      <label htmlFor="email24h" className="text-sm text-gray-700">Lembrete por email 24 horas antes</label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="sms2h" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <label htmlFor="sms2h" className="text-sm text-gray-700">Lembrete por SMS 2 horas antes</label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="email1h" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" defaultChecked />
                      <label htmlFor="email1h" className="text-sm text-gray-700">Confirmação por email imediatamente</label>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Notificações de Pagamento</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="paymentSuccess" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" defaultChecked />
                      <label htmlFor="paymentSuccess" className="text-sm text-gray-700">Confirmação de pagamento bem-sucedido</label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="paymentReminder" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                      <label htmlFor="paymentReminder" className="text-sm text-gray-700">Lembretes de pagamento em atraso</label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Definições</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}