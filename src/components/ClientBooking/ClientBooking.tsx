import React, { useState } from 'react';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, ChevronLeft, ChevronRight, Globe, LogIn, LogOut, Shield, Heart } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AvailabilityService, TimeSlot } from '../../services/availabilityService';
import { EmailService } from '../../services/emailService';
import { CalendarService } from '../../services/calendarService';
import { TimezoneService } from '../../services/timezoneService';
import { PaymentStep } from '../Booking/PaymentStep';
import { RecurringBooking, RecurrencePattern } from '../Booking/RecurringBooking';
import { ClientLogin } from '../Auth/ClientLogin';
import { ClientHistory } from './ClientHistory';
import { HorizontalScrollContainer } from '../Layout/HorizontalScrollContainer';
import { MobileTherapistCard } from '../Mobile/MobileTherapistCard';
import { MobileServiceCard } from '../Mobile/MobileServiceCard';
import { MobileTimeSlots } from '../Mobile/MobileTimeSlots';
import { v4 as uuidv4 } from 'uuid';

// User Type Toggle Component
function UserTypeToggle() {
  const [currentUserType, setCurrentUserType] = useState<'client' | 'therapist' | 'admin'>('client');
  
  const userTypes = [
    { type: 'client' as const, icon: User, label: 'Cliente', color: 'bg-green-600' },
    { type: 'therapist' as const, icon: Heart, label: 'Terapeuta', color: 'bg-blue-600' },
    { type: 'admin' as const, icon: Shield, label: 'Administrador', color: 'bg-purple-600' }
  ];
  
  const currentType = userTypes.find(ut => ut.type === currentUserType);
  const CurrentIcon = currentType?.icon || User;
  
  const handleToggle = () => {
    const currentIndex = userTypes.findIndex(ut => ut.type === currentUserType);
    const nextIndex = (currentIndex + 1) % userTypes.length;
    setCurrentUserType(userTypes[nextIndex].type);
  };
  
  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 shadow-md ${currentType?.color}`}
        title={`Tipo: ${currentType?.label} (clique para alternar)`}
      >
        <CurrentIcon className="w-5 h-5" />
      </button>
      
      {/* Tooltip */}
      <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {currentType?.label}
      </div>
    </div>
  );
}

interface ClientBookingProps {
  onComplete?: () => void;
  initialClientData?: any;
}

export function ClientBooking({ onComplete, initialClientData }: ClientBookingProps = {}) {
  const { services, businessSettings, therapists, bookings, setBookings, clients, setClients } = useApp();
  const [step, setStep] = useState(1);
  const [selectedTherapist, setSelectedTherapist] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [requirePayment, setRequirePayment] = useState(false);
  const [clientInfo, setClientInfo] = useState(() => {
    // Initialize with client data if available
    if (initialClientData) {
      return {
        name: initialClientData.fullName || initialClientData.name || '',
        email: initialClientData.email || '',
        phone: initialClientData.phone || '',
        notes: ''
      };
    }
    return {
      name: '',
      email: '',
      phone: '',
      notes: ''
    };
  });
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | null>(null);
  const [generatedCouponPassword, setGeneratedCouponPassword] = useState<string>('');
  const [showLogin, setShowLogin] = useState(false);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(initialClientData);
  const [showHistory, setShowHistory] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());

  // Get services for selected therapist
  const availableServices = selectedTherapist 
    ? services.filter(service => service.therapistId === selectedTherapist)
    : [];

  // Get selected service details
  const selectedServiceDetails = services.find(s => s.id === selectedService);

  // Update available slots when date changes
  React.useEffect(() => {
    if (selectedDate && selectedServiceDetails) {
      const therapist = therapists.find(t => t.id === selectedTherapist);
      console.log('Generating slots for:', {
        date: selectedDate,
        therapist: therapist?.name,
        service: selectedServiceDetails.name,
        duration: selectedServiceDetails.duration
      });
      const slots = AvailabilityService.generateTimeSlots(
        selectedDate,
        businessSettings,
        bookings,
        selectedTherapist,
        selectedServiceDetails.duration,
        therapists,
        therapist?.availability,
        clientInfo.email,
        clients
      );
      console.log('Generated slots:', slots);
      setAvailableSlots(slots);
    }
  }, [selectedDate, selectedServiceDetails, selectedTherapist, businessSettings, bookings, therapists, clientInfo.email, clients]);

  // Check if payment is required
  React.useEffect(() => {
    if (selectedServiceDetails) {
      setRequirePayment(true); // Always require payment
    }
  }, [selectedServiceDetails, businessSettings]);

  const generateRecurringBookings = (baseBooking: any): any[] => {
    if (!recurrencePattern) return [baseBooking];

    const bookings = [baseBooking];
    // Implementation for generating recurring bookings would go here
    return bookings;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleBooking = async (paymentId?: string) => {
    if (!selectedDate || !selectedTime || !selectedServiceDetails) return;

    console.log('Creating booking with:', {
      selectedDate,
      selectedTime,
      selectedServiceDetails,
      clientInfo
    });

    // Create or find client
    let client = clients.find(c => c.email === clientInfo.email);
    if (!client) {
      client = {
        id: uuidv4(),
        name: clientInfo.name,
        email: clientInfo.email,
        phone: clientInfo.phone,
        notes: clientInfo.notes,
        serviceHistory: [],
        paymentHistory: [],
        createdAt: new Date(),
        therapistNotes: []
      };
      setClients(prev => [...prev, client!]);
    }

    // Create booking date
    const bookingDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    bookingDateTime.setHours(hours, minutes, 0, 0);

    // Create base booking
    const baseBooking = {
      id: uuidv4(),
      clientId: client.id,
      serviceId: selectedService,
      therapistId: selectedTherapist,
      date: bookingDateTime,
      status: 'confirmed' as const,
      notes: clientInfo.notes,
      paymentStatus: paymentId ? 'paid' as const : 'pending' as const,
      reminderSent: false
    };

    // Generate all bookings (including recurring)
    const allBookings = generateRecurringBookings(baseBooking);
    setBookings(prev => [...prev, ...allBookings]);

    // Send confirmation email using EmailJS template
    const therapist = therapists.find(t => t.id === selectedTherapist)!;

    try {
      const location = 'Google Meet (o link será enviado por email)';

      await EmailService.sendClientConfirmationEmail(
        client.email,
        client.name,
        bookingDateTime,
        selectedTime,
        location
      );
    } catch (error) {
      console.error('Error sending confirmation email:', error);
    }

    setStep(6); // Go to success
  };

  const handlePaymentSuccess = (paymentId: string) => {
    // Extract coupon password if it's a coupon payment
    if (paymentId.startsWith('coupon_')) {
      const password = paymentId.replace('coupon_', '');
      setGeneratedCouponPassword(password);
    }
    handleBooking(paymentId);
  };

  const handlePaymentSkip = () => {
    handleBooking();
  };

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Check for existing authentication on component mount
  React.useEffect(() => {
    console.log('🔍 ClientBooking useEffect - initialClientData:', initialClientData);
    
    if (initialClientData) {
      console.log('✅ Setting client data from props:', initialClientData);
      setAuthenticatedClient(initialClientData);
      updateClientInfo(initialClientData);
    } else {
      console.log('🔍 Checking localStorage for client auth...');
      const savedAuth = localStorage.getItem('clientAuth');
      if (savedAuth) {
        try {
          const authData = JSON.parse(savedAuth);
          console.log('✅ Found saved client auth:', authData);
          setAuthenticatedClient(authData);
          updateClientInfo(authData);
        } catch (error) {
          console.error('Error parsing saved auth:', error);
          localStorage.removeItem('clientAuth');
        }
      }
    }
  }, [initialClientData]);

  // Helper function to update client info
  const updateClientInfo = (clientData: any) => {
    console.log('🔄 Updating client info with:', clientData);
    setClientInfo({
      name: clientData.fullName || clientData.name || '',
      email: clientData.email || '',
      phone: clientData.phone || '',
      notes: ''
    });
  };

  // Update client info when authenticated client changes
  React.useEffect(() => {
    if (authenticatedClient) {
      console.log('🔄 Authenticated client changed, updating info:', authenticatedClient);
      updateClientInfo(authenticatedClient);
    }
  }, [authenticatedClient]);

  // Ensure data is filled when reaching step 4
  React.useEffect(() => {
    if (step === 4 && authenticatedClient) {
      console.log('🎯 Reached step 4, ensuring data is filled:', authenticatedClient);
      updateClientInfo(authenticatedClient);
    }
  }, [step, authenticatedClient]);

  const handleLogin = (clientData: any) => {
    setAuthenticatedClient(clientData);
    localStorage.setItem('clientAuth', JSON.stringify(clientData));
    setShowLogin(false);
  };

  const handleLogout = () => {
    console.log('🚪 Cliente fazendo logout...');
    setAuthenticatedClient(null);
    localStorage.removeItem('clientAuth');
    setClientInfo({ name: '', email: '', phone: '', notes: '' });
    setStep(1);
    setSelectedTherapist('');
    setSelectedService('');
    setSelectedDate(null);
    setSelectedTime('');
    console.log('✅ Logout completo realizado');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-desperto-cream to-wellness-growth">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Progress Steps */}
        <div className="mb-6 lg:mb-8">
          <div className="flex items-center justify-center space-x-2 lg:space-x-4 overflow-x-auto pb-4 px-2">
            {[1, 2, 3, 4, 5, 6].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-semibold text-sm lg:text-base flex-shrink-0 ${
                  step >= stepNum 
                    ? 'bg-desperto-gold text-white shadow-md' 
                    : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 6 && (
                  <div className={`w-6 lg:w-16 h-1 mx-1 lg:mx-2 flex-shrink-0 ${
                    step > stepNum ? 'bg-desperto-gold' : 'bg-neutral-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="text-center">
              <p className="text-sm text-neutral-600 px-4 font-medium">
                {step === 1 && 'Escolha o Terapeuta'}
                {step === 2 && 'Escolha o Serviço'}
                {step === 3 && 'Selecione Data e Hora'}
                {step === 4 && 'Informações de Contacto'}
                {step === 5 && 'Pagamento'}
                {step === 6 && 'Agendamento Confirmado'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Step 1: Therapist Selection */}
          {step === 1 && (
            <div className="p-6 lg:p-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-primary-800 mb-6 text-center">
                Escolha o Seu Terapeuta
              </h2>
              
              {/* Mobile Horizontal Scroll */}
              <div className="block lg:hidden">
                <HorizontalScrollContainer 
                  showArrows={true}
                  snapToItems={true}
                  itemWidth={288}
                  gap={24}
                >
                  {therapists.filter(t => t.available).map((therapist) => (
                    <MobileTherapistCard
                      key={therapist.id}
                      therapist={therapist}
                      isSelected={selectedTherapist === therapist.id}
                      onSelect={() => setSelectedTherapist(therapist.id)}
                    />
                  ))}
                </HorizontalScrollContainer>
              </div>

              {/* Desktop Grid */}
              <div className="hidden lg:grid grid-cols-1 gap-6 max-w-4xl mx-auto">
                {therapists.filter(t => t.available).map((therapist) => (
                  <div
                    key={therapist.id}
                    onClick={() => setSelectedTherapist(therapist.id)}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md min-h-[120px] ${
                      selectedTherapist === therapist.id
                        ? 'border-desperto-gold bg-desperto-cream shadow-lg'
                        : 'border-neutral-200 hover:border-desperto-gold/50'
                    }`}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="flex items-start space-x-4 mb-4">
                      <img
                        src={therapist.image}
                        alt={therapist.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0 shadow-md"
                      />
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-desperto-gold mb-2">{therapist.name}</h3>
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{therapist.bio}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-neutral-700">Especialidades:</p>
                      <div className="flex flex-wrap gap-2">
                        {therapist.specialties.map((specialty, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-desperto-yellow/20 text-desperto-gold text-xs rounded-full font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <button
                  onClick={() => selectedTherapist && setStep(2)}
                  disabled={!selectedTherapist}
                  className="w-full lg:w-auto px-8 py-4 bg-desperto-gold text-white rounded-xl font-semibold hover:bg-desperto-gold/90 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors shadow-lg text-lg min-h-[48px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Service Selection */}
          {step === 2 && (
            <div className="p-6 lg:p-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-desperto-gold mb-6 text-center">
                Escolha o Seu Serviço
              </h2>
              
              {/* Mobile Horizontal Scroll */}
              <div className="block lg:hidden">
                <HorizontalScrollContainer 
                  showArrows={true}
                  snapToItems={true}
                  itemWidth={320}
                  gap={24}
                >
                  {availableServices.map((service) => (
                    <MobileServiceCard
                      key={service.id}
                      service={service}
                      isSelected={selectedService === service.id}
                      onSelect={() => setSelectedService(service.id)}
                    />
                  ))}
                </HorizontalScrollContainer>
              </div>

              {/* Desktop Grid */}
              <div className="hidden lg:grid grid-cols-1 gap-6">
                {availableServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => setSelectedService(service.id)}
                    className={`p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md min-h-[120px] ${
                      selectedService === service.id
                        ? 'border-desperto-gold bg-desperto-cream shadow-lg'
                        : 'border-neutral-200 hover:border-desperto-gold/50'
                    }`}
                    style={{ touchAction: 'manipulation' }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-xl font-semibold text-desperto-gold flex-1 pr-4">{service.name}</h3>
                      <div className="text-2xl font-bold text-desperto-yellow">€{service.price}</div>
                    </div>
                    <p className="text-neutral-600 mb-4 text-sm">{service.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-neutral-500">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{service.duration} min</span>
                      </div>
                      <div className="px-3 py-1 bg-desperto-yellow/20 text-desperto-gold rounded-full text-xs font-medium">
                        {service.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col lg:flex-row justify-between mt-8 space-y-4 lg:space-y-0 lg:space-x-4">
                <button
                  onClick={() => {
                    if (onComplete) {
                      onComplete();
                    } else {
                      // Reset to initial state
                      setStep(1);
                      setSelectedTherapist('');
                      setSelectedService('');
                      setSelectedDate(null);
                      setSelectedTime('');
                      setClientInfo(authenticatedClient ? {
                        name: authenticatedClient.name,
                        email: authenticatedClient.email,
                        phone: authenticatedClient.phone || '',
                        notes: ''
                      } : { name: '', email: '', phone: '', notes: '' });
                    }
                  }}
                  className="w-full lg:w-auto px-6 py-4 border border-neutral-300 rounded-xl font-semibold hover:bg-neutral-50 transition-colors min-h-[48px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  {onComplete ? 'Voltar ao Painel' : 'Cancelar'}
                </button>
                <button
                  onClick={() => selectedService && setStep(3)}
                  disabled={!selectedService}
                  className="w-full lg:w-auto px-8 py-4 bg-desperto-gold text-white rounded-xl font-semibold hover:bg-desperto-gold/90 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors shadow-lg text-lg min-h-[48px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Date and Time Selection */}
          {step === 3 && (
            <div className="p-6 lg:p-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-desperto-gold mb-6 text-center">
                Escolha Data e Hora
              </h2>
              
              {/* Calendar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-3 hover:bg-neutral-100 rounded-xl transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg lg:text-xl font-semibold text-desperto-gold text-center">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-3 hover:bg-neutral-100 rounded-xl transition-colors min-h-[48px] min-w-[48px] flex items-center justify-center"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-2 mb-4">
                  {dayNames.map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-neutral-600">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {days.map((date, index) => {
                    const isToday = date && date.toDateString() === new Date().toDateString();
                    const isPast = date && date < new Date();
                    const isSelected = date && selectedDate && date.toDateString() === selectedDate.toDateString();
                    
                    // Check if therapist is blocked on this date
                    let isBlocked = false;
                    let doesntWorkThisDay = false;
                    
                    if (date && selectedTherapist) {
                      const therapist = therapists.find(t => t.id === selectedTherapist);
                      
                      if (therapist?.availability) {
                        // Check blocked dates
                        isBlocked = therapist.availability.blockedDates?.some(blockedDate => {
                          const blocked = new Date(blockedDate);
                          return blocked.toDateString() === date.toDateString();
                        }) || false;
                        
                        // Check working days
                        const dayOfWeek = date.getDay();
                        doesntWorkThisDay = !therapist.availability.workingDays.includes(dayOfWeek);
                      }
                    }
                    
                    return (
                      <div key={index} className="aspect-square min-h-[48px]">
                        {date && (
                          <button
                            onClick={() => !isPast && !isBlocked && !doesntWorkThisDay && setSelectedDate(date)}
                            disabled={isPast || isBlocked || doesntWorkThisDay}
                            className={`w-full h-full rounded-xl text-sm font-medium transition-colors min-h-[48px] ${
                              isSelected
                                ? 'bg-desperto-gold text-white shadow-md'
                                : isToday
                                ? 'bg-desperto-cream text-desperto-gold hover:bg-desperto-yellow/20'
                                : isPast
                                ? 'text-neutral-300 cursor-not-allowed'
                                : isBlocked
                                ? 'bg-red-100 text-red-600 cursor-not-allowed border border-red-200'
                                : doesntWorkThisDay
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-neutral-100 text-neutral-700'
                            }`}
                            style={{ touchAction: 'manipulation' }}
                            title={
                              isBlocked ? 'Terapeuta não está disponível neste dia' :
                              doesntWorkThisDay ? 'Terapeuta não trabalha neste dia da semana' :
                              undefined
                            }
                          >
                            {date.getDate()}
                            {isBlocked && (
                              <div className="text-xs mt-1">❌</div>
                            )}
                            {doesntWorkThisDay && (
                              <div className="text-xs mt-1">🚫</div>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Legend and suggestions */}
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-desperto-gold rounded"></div>
                      <span className="text-neutral-600">Disponível</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-100 border border-red-200 rounded flex items-center justify-center text-xs">❌</div>
                      <span className="text-neutral-600">Terapeuta indisponível</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-100 rounded flex items-center justify-center text-xs">🚫</div>
                      <span className="text-neutral-600">Não trabalha neste dia</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-neutral-200 rounded"></div>
                      <span className="text-neutral-600">Data passada</span>
                    </div>
                  </div>
                  
                  {/* Suggestions for alternative dates */}
                  {selectedTherapist && selectedDate && (() => {
                    const therapist = therapists.find(t => t.id === selectedTherapist);
                    if (!therapist?.availability) return null;
                    
                    // Find next 3 available dates
                    const today = new Date();
                    const availableDates = [];
                    const checkDate = new Date(today);
                    checkDate.setDate(checkDate.getDate() + 1); // Start from tomorrow
                    
                    while (availableDates.length < 3 && checkDate < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
                      const dayOfWeek = checkDate.getDay();
                      const isWorkingDay = therapist.availability.workingDays.includes(dayOfWeek);
                      const isBlocked = therapist.availability.blockedDates?.some(blockedDate => {
                        const blocked = new Date(blockedDate);
                        return blocked.toDateString() === checkDate.toDateString();
                      });
                      
                      if (isWorkingDay && !isBlocked) {
                        availableDates.push(new Date(checkDate));
                      }
                      
                      checkDate.setDate(checkDate.getDate() + 1);
                    }
                    
                    if (availableDates.length > 0) {
                      return (
                        <div className="bg-desperto-cream border border-desperto-gold/30 rounded-lg p-4">
                          <h4 className="font-medium text-desperto-gold mb-2">💡 Próximas datas disponíveis com {therapist.name}:</h4>
                          <div className="flex flex-wrap gap-2">
                            {availableDates.map((date, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
                                  setSelectedDate(date);
                                }}
                                className="px-3 py-2 bg-desperto-gold text-white rounded-lg hover:bg-desperto-gold/90 text-sm font-medium transition-colors"
                              >
                                {date.toLocaleDateString('pt-PT', { 
                                  weekday: 'short', 
                                  day: 'numeric', 
                                  month: 'short' 
                                })}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-desperto-gold mb-4">Horários Disponíveis</h3>
                  
                  {/* Mobile Time Slots */}
                  <div className="block lg:hidden">
                    <MobileTimeSlots
                      slots={availableSlots}
                      selectedTime={selectedTime}
                      onTimeSelect={setSelectedTime}
                      therapistName={therapists.find(t => t.id === selectedTherapist)?.name}
                    />
                  </div>

                  {/* Desktop Time Slots */}
                  <div className="hidden lg:block">
                    {availableSlots.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl">😔</span>
                        </div>
                        <h4 className="text-lg font-semibold text-amber-800 mb-2">
                          Sem horários disponíveis
                        </h4>
                        <p className="text-amber-700 mb-4">
                          {therapists.find(t => t.id === selectedTherapist)?.name} não tem horários disponíveis neste dia.
                        </p>
                        <p className="text-sm text-amber-600">
                          Por favor, escolha uma das datas sugeridas acima ou selecione outro dia.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {availableSlots.map((slot) => (
                          <div key={slot.time} className="relative">
                            <button
                              onClick={() => slot.available && setSelectedTime(slot.time)}
                              disabled={!slot.available}
                              className={`w-full p-4 rounded-xl border text-sm font-medium transition-colors min-h-[56px] ${
                                selectedTime === slot.time
                                  ? 'bg-desperto-gold text-white border-desperto-gold shadow-md'
                                  : !slot.available
                                  ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                                  : 'border-neutral-200 hover:border-desperto-gold/50 hover:bg-desperto-cream'
                              }`}
                              style={{ touchAction: 'manipulation' }}
                            >
                              <div className="text-center">
                                <div>{slot.time}</div>
                                {!slot.available && (
                                  <div className="flex flex-col items-center mt-1">
                                    {slot.occupiedBy && therapists.find(t => t.id === slot.occupiedBy) && (
                                      <img
                                        src={therapists.find(t => t.id === slot.occupiedBy)?.image}
                                        alt={therapists.find(t => t.id === slot.occupiedBy)?.name}
                                        className="w-6 h-6 rounded-full object-cover mb-1"
                                        title={`Ocupado por ${therapists.find(t => t.id === slot.occupiedBy)?.name}`}
                                      />
                                    )}
                                    <div className="text-xs text-neutral-300">
                                      Ocupado
                                    </div>
                                  </div>
                                )}
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Legend */}
                  {availableSlots.length > 0 && (
                    <div className="mt-6 flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-desperto-cream border border-desperto-gold/30 rounded"></div>
                        <span className="text-neutral-600">Disponível</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-neutral-100 border border-neutral-200 rounded"></div>
                        <span className="text-neutral-600">Ocupado</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-amber-100 border border-amber-200 rounded"></div>
                        <span className="text-neutral-600">Terapeuta Indisponível</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col lg:flex-row justify-between mt-8 space-y-4 lg:space-y-0 lg:space-x-4">
                <button
                  onClick={() => setStep(2)}
                  className="w-full lg:w-auto px-6 py-4 border border-neutral-300 rounded-xl font-semibold hover:bg-neutral-50 transition-colors min-h-[48px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  Voltar
                </button>
                <button
                  onClick={() => selectedDate && selectedTime && setStep(4)}
                  disabled={!selectedDate || !selectedTime}
                  className="w-full lg:w-auto px-8 py-4 bg-desperto-gold text-white rounded-xl font-semibold hover:bg-desperto-gold/90 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors shadow-lg text-lg min-h-[48px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Client Information */}
          {step === 4 && (
            <div className="p-6 lg:p-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-desperto-gold mb-6 text-center">
                Informações de Contacto
              </h2>
              
              <div className="max-w-lg mx-auto space-y-6">
                {/* Auto-fill notice for authenticated clients */}
                {authenticatedClient && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Dados preenchidos automaticamente</span>
                    </div>
                    <p className="text-blue-800 text-sm mt-1">
                      Os seus dados foram preenchidos automaticamente. Pode alterá-los se necessário.
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-5 h-5 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="text"
                      value={clientInfo.name}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-4 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-desperto-gold focus:border-transparent text-base min-h-[48px]"
                      placeholder="O seu nome"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email *
                  </label>
                  <div className="relative">
                    <Mail className="w-5 h-5 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="email"
                      value={clientInfo.email}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-4 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-desperto-gold focus:border-transparent text-base min-h-[48px]"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Telefone *
                  </label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="tel"
                      value={clientInfo.phone}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full pl-10 pr-4 py-4 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-desperto-gold focus:border-transparent text-base min-h-[48px]"
                      placeholder="+351 xxx xxx xxx"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Notas (opcional)
                  </label>
                  <div className="relative">
                    <MessageSquare className="w-5 h-5 absolute left-3 top-3 text-neutral-400" />
                    <textarea
                      value={clientInfo.notes}
                      onChange={(e) => setClientInfo(prev => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="w-full pl-10 pr-4 py-4 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-desperto-gold focus:border-transparent text-base resize-none"
                      placeholder="Algo que gostaria de partilhar..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row justify-between mt-8 space-y-4 lg:space-y-0 lg:space-x-4">
                <button
                  onClick={() => setStep(3)}
                  className="w-full lg:w-auto px-6 py-4 border border-neutral-300 rounded-xl font-semibold hover:bg-neutral-50 transition-colors min-h-[48px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  Voltar
                </button>
                <button
                  onClick={() => setStep(5)}
                  disabled={!clientInfo.name || !clientInfo.email || !clientInfo.phone}
                  className="w-full lg:w-auto px-8 py-4 bg-desperto-gold text-white rounded-xl font-semibold hover:bg-desperto-gold/90 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors shadow-lg text-lg min-h-[48px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Payment */}
          {step === 5 && selectedServiceDetails && (
            <div className="p-6 lg:p-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-desperto-gold mb-6 text-center">
                Pagamento
              </h2>
              
              <div className="max-w-lg mx-auto">
                <PaymentStep
                  amount={selectedServiceDetails.price}
                  serviceName={selectedServiceDetails.name}
                  onPaymentSuccess={handlePaymentSuccess}
                  onPaymentSkip={handlePaymentSkip}
                  requirePayment={requirePayment}
                  clientEmail={clientInfo.email}
                  serviceId={selectedService}
                  stripePaymentLink={selectedServiceDetails.stripePaymentLink}
                />
              </div>

              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setStep(4)}
                  className="w-full lg:w-auto px-6 py-4 border border-neutral-300 rounded-xl font-semibold hover:bg-neutral-50 transition-colors min-h-[48px]"
                  style={{ touchAction: 'manipulation' }}
                >
                  Voltar
                </button>
              </div>
            </div>
          )}

          {/* Step 6: Success */}
          {step === 6 && (
            <div className="p-6 lg:p-8 text-center">
              <div className="w-20 h-20 bg-desperto-yellow/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-desperto-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl lg:text-3xl font-bold text-desperto-gold mb-4">
                Agendamento Confirmado!
              </h2>
              <p className="text-neutral-600 mb-6">
                O seu agendamento foi registado com sucesso. Receberá um email de confirmação em breve.
              </p>
              
              {/* Booking Details */}
              <div className="bg-wellness-balance rounded-xl p-6 mb-6 text-left max-w-lg mx-auto">
                <h3 className="font-semibold text-desperto-gold mb-3">Detalhes do Agendamento:</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-neutral-700">Terapeuta:</span> <span className="text-neutral-800">{therapists.find(t => t.id === selectedTherapist)?.name}</span></p>
                  <p><span className="font-medium text-neutral-700">Serviço:</span> <span className="text-neutral-800">{services.find(s => s.id === selectedService)?.name}</span></p>
                  <p><span className="font-medium text-neutral-700">Data:</span> <span className="text-neutral-800">{selectedDate?.toLocaleDateString('pt-PT')}</span></p>
                  <p><span className="font-medium text-neutral-700">Hora:</span> <span className="text-neutral-800">{selectedTime}</span></p>
                  <p><span className="font-medium text-neutral-700">Nome:</span> <span className="text-neutral-800">{clientInfo.name}</span></p>
                  <p><span className="font-medium text-neutral-700">Email:</span> <span className="text-neutral-800">{clientInfo.email}</span></p>
                </div>
              </div>

              {/* Calendar Integration */}
              {selectedDate && selectedTime && selectedServiceDetails && (
                <div className="mb-6">
                  <h3 className="font-semibold text-desperto-gold mb-3">Adicionar ao Calendário</h3>
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    {(() => {
                      const startDate = new Date(`${selectedDate.toDateString()} ${selectedTime}`);
                      const endDate = new Date(startDate);
                      endDate.setMinutes(endDate.getMinutes() + selectedServiceDetails.duration);
                      const event = {
                        title: `${selectedServiceDetails.name} - Despertar`,
                        start: startDate,
                        end: endDate,
                        description: `Consulta com ${therapists.find(t => t.id === selectedTherapist)?.name}`,
                        location: 'Desperto - Despertar ao Minuto'
                      };
                      
                      return (
                        <>
                          <a href={CalendarService.generateGoogleCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className="px-4 py-3 bg-desperto-gold text-white rounded-xl hover:bg-desperto-gold/90 text-sm font-medium min-h-[48px] flex items-center justify-center" style={{ touchAction: 'manipulation' }}>Google Calendar</a>
                          <a href={CalendarService.generateOutlookCalendarUrl(event)} target="_blank" rel="noopener noreferrer" className="px-4 py-3 bg-desperto-yellow text-white rounded-xl hover:bg-desperto-yellow/90 text-sm font-medium min-h-[48px] flex items-center justify-center" style={{ touchAction: 'manipulation' }}>Outlook</a>
                          <button onClick={() => CalendarService.downloadICSFile(event)} className="px-4 py-3 bg-neutral-600 text-white rounded-xl hover:bg-neutral-700 text-sm font-medium min-h-[48px]" style={{ touchAction: 'manipulation' }}>Download .ics</button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (onComplete) {
                    onComplete();
                  } else {
                    setStep(1);
                    setSelectedTherapist('');
                    setSelectedService('');
                    setSelectedDate(null);
                    setSelectedTime('');
                    setClientInfo(authenticatedClient ? {
                      name: authenticatedClient.name,
                      email: authenticatedClient.email,
                      phone: authenticatedClient.phone || '',
                      notes: ''
                    } : { name: '', email: '', phone: '', notes: '' });
                    setAvailableSlots([]);
                  }
                }}
                className="w-full lg:w-auto px-8 py-4 bg-desperto-gold text-white rounded-xl font-semibold hover:bg-desperto-gold/90 transition-colors shadow-lg text-lg min-h-[48px]"
                style={{ touchAction: 'manipulation' }}
              >
                {onComplete ? 'Voltar ao Painel' : 'Novo Agendamento'}
              </button>
            </div>
          )}
        </div>
        
        {/* Login Modal */}
        {showLogin && (
          <ClientLogin
            onLogin={handleLogin}
            onClose={() => setShowLogin(false)}
          />
        )}

        {/* Client History Modal */}
        {showHistory && authenticatedClient && (
          <ClientHistory
            clientId={authenticatedClient.id}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>
    </div>
  );
}