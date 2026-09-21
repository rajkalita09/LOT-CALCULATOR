CREATE TABLE IF NOT EXISTS calculation_requests (
  id BIGSERIAL PRIMARY KEY,
  total_lot NUMERIC(12, 6) NOT NULL CHECK (total_lot > 0),
  stop_loss_pips NUMERIC(12, 4) NOT NULL CHECK (stop_loss_pips >= 0),
  target_rr NUMERIC(8, 4) NOT NULL DEFAULT 0 CHECK (target_rr >= 0),
  exits JSONB NOT NULL CHECK (jsonb_typeof(exits) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS calculation_requests_created_at_idx
  ON calculation_requests (created_at DESC);
