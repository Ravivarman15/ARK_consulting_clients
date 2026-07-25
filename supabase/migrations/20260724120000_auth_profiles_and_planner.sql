-- ============================================================================
-- ARK Consulting — Accounts, roles and the Standard Revenue Planner
--
--   * profiles          — one row per auth user, auto-created on sign up.
--                         Anyone signing up with an @thearktuition.com address
--                         is flagged `management` (free, unlimited access).
--   * planner_scenarios — a saved planner: standards, fees, seat counts.
--   * audit_submissions — gains a user_id so management can attribute audits.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Roles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE public.app_role AS ENUM ('management', 'client');

CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email            TEXT NOT NULL,
  full_name        TEXT NOT NULL DEFAULT '',
  institution_name TEXT NOT NULL DEFAULT '',
  phone            TEXT NOT NULL DEFAULT '',
  location         TEXT NOT NULL DEFAULT '',
  role             public.app_role NOT NULL DEFAULT 'client',
  is_paid          BOOLEAN NOT NULL DEFAULT false,
  razorpay_payment_id TEXT,
  last_seen_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
  'Client/management directory. Populated by the on_auth_user_created trigger.';

-- The management domain lives in one place so it is easy to audit and change.
CREATE OR REPLACE FUNCTION public.role_for_email(p_email TEXT)
RETURNS public.app_role
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lower(p_email) LIKE '%@thearktuition.com' THEN 'management'::public.app_role
    ELSE 'client'::public.app_role
  END;
$$;

-- Sign-up hook: mirror the new auth user into profiles, lifting the details we
-- collected on the sign-up form out of raw_user_meta_data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, institution_name, phone, location, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'institution_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'location', ''),
    public.role_for_email(NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SECURITY DEFINER so the profiles policies below can ask "is this caller
-- management?" without re-entering the very policies being evaluated.
CREATE OR REPLACE FUNCTION public.is_management()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'management'
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Management reads every profile" ON public.profiles
  FOR SELECT TO authenticated USING (public.is_management());

-- `role` is deliberately NOT self-editable — it grants sight of every other
-- client's data, so the WITH CHECK pins it to its current value. `is_paid` is
-- self-editable: it only unlocks the caller's own report, and the checkout
-- handler sets it after Razorpay confirms. Tightening that to server-verified
-- requires a Razorpay webhook writing with the service role.
CREATE POLICY "Users update own profile details" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
  );

CREATE POLICY "Management updates any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_management())
  WITH CHECK (public.is_management());

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Planner scenarios
--
-- `groups` holds the whole standard tree as JSON:
--   [{ id, name, annualFee, standards: [{ id, name, code, capacity, enrolled,
--                                         annualFee }] }]
-- Keeping it as one document means adding a standard is a single write and the
-- slider state stays consistent with the fees it was priced against.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.planner_scenarios (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name             TEXT NOT NULL DEFAULT 'Untitled plan',
  institution_name TEXT NOT NULL DEFAULT '',
  monthly_expenses NUMERIC NOT NULL DEFAULT 550000,
  groups           JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX planner_scenarios_user_id_idx ON public.planner_scenarios (user_id);

CREATE TRIGGER planner_scenarios_touch_updated_at
  BEFORE UPDATE ON public.planner_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.planner_scenarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own scenarios" ON public.planner_scenarios
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Management reads every scenario" ON public.planner_scenarios
  FOR SELECT TO authenticated USING (public.is_management());

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Attribute audit submissions to the account that produced them
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.audit_submissions
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS audit_submissions_user_id_idx
  ON public.audit_submissions (user_id);

CREATE POLICY "Users read own submissions" ON public.audit_submissions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Management reads every submission" ON public.audit_submissions
  FOR SELECT TO authenticated USING (public.is_management());
