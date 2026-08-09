-- PiSigma Webhooks spine

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 2000,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE api_keys (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  environment TEXT NOT NULL DEFAULT 'live', -- live | test
  last_used_at TEXT,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX api_keys_prefix_idx ON api_keys(key_prefix);
CREATE INDEX api_keys_product_idx ON api_keys(product_id);

CREATE TABLE endpoints (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  event_types TEXT, -- JSON string array; NULL = all events
  description TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX endpoints_product_idx ON endpoints(product_id);

CREATE TABLE deliveries (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  api_key_id TEXT,
  endpoint_id TEXT,
  url TEXT NOT NULL,
  signing_secret TEXT NOT NULL, -- snapshot for retries (endpoint or ad-hoc)
  event TEXT NOT NULL,
  payload TEXT NOT NULL, -- JSON body bytes that are signed & POSTed
  status TEXT NOT NULL, -- pending | delivered | exhausted
  attempt_count INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 4,
  next_attempt_at TEXT,
  last_status_code INTEGER,
  last_error TEXT,
  response_body TEXT,
  idempotency_key TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  delivered_at TEXT
);

CREATE UNIQUE INDEX deliveries_idempotency_uq
  ON deliveries(product_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX deliveries_product_created_idx ON deliveries(product_id, created_at);
CREATE INDEX deliveries_status_idx ON deliveries(status);
CREATE INDEX deliveries_retry_idx ON deliveries(status, next_attempt_at);

CREATE TABLE rate_buckets (
  product_id TEXT NOT NULL,
  hour_bucket TEXT NOT NULL, -- YYYY-MM-DDTHH
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, hour_bucket)
);
