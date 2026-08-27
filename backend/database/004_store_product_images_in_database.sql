-- Run this once in phpMyAdmin on database ip_std6730202394.
-- Images are stored as data URLs in the existing image column.
ALTER TABLE products
  MODIFY COLUMN image LONGTEXT NOT NULL;