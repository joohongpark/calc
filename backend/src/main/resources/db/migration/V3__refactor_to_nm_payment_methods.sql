-- V3: Refactor payment methods to N:M relationship
-- This eliminates data duplication by using a single payment_methods table
-- and a mapping table for user-payment method relationships

-- Step 1: Create new payment_methods table (replaces payment_method_templates)
CREATE TABLE payment_methods (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    is_system BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE for default methods, FALSE for user-created
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Create N:M mapping table (replaces user_payment_methods)
CREATE TABLE user_payment_method_mapping (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    payment_method_id BIGINT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_method FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE CASCADE,
    CONSTRAINT unique_user_payment_method UNIQUE (user_id, payment_method_id)
);

-- Step 3: Migrate data from payment_method_templates to payment_methods
INSERT INTO payment_methods (name, is_system, sort_order, created_at)
SELECT name, TRUE, sort_order, created_at
FROM payment_method_templates;

-- Step 3.1: Reset sequence to avoid conflicts
SELECT setval('payment_methods_id_seq', (SELECT MAX(id) FROM payment_methods));

-- Step 4: Migrate data from user_payment_methods to new structure
-- This is complex because we need to deduplicate payment method names
-- and create proper mappings

-- 4.1: Insert unique payment method names from user_payment_methods that don't exist yet
INSERT INTO payment_methods (name, is_system, sort_order, created_at)
SELECT DISTINCT name, FALSE, 0, MIN(created_at)
FROM user_payment_methods
WHERE name NOT IN (SELECT name FROM payment_methods)
GROUP BY name;

-- 4.2: Create mappings for all user payment methods
INSERT INTO user_payment_method_mapping (user_id, payment_method_id, is_active, sort_order, created_at)
SELECT
    upm.user_id,
    pm.id,
    upm.is_active,
    upm.sort_order,
    upm.created_at
FROM user_payment_methods upm
INNER JOIN payment_methods pm ON upm.name = pm.name;

-- Step 5: Update transactions table to reference payment_methods instead of user_payment_methods
-- The payment_method_id in transactions currently points to user_payment_methods.id
-- We need to update it to point to payment_methods.id

-- Create a temporary mapping table
CREATE TEMP TABLE payment_method_id_mapping AS
SELECT
    upm.id AS old_id,
    pm.id AS new_id
FROM user_payment_methods upm
INNER JOIN payment_methods pm ON upm.name = pm.name;

-- Update transactions to use new payment_method_id
UPDATE transactions t
SET payment_method_id = m.new_id
FROM payment_method_id_mapping m
WHERE t.payment_method_id = m.old_id;

-- Step 6: Drop foreign key constraint first, then drop old tables
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS fk_transactions_payment_method;

DROP TABLE IF EXISTS user_payment_methods;
DROP TABLE IF EXISTS payment_method_templates;

-- Step 7: Create indices for performance
CREATE INDEX idx_user_payment_method_mapping_user_id ON user_payment_method_mapping(user_id);
CREATE INDEX idx_user_payment_method_mapping_payment_method_id ON user_payment_method_mapping(payment_method_id);
CREATE INDEX idx_user_payment_method_mapping_user_active ON user_payment_method_mapping(user_id, is_active);
CREATE INDEX idx_payment_methods_name ON payment_methods(name);
CREATE INDEX idx_payment_methods_is_system ON payment_methods(is_system);
