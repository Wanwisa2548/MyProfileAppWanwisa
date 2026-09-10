-- Run once in phpMyAdmin on the application database.
-- Stores the price tier ("cheap" / "mid" / "expensive") computed by analysis/clustering.py (K-Means).
ALTER TABLE products
  ADD COLUMN price_tier VARCHAR(20) NULL DEFAULT NULL AFTER price;
