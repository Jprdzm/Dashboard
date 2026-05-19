-- ============================================================
-- EJECUTA ESTO EN EL SQL EDITOR DE SUPABASE
-- ============================================================

CREATE TABLE IF NOT EXISTS suscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  nombre TEXT NOT NULL,
  costo NUMERIC(12,2) NOT NULL CHECK (costo > 0),
  fecha_renovacion DATE NOT NULL,
  banco_pago TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE suscripciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven SOLO sus suscripciones" ON suscripciones
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios insertan SOLO sus suscripciones" ON suscripciones
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan SOLO sus suscripciones" ON suscripciones
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios eliminan SOLO sus suscripciones" ON suscripciones
  FOR DELETE USING (user_id = auth.uid());
