-- Layout cache table for storing computed 3D positions
-- Stores pre-computed layouts to avoid recalculating on every request

CREATE TABLE layout_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  layout_type VARCHAR(50) NOT NULL CHECK (layout_type IN ('DOMAIN_GRID', 'TEAM_TREEMAP', 'SERVICE_STACK')),
  positions JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Index for cache lookups by key
CREATE INDEX idx_layout_cache_key ON layout_cache(cache_key);
CREATE INDEX idx_layout_cache_type ON layout_cache(layout_type);
CREATE INDEX idx_layout_cache_expires ON layout_cache(expires_at);
