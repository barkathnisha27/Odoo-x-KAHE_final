-- Create cafes table
CREATE TABLE IF NOT EXISTS public.cafes (
  id TEXT PRIMARY KEY,
  cafe_name TEXT NOT NULL,
  owner_name TEXT,
  owner_email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  upi_id TEXT,
  logo_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant permissions for cafes
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cafes TO authenticated;
GRANT ALL ON public.cafes TO service_role;
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read cafes" ON public.cafes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert cafes" ON public.cafes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Owner/Admin can update cafes" ON public.cafes
  FOR UPDATE TO authenticated USING (true);

-- Add cafe_id to profiles
ALTER TABLE IF EXISTS public.profiles ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE SET NULL;

-- Create cafe_invites table
CREATE TABLE IF NOT EXISTS public.cafe_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id TEXT NOT NULL REFERENCES public.cafes(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Grant permissions for invites
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cafe_invites TO authenticated;
GRANT ALL ON public.cafe_invites TO service_role;
ALTER TABLE public.cafe_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read invites" ON public.cafe_invites
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage invites" ON public.cafe_invites
  FOR ALL TO authenticated USING (true);

-- Add cafe_id to scoped tables if exist (Using simple statements instead of DO blocks)
ALTER TABLE IF EXISTS public.products ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.categories ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.floors ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.tables ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.orders ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.order_items ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.payments ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.customers ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.ingredients ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.recipes ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.coupons ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.promotions ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.pos_sessions ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.bookings ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.prediction_dataset ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.ai_insights ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.map_data ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;
ALTER TABLE IF EXISTS public.simulations ADD COLUMN IF NOT EXISTS cafe_id TEXT REFERENCES public.cafes(id) ON DELETE CASCADE;

-- Seed demo cafe
INSERT INTO public.cafes (id, cafe_name, owner_name, owner_email, city, upi_id, is_active)
VALUES ('demo-cafe-1', 'DineFlow Demo Cafe', 'Nisha', 'admin@dineflow.ai', 'Coimbatore', 'dineflow@ybl', true)
ON CONFLICT (id) DO UPDATE SET 
  cafe_name = EXCLUDED.cafe_name,
  owner_name = EXCLUDED.owner_name,
  owner_email = EXCLUDED.owner_email,
  city = EXCLUDED.city,
  upi_id = EXCLUDED.upi_id,
  is_active = EXCLUDED.is_active;

-- Update existing profiles to use demo cafe
UPDATE public.profiles SET cafe_id = 'demo-cafe-1' WHERE email IN ('admin@dineflow.ai', 'cashier@dineflow.ai', 'kitchen@dineflow.ai', 'customer@dineflow.ai') OR cafe_id IS NULL;

-- Replace handle_new_user to process cafe_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role app_role;
  v_name TEXT;
  v_cafe_id TEXT;
BEGIN
  v_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
  v_role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'customer'::app_role);
  v_cafe_id := COALESCE(NEW.raw_user_meta_data->>'cafe_id', 'demo-cafe-1');

  INSERT INTO public.profiles (id, name, email, phone, dietary_preferences, cafe_id)
  VALUES (
    NEW.id,
    v_name,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(
      ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'dietary_preferences')),
      '{}'::text[]
    ),
    v_cafe_id
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, v_role);

  RETURN NEW;
END;
$$;
