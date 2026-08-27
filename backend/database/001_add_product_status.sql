-- Run this once in phpMyAdmin on database ip_std6730202394.
ALTER TABLE products
  ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER image;
