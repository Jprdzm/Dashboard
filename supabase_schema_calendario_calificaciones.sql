-- ============================================================
-- EJECUTA ESTO EN EL SQL EDITOR DE SUPABASE
-- Tablas para los módulos Calendario y Calificaciones
-- ============================================================

-- ─────────────────────────────
-- TABLA: eventos (Calendario)
-- ─────────────────────────────
-- Las columnas "startTime", "endTime" y "materiaId" van entre comillas
-- dobles a propósito: así Postgres conserva el camelCase exacto que ya
-- usa el frontend (src/pages/CalendarioPage.jsx, CalendarEventForm.jsx),
-- sin necesitar una capa de traducción snake_case <-> camelCase.
--
-- `id` es TEXT (no UUID) porque los eventos generados desde el módulo de
-- Calificaciones usan un id determinístico
-- (`grade-<user_id>-<materiaId>-<componenteSlug>`, ver src/services/calendarEvents.js)
-- para poder actualizar la misma fila en vez de duplicarla al cambiar una
-- fecha. El user_id va embebido en ese id para que sea único a nivel de
-- toda la tabla (la PK es global, no está limitada por usuario) y así dos
-- usuarios con la misma materia/componente nunca choquen.
CREATE TABLE IF NOT EXISTS eventos (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  "startTime" TEXT,
  "endTime" TEXT,
  type TEXT NOT NULL CHECK (type IN ('examen', 'entrega', 'clase', 'personal', 'cita', 'tarea')),
  "materiaId" TEXT,
  description TEXT DEFAULT '',
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'grades')),
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven SOLO sus eventos" ON eventos
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios insertan SOLO sus eventos" ON eventos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan SOLO sus eventos" ON eventos
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios eliminan SOLO sus eventos" ON eventos
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────
-- TABLA: calificaciones
-- ─────────────────────────────
-- Una fila por materia por usuario. `data` guarda las calificaciones
-- capturadas (componentes, subcomponentes, subNotas, fechas) tal cual las
-- produce src/utils/grades.js — misma idea que la columna `logs` de `habits`.
-- `id` = "<user_id>-<materiaId>" para que sea única a nivel de toda la tabla.
CREATE TABLE IF NOT EXISTS calificaciones (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  materia_id TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios ven SOLO sus calificaciones" ON calificaciones
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuarios insertan SOLO sus calificaciones" ON calificaciones
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios actualizan SOLO sus calificaciones" ON calificaciones
  FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios eliminan SOLO sus calificaciones" ON calificaciones
  FOR DELETE USING (user_id = auth.uid());

-- ─────────────────────────────
-- MIGRACIÓN: tipos 'cita' y 'tarea' + columna completed (eventos)
-- ─────────────────────────────
-- Idempotente: seguro de correr tanto si la tabla `eventos` se está creando
-- por primera vez con el CREATE TABLE de arriba (que ya incluye estos
-- cambios) como si ya existía de una corrida anterior de este script con el
-- CHECK viejo. `eventos_type_check` es el nombre que Postgres genera
-- automáticamente para un CHECK sin nombre explícito en la columna `type`.
ALTER TABLE eventos DROP CONSTRAINT IF EXISTS eventos_type_check;
ALTER TABLE eventos ADD CONSTRAINT eventos_type_check
  CHECK (type IN ('examen', 'entrega', 'clase', 'personal', 'cita', 'tarea'));
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- ─────────────────────────────
-- VERIFICACIÓN
-- ─────────────────────────────
SELECT tablename, rowsecurity FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('eventos', 'calificaciones')
  ORDER BY tablename;
