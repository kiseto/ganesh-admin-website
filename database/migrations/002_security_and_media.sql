-- Repeatable MariaDB tables for login throttling and published media visibility.
CREATE TABLE IF NOT EXISTS auth_login_attempts (
  bucket CHAR(64) NOT NULL PRIMARY KEY,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  window_started_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS media_publications (
  asset_id CHAR(36) NOT NULL PRIMARY KEY,
  first_published_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_media_publication_asset FOREIGN KEY (asset_id) REFERENCES media_assets(id)
) ENGINE=InnoDB;
