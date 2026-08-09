-- PiSigma Mail spine

CREATE TABLE products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  allowed_from TEXT NOT NULL DEFAULT '[]', -- JSON string array
  rate_limit_per_hour INTEGER NOT NULL DEFAULT 500,
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

CREATE TABLE templates (
  id TEXT NOT NULL, -- product-scoped template id, e.g. submission
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  html TEXT,
  text TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  PRIMARY KEY (product_id, id)
);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id),
  api_key_id TEXT,
  to_addrs TEXT NOT NULL, -- JSON array
  from_addr TEXT NOT NULL,
  reply_to TEXT,
  subject TEXT NOT NULL,
  template_id TEXT,
  provider TEXT NOT NULL,
  provider_id TEXT,
  status TEXT NOT NULL, -- queued | sent | failed | skipped
  error TEXT,
  tags TEXT, -- JSON
  metadata TEXT, -- JSON
  idempotency_key TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE UNIQUE INDEX messages_idempotency_uq
  ON messages(product_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX messages_product_created_idx ON messages(product_id, created_at);
CREATE INDEX messages_status_idx ON messages(status);

CREATE TABLE rate_buckets (
  product_id TEXT NOT NULL,
  hour_bucket TEXT NOT NULL, -- YYYY-MM-DDTHH
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, hour_bucket)
);
