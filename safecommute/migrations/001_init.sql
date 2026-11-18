-- SafeCommute MariaDB Schema
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Users table (replaces auth.users and profiles)
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `avatar_url` VARCHAR(255) DEFAULT NULL,
  `created_at` DATETIME(3) NOT NULL,
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Report Type TTL reference table
CREATE TABLE IF NOT EXISTS `report_type_ttl` (
  `type` VARCHAR(50) NOT NULL,
  `label` VARCHAR(100) NOT NULL,
  `color` VARCHAR(20) NOT NULL,
  `ttl_minutes` INT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed all 8 standard report types
INSERT INTO `report_type_ttl` (`type`, `label`, `color`, `ttl_minutes`) VALUES
('banjir', '🌊 Banjir (Flood)', '#3B82F6', 180),
('macet', '🚗 Macet (Traffic)', '#EF4444', 180),
('kriminal', '⚠️ Kriminal (Crime)', '#DC2626', 180),
('banjir_rob', '🌊 Banjir Rob (High Tide)', '#0EA5E9', 180),
('jalan_rusak', '🚧 Jalan Rusak (Road Damage)', '#F59E0B', 10080),
('lampu_mati', '💡 Lampu Mati (Light Out)', '#6B7280', 10080),
('tanggul_jebol', '🏚️ Tanggul Jebol (Broken Dam)', '#7F1D1D', 10080),
('kapal_tenggelam', '🚢 Kapal Tenggelam (Sunken Ship)', '#1E3A8A', 10080)
ON DUPLICATE KEY UPDATE 
  `label` = VALUES(`label`),
  `color` = VALUES(`color`),
  `ttl_minutes` = VALUES(`ttl_minutes`);

-- 3. Reports table
CREATE TABLE IF NOT EXISTS `reports` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `description` VARCHAR(500) DEFAULT NULL,
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `image_path` VARCHAR(255) DEFAULT NULL,
  `trust_score` INT NOT NULL DEFAULT 0,
  `is_resolved` TINYINT(1) NOT NULL DEFAULT 0,
  `last_confirmed_at` DATETIME(3) NOT NULL,
  `created_at` DATETIME(3) NOT NULL,
  `deleted_at` DATETIME(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_reports_active_ttl` (`deleted_at`, `trust_score`, `last_confirmed_at`),
  KEY `idx_reports_coords` (`latitude`, `longitude`),
  KEY `idx_reports_user` (`user_id`, `deleted_at`),
  CONSTRAINT `fk_reports_type` FOREIGN KEY (`type`) REFERENCES `report_type_ttl` (`type`) ON UPDATE CASCADE,
  CONSTRAINT `fk_reports_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Votes table
CREATE TABLE IF NOT EXISTS `votes` (
  `id` CHAR(36) NOT NULL,
  `report_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `vote_type` ENUM('up', 'down') NOT NULL,
  `created_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_report_user_vote` (`report_id`, `user_id`),
  KEY `idx_votes_user` (`user_id`),
  CONSTRAINT `fk_votes_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_votes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Rate limiting table
CREATE TABLE IF NOT EXISTS `rate_limits` (
  `key_name` VARCHAR(191) NOT NULL,
  `action` VARCHAR(50) NOT NULL,
  `hits` INT NOT NULL DEFAULT 1,
  `window_expires_at` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`key_name`, `action`),
  KEY `idx_rate_limits_window` (`window_expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. External Geocoding & Routing Cache table (prevents spamming Nominatim / OSRM)
CREATE TABLE IF NOT EXISTS `geo_cache` (
  `cache_key` VARCHAR(191) NOT NULL,
  `data` MEDIUMTEXT NOT NULL,
  `expires_at` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`cache_key`),
  KEY `idx_geo_cache_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
