-- ============================================================
-- SECOND BRAIN — ESQUEMA COMPLETO DE SUPABASE
-- Pega TODO esto en Supabase SQL Editor (https://supabase.com)
-- Ejecuta línea por línea o todo junto
-- ============================================================

-- ─────────────────────────────
-- 1. TABLA: finanzas
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS finanzas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  tipo TEXT NOT NULL CHECK (tipo IN ('gasto', 'ingreso')),
  descripcion TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Otros',
  fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE finanzas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven SOLO sus finanzas" ON finanzas
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios insertan SOLO sus finanzas" ON finanzas
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan SOLO sus finanzas" ON finanzas
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios eliminan SOLO sus finanzas" ON finanzas
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────
-- 2. TABLA: deudas
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS deudas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  nombre TEXT NOT NULL,
  name TEXT NOT NULL,
  monto_total NUMERIC(12,2) NOT NULL CHECK (monto_total > 0),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount > 0),
  tasa_interes NUMERIC(5,2) DEFAULT 0,
  interest_rate NUMERIC(5,2) DEFAULT 0,
  minimum_payment NUMERIC(12,2) NOT NULL CHECK (minimum_payment > 0),
  creditor TEXT DEFAULT '',
  acreedor TEXT DEFAULT '',
  amount_paid NUMERIC(12,2) DEFAULT 0,
  paidAmount NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deudas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven SOLO sus deudas" ON deudas
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios insertan SOLO sus deudas" ON deudas
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan SOLO sus deudas" ON deudas
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios eliminan SOLO sus deudas" ON deudas
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────
-- 3. TABLA: deudas_abonos
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS deudas_abonos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  deuda_id UUID REFERENCES deudas(id) ON DELETE CASCADE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  cantidad_abonada NUMERIC(12,2) NOT NULL CHECK (cantidad_abonada > 0),
  amount_paid NUMERIC(12,2) NOT NULL CHECK (amount_paid > 0),
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  nota TEXT DEFAULT '',
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE deudas_abonos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven SOLO sus abonos" ON deudas_abonos
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios insertan SOLO sus abonos" ON deudas_abonos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan SOLO sus abonos" ON deudas_abonos
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios eliminan SOLO sus abonos" ON deudas_abonos
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────
-- 4. TABLA: metas
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  nombre TEXT NOT NULL,
  name TEXT NOT NULL,
  monto_objective NUMERIC(12,2) NOT NULL CHECK (monto_objective > 0),
  target_amount NUMERIC(12,2) NOT NULL CHECK (target_amount > 0),
  goal_amount NUMERIC(12,2) NOT NULL CHECK (goal_amount > 0),
  monto_actual NUMERIC(12,2) DEFAULT 0,
  current_amount NUMERIC(12,2) DEFAULT 0,
  deadline DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE metas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven SOLO sus metas" ON metas
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios insertan SOLO sus metas" ON metas
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan SOLO sus metas" ON metas
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios eliminan SOLO sus metas" ON metas
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────
-- 5. TABLA: user_preferences
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, key)
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven SOLO sus preferencias" ON user_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios insertan SOLO sus preferencias" ON user_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan SOLO sus preferencias" ON user_preferences
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios eliminan SOLO sus preferencias" ON user_preferences
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────
-- 6. TABLA: habits  👈 NUEVA
-- ─────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  logs JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven SOLO sus hábitos" ON habits
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios insertan SOLO sus hábitos" ON habits
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan SOLO sus hábitos" ON habits
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios eliminan SOLO sus hábitos" ON habits
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────
-- 7. FUNCIÓN: auto-add user_id trigger helper
-- ─────────────────────────────
-- Opcional: si quieres que user_id se asigne automáticamente
-- basado en el token JWT (más seguro que enviarlo desde el frontend)
-- Descomenta y adapta para cada tabla si lo prefieres:

-- CREATE OR REPLACE FUNCTION set_user_id()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.user_id = auth.uid();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- CREATE TRIGGER trg_finanzas_user_id BEFORE INSERT ON finanzas
--   FOR EACH ROW EXECUTE FUNCTION set_user_id();

-- ─────────────────────────────
-- 8. VERIFICACIÓN
-- ─────────────────────────────
-- Corre esto para confirmar que las políticas están activas:
SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('finanzas','deudas','deudas_abonos','metas','user_preferences','habits')
  ORDER BY tablename;
