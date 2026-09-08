-- Preserve existing account roles while allowing administrator-defined roles.
CREATE TABLE IF NOT EXISTS admin_roles (
  id VARCHAR(80) NOT NULL PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  can_publish BOOLEAN NOT NULL DEFAULT FALSE,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO admin_roles (id, name, can_publish, is_system) VALUES
  ('administrator', 'Administrator', TRUE, TRUE),
  ('editor', 'Editor', FALSE, TRUE);

ALTER TABLE admin_profiles MODIFY role VARCHAR(80) NOT NULL DEFAULT 'editor';
