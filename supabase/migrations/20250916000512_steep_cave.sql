/*
  # Sistema de Autenticação Completo - Desperto

  1. Tipos e Enums
    - user_role: ADMIN, THERAPIST, CLIENT

  2. Tabelas
    - profiles: Perfis de utilizador sincronizados com auth.users
    - therapists: Dados específicos de terapeutas
    - clients: Dados específicos de clientes com atribuição a terapeuta

  3. Segurança
    - RLS ativado em todas as tabelas
    - Policies específicas por papel
    - Função helper para obter papel do utilizador atual

  4. Triggers
    - Auto-atualização de updated_at
*/

-- 1) Criar enum para papéis
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'THERAPIST', 'CLIENT');

-- 2) Tabela de perfis sincronizada com auth.users
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  role public.user_role NOT NULL DEFAULT 'CLIENT',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3) Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger 
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;

-- 4) Trigger para profiles
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) Tabela de terapeutas
CREATE TABLE public.therapists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_therapists_updated_at
  BEFORE UPDATE ON public.therapists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) Tabela de clientes
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  therapist_id uuid REFERENCES public.therapists(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TRIGGER trg_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7) Ativar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- 8) Função helper para obter papel do utilizador atual
CREATE OR REPLACE FUNCTION public.current_user_role() 
RETURNS public.user_role
LANGUAGE sql STABLE AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 9) Policies para PROFILES
-- ADMIN pode tudo
CREATE POLICY "profiles_admin_all"
  ON public.profiles
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'ADMIN'
  ))
  WITH CHECK (true);

-- Utilizador vê/edita apenas o seu próprio perfil (se ativo)
CREATE POLICY "profiles_self_read"
  ON public.profiles
  FOR SELECT
  USING (id = auth.uid() AND is_active = true);

CREATE POLICY "profiles_self_update"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid() AND is_active = true)
  WITH CHECK (id = auth.uid());

-- 10) Policies para THERAPISTS
-- ADMIN full access
CREATE POLICY "therapists_admin_all"
  ON public.therapists
  FOR ALL
  USING (public.current_user_role() = 'ADMIN')
  WITH CHECK (true);

-- Terapeuta lê/edita o seu registo
CREATE POLICY "therapists_self_rw"
  ON public.therapists
  FOR ALL
  USING (user_id = auth.uid());

-- 11) Policies para CLIENTS
-- ADMIN full access
CREATE POLICY "clients_admin_all"
  ON public.clients
  FOR ALL
  USING (public.current_user_role() = 'ADMIN')
  WITH CHECK (true);

-- Terapeuta pode ver clientes atribuídos
CREATE POLICY "clients_therapist_read_assigned"
  ON public.clients
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.therapists t
    WHERE t.user_id = auth.uid() AND t.id = clients.therapist_id
  ));

-- Cliente vê/edita apenas o seu
CREATE POLICY "clients_self_read"
  ON public.clients
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "clients_self_update"
  ON public.clients
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 12) Criar utilizador ADMIN inicial (opcional - pode ser feito manualmente)
-- Descomente e ajuste o email conforme necessário:
/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@desperto.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  ''
);

INSERT INTO public.profiles (id, full_name, role, is_active)
SELECT id, 'Administrador', 'ADMIN', true
FROM auth.users WHERE email = 'admin@desperto.com';
*/