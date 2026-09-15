-- IPZStream Etapa 11: sesiones de clientes IPTV
CREATE TABLE IF NOT EXISTS client_sessions (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(191) NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_client_sessions_user (user_id),
  INDEX idx_client_sessions_expiry (expires_at)
);
