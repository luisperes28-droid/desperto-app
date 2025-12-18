import { Service, Therapist, BusinessSettings } from '../types';

export const defaultBusinessSettings: BusinessSettings = {
  businessName: 'Desperto',
  businessEmail: 'euestoudesperto@gmail.com',
  logo: '',
  colors: {
    primary: '#725c1a',
    secondary: '#030303',
    accent: '#e2bc33'
  },
  workingHours: {
    start: '09:00',
    end: '17:00',
    breaks: [{ start: '12:00', end: '12:30' }]
  },
  bookingRules: {
    minAdvanceNotice: 2,
    maxAdvanceBooking: 30,
    defaultDuration: 60,
    bufferTime: 15
  },
  paymentSettings: {
    requireDeposit: true,
    depositAmount: 100,
    acceptedMethods: ['card', 'paypal', 'mbway', 'multibanco']
  }
};

export const defaultServices: Service[] = [
  {
    id: '1',
    name: 'Psicoterapia UCEM',
    duration: 60,
    price: 55,
    description: 'Psicoterapia baseada em Um Curso em Milagres',
    category: 'Padrão',
    therapistId: '1'
  },
  {
    id: '2',
    name: 'Sessão Miracle Choice',
    duration: 60,
    price: 35,
    description: 'Sessão de transformação através do Miracle Choice',
    category: 'Padrão',
    therapistId: '1',
    stripePaymentLink: 'https://buy.stripe.com/bJe00j4TvcqdcXf3LD93y00'
  },
  {
    id: '3',
    name: 'Coaching Pessoal',
    duration: 60,
    price: 50,
    description: 'Sessão de coaching para desenvolvimento pessoal',
    category: 'Padrão',
    therapistId: '1'
  },
  {
    id: '4',
    name: 'Sessão Miracle Choice',
    duration: 60,
    price: 35,
    description: 'Sessão de transformação através do Miracle Choice',
    category: 'Terapia',
    therapistId: '2',
    stripePaymentLink: 'https://buy.stripe.com/bJe00j4TvcqdcXf3LD93y00'
  },
  {
    id: '5',
    name: 'Terapia pelo Perdão',
    duration: 90,
    price: 45,
    description: 'Processo terapêutico focado no perdão e libertação',
    category: 'Terapia',
    therapistId: '2'
  },
  {
    id: '6',
    name: 'Consulta Coerência Bioemocional',
    duration: 120,
    price: 55,
    description: 'Consulta especializada em coerência bioemocional',
    category: 'Consultoria',
    therapistId: '2'
  }
];

export const defaultTherapists: Therapist[] = [
  {
    id: '1',
    name: 'Luís Peres',
    specialties: ['Psicoterapia UCEM', 'Sessão Miracle choice', 'Coaching Pessoal (Despertar ao Minuto)'],
    bio: 'Luís Peres é Facilitador de Um Curso em Milagres e Miracle Choice , Psicoterapeuta UCEM e Coach Pessoal',
    image: '/Luis.jpg',
    available: true,
    isAdmin: true,
    email: 'luisperes28@gmail.com',
    status: 'active',
    availability: {
      id: '1',
      therapistId: '1',
      workingDays: [1, 2, 3, 4, 5],
      workingHours: { start: '09:00', end: '17:00' },
      breaks: [{ start: '12:00', end: '12:30' }],
      blockedDates: [],
      customSchedule: [
        {
          date: new Date('2025-01-15T00:00:00'),
          available: true,
          customHours: { start: '14:00', end: '18:00' }
        }
      ],
      bufferTime: 15,
      maxAdvanceBooking: 30,
      minAdvanceNotice: 2
    }
  },
  {
    id: '2',
    name: 'Christina Loureiro',
    specialties: ['Consulta Coerência Bioemocional', 'Terapia pelo Perdão', 'Sessão Miracle Choice'],
    bio: 'Estudou enfermagem é Coach Facilitadora de Um Curso em Milagres e Miracle Choice Consultora em Coerência Bioemocional e Mestre de Reiki',
    image: '/Christina/Christina.jpg',
    available: true,
    isAdmin: false,
    email: 'csloureiro88@gmail.com',
    invitedBy: '1',
    invitedAt: new Date('2024-01-01'),
    status: 'active',
    availability: {
      id: '2',
      therapistId: '2',
      workingDays: [1, 2, 3, 4, 5, 6],
      workingHours: { start: '09:00', end: '17:00' },
      breaks: [{ start: '12:00', end: '12:30' }],
      blockedDates: [],
      customSchedule: [],
      bufferTime: 15,
      maxAdvanceBooking: 30,
      minAdvanceNotice: 2
    }
  }
];