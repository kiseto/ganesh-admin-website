-- Ganesh Garments CMS schema for MySQL 8+ / MariaDB 10.4+ (XAMPP).
-- Create/select the database in phpMyAdmin before running this file.

CREATE TABLE IF NOT EXISTS admin_profiles (
  id CHAR(36) NOT NULL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('administrator', 'editor') NOT NULL DEFAULT 'editor',
  deleted_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_admin_sessions_user (user_id),
  INDEX idx_admin_sessions_expiry (expires_at),
  CONSTRAINT fk_admin_sessions_user FOREIGN KEY (user_id) REFERENCES admin_profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_drafts (
  site_key VARCHAR(80) NOT NULL PRIMARY KEY,
  schema_version INT UNSIGNED NOT NULL,
  content JSON NOT NULL,
  version BIGINT UNSIGNED NOT NULL DEFAULT 0,
  updated_by CHAR(36) NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX idx_site_drafts_updated (updated_at),
  CONSTRAINT fk_site_drafts_user FOREIGN KEY (updated_by) REFERENCES admin_profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS site_publications (
  site_key VARCHAR(80) NOT NULL PRIMARY KEY,
  schema_version INT UNSIGNED NOT NULL,
  content JSON NOT NULL,
  version BIGINT UNSIGNED NOT NULL,
  published_by CHAR(36) NULL,
  published_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_site_publications_user FOREIGN KEY (published_by) REFERENCES admin_profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS content_revision_history (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  site_key VARCHAR(80) NOT NULL,
  schema_version INT UNSIGNED NOT NULL,
  content JSON NOT NULL,
  version BIGINT UNSIGNED NOT NULL,
  published_by CHAR(36) NULL,
  published_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_revision_site_version (site_key, version),
  CONSTRAINT fk_revision_user FOREIGN KEY (published_by) REFERENCES admin_profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media_assets (
  id CHAR(36) NOT NULL PRIMARY KEY,
  storage_path VARCHAR(500) NOT NULL UNIQUE,
  mime_type VARCHAR(80) NOT NULL,
  size_bytes BIGINT UNSIGNED NOT NULL,
  width INT UNSIGNED NULL,
  height INT UNSIGNED NULL,
  original_filename VARCHAR(255) NOT NULL,
  created_by CHAR(36) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  deleted_at DATETIME(6) NULL,
  INDEX idx_media_active (deleted_at),
  CONSTRAINT fk_media_user FOREIGN KEY (created_by) REFERENCES admin_profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor CHAR(36) NULL,
  action VARCHAR(80) NOT NULL,
  revision_id BIGINT UNSIGNED NULL,
  asset_id CHAR(36) NULL,
  metadata JSON NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_actor (actor),
  CONSTRAINT fk_audit_revision FOREIGN KEY (revision_id) REFERENCES content_revision_history(id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_asset FOREIGN KEY (asset_id) REFERENCES media_assets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Remove expired sessions periodically (run from a scheduler or before login).
-- DELETE FROM admin_sessions WHERE expires_at <= UTC_TIMESTAMP();
