import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { useSupabaseAuth } from './hooks/useSupabaseAuth';
import { EmailService } from './services/emailService';
import { ClientBooking } from './components/ClientBooking/ClientBooking';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Calendar } from './components/Calendar/Calendar';
import { BookingsList } from './components/Bookings/BookingsList';
import { ClientsList } from './components/Clients/ClientsList';
import { PaymentsList } from './components/Payments/PaymentsList';
import { Settings } from './components/Settings/Settings';
import { EmailSetup } from './components/EmailSetup/EmailSetup';
import { TherapistManagement } from './components/Therapists/TherapistManagement';
import { CouponManagement } from './components/Coupons/CouponManagement';
import { TherapistNotes } from './components/Therapists/TherapistNotes';
import { UniversalAuth } from './components/Auth/UniversalAuth';
import { ClientHistory } from './components/ClientBooking/ClientHistory';
import { ClientDashboard } from './components/ClientBooking/ClientDashboard';
import { SystemCheck } from './components/Diagnostics/SystemCheck';

// Production environment - no hardcoded test users
let defaultUsers: any[] = [];

function App() {

const { user, loading, signIn, signUp, signOut } = useSupabaseAuth();
  const [activeTab, setActiveTab] = useState('client-booking');
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [authenticatedClient, setAuthenticatedClient] = useState<any>(null);
  const [showClientHistory, setShowClientHistory] = useState(false);
  const [showClientBookingForm, setShowClientBookingForm] = useState(false);

  // Check for client authentication
  useEffect(() => {
    const savedClientAuth = localStorage.getItem('clientAuth');
    if (savedClientAuth) {
      try {
        const clientData = JSON.parse(savedClientAuth);
        setAuthenticatedClient(clientData);
      } catch (error) {
        localStorage.removeItem('clientAuth');
      }
    }
  }, []);

  // Initialize EmailJS
  useEffect(() => {
    EmailService.initialize();
  }, []);



    const handleLogin = async (email: string, password: string) => {
    const result = await signIn(email, password);
    if (result.success) {
      // Set view mode based on user type
      if (result.user.userType === 'admin' || result.user.userType === 'therapist') {
        setActiveTab('dashboard');
      } else if (result.user.userType === 'client') {
        setActiveTab('client-booking');
      }
      setShowAdminLoginModal(false);
    }
    return result;
  };

  const handleRegister = async (email: string, password: string, fullName: string, phone?: string) => {
    const result = await signUp(email, password, fullName, phone);
    if (result.success) {
      // Novos utilizadores são sempre clientes
      setActiveTab('client-booking');
      setShowAdminLoginModal(false);
    }
    return result;
  };



  const handleLogout = () => {
    signOut();
    setActiveTab('client-booking');
    setShowAdminLoginModal(false);
  };


  const handleAdminLoginRequest = () => {
    setShowAdminLoginModal(true);
  };

  const handleAdminLoginClose = () => {
    setShowAdminLoginModal(false);
  };

  const handleClientLogin = (clientData: any) => {
    setAuthenticatedClient(clientData);
    localStorage.setItem('clientAuth', JSON.stringify(clientData));
    setShowClientBookingForm(false); // Prevent duplicate forms
  };

  const handleClientLogout = () => {
    console.log('🚪 Cliente fazendo logout...');
    setAuthenticatedClient(null);
    localStorage.removeItem('clientAuth');
    setShowClientBookingForm(false);

    // Se é um utilizador cliente logado, fazer logout completo
    if (user && user.userType === 'client') {
      signOut();
      setActiveTab('client-booking');
    }

    console.log('✅ Logout de cliente completo');
  };

  const handleNewBooking = () => {
    console.log('🎯 handleNewBooking chamado, estado atual:', {
      showClientBookingForm,
      isClientUser: !!isClientUser,
      authenticatedClient: !!authenticatedClient
    });
    // Prevent multiple booking forms
    if (showClientBookingForm) return;
    setShowClientBookingForm(true);
  };

  const handleBackToDashboard = () => {
    console.log('🎯 handleBackToDashboard chamado');
    setShowClientBookingForm(false);
  };

  const handleBookingComplete = () => {
    console.log('🎯 handleBookingComplete chamado');
    setShowClientBookingForm(false);
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-desperto-cream to-wellness-growth flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-desperto-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-desperto-gold font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  // Determine if user is staff (admin or therapist)
  const isStaffUser = user && (user.userType === 'admin' || user.userType === 'therapist');
  const isClientUser = user && user.userType === 'client';

  const renderContent = () => {
    // If client is logged in, show client dashboard or booking form
    if (isClientUser) {
      if (showClientBookingForm) {
        return (
          <ClientBooking 
            onComplete={handleBookingComplete}
            initialClientData={user}
            key="client-booking-form"
          />
        );
      }
      return (
        <ClientDashboard
          clientData={user}
          onLogout={handleClientLogout}
          onNewBooking={handleNewBooking}
        />
      );
    }

    // If authenticated client exists but not logged in as user, show client dashboard
    if (authenticatedClient && !user) {
      if (showClientBookingForm) {
        return (
          <ClientBooking 
            onComplete={handleBookingComplete}
            initialClientData={authenticatedClient}
            key="auth-client-booking-form"
          />
        );
      }
      return (
        <ClientDashboard
          clientData={authenticatedClient}
          onLogout={handleClientLogout}
          onNewBooking={handleNewBooking}
        />
      );
    }

    // If no user or staff user, show admin content
    switch (activeTab) {
      case 'client-booking':
        return <ClientBooking initialClientData={null} />;
      case 'dashboard':
        return <Dashboard onNavigate={setActiveTab} currentUser={user} />;
      case 'calendar':
        return <Calendar />;
      case 'bookings':
        return <BookingsList />;
      case 'clients':
        return <ClientsList />;
      case 'payments':
        return <PaymentsList />;
      case 'coupons':
        return <CouponManagement />;
      case 'therapist-notes':
        return <TherapistNotes />;
      case 'system-check':
        return <SystemCheck />;
      case 'messages':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Mensagens Em Breve</h3>
            <p className="text-gray-500">Sistema de comunicação automatizada estará disponível aqui</p>
          </div>
        );
      case 'settings':
        return <Settings />;
      case 'email-setup':
        return <EmailSetup />;
      case 'therapist-management':
        return <TherapistManagement />;
      default:
        return <Dashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar only for staff users */}
        {isStaffUser && (
          <div className="flex">
            <div className="w-64 flex-shrink-0">
              <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
            <div className="flex-1">
              <Header 
                activeTab={activeTab}
                user={user}
                onStaffLogin={handleAdminLoginRequest}
                onLogout={handleLogout}
                isStaffUser={isStaffUser}
                authenticatedClient={authenticatedClient}
                onClientLogin={() => setShowAdminLoginModal(true)}
                onClientLogout={handleClientLogout}
                onShowHistory={() => setShowClientHistory(true)}
              />
              <main className="p-6">
                {renderContent()}
              </main>
            </div>
          </div>
        )}
        
        {/* Layout for clients and unauthenticated users */}
        {!isStaffUser && !isClientUser && (
          <>
            <Header 
              activeTab={activeTab}
              user={user}
              onStaffLogin={handleAdminLoginRequest}
              onLogout={handleLogout}
              isStaffUser={isStaffUser}
              authenticatedClient={authenticatedClient}
              onClientLogin={() => setShowClientLoginModal(true)}
              onClientLogout={handleClientLogout}
              onShowHistory={() => setShowClientHistory(true)}
            />
            <main className="p-6">
              {renderContent()}
            </main>
          </>
        )}

        {/* Layout for logged in clients - no header, full dashboard */}
        {isClientUser && (
          <main>
            {renderContent()}
          </main>
        )}

        {/* Layout for authenticated clients (not logged in users) */}
        {!isStaffUser && !isClientUser && authenticatedClient && (
          <main>
            {renderContent()}
          </main>
        )}
        
        {/* Modals */}
        {showClientHistory && authenticatedClient && (
          <ClientHistory
            clientData={authenticatedClient}
            onClose={() => setShowClientHistory(false)}
          />
        )}
        
        {/* Universal Login/Register Modal */}
        {showAdminLoginModal && (
          <UniversalAuth
            onLogin={handleLogin}
            onRegister={handleRegister}
            onClose={handleAdminLoginClose}
            title="Entrar na Desperto"
          />
        )}

      </div>
    </AppProvider>
  );
}

export default App;