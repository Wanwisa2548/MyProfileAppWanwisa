-- Run this once in phpMyAdmin on database ip_std6730202394.
ALTER TABLE products
  ADD COLUMN stock INT NOT NULL DEFAULT 0 AFTER rating;
