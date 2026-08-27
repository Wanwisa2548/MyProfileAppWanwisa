-- Run this once in phpMyAdmin against database ip_std6730202394.
-- It preserves existing accounts while upgrading the old `password` column
-- to the schema required by the login API.
START TRANSACTION;

ALTER TABLE users
  CHANGE COLUMN password password_hash VARCHAR(255) NOT NULL,
  ADD COLUMN email VARCHAR(255) NULL AFTER username;

UPDATE users
SET email = CONCAT(username, '@papengie.local')
WHERE email IS NULL OR email = '';

ALTER TABLE users
  MODIFY COLUMN email VARCHAR(255) NOT NULL,
  ADD UNIQUE KEY users_email_unique (email);

COMMIT;
