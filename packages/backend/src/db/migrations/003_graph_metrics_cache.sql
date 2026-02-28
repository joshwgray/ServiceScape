-- Cache table for computed graph analytics metrics
-- Used by analytics endpoints to avoid expensive graph recomputation

CREATE TABLE graph_metrics_cache (
  cache_key VARCHAR(255) PRIMARY KEY,
  cache_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

CREATE INDEX idx_graph_metrics_cache_expires ON graph_metrics_cache(expires_at);
