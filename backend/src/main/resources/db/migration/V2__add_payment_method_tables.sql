-- 결제수단 관리 기능 추가
-- V2__add_payment_method_tables.sql

-- 1. 시스템 기본 결제수단 템플릿 테이블 생성
CREATE TABLE IF NOT EXISTS payment_method_templates (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 기본 결제수단 데이터 삽입
INSERT INTO payment_method_templates (name, sort_order) VALUES
    ('신용카드', 1),
    ('체크카드', 2),
    ('현금', 3),
    ('계좌이체', 4)
ON CONFLICT (name) DO NOTHING;

-- 2. 사용자별 결제수단 테이블 생성
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_payment_methods_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_id ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user_active ON user_payment_methods(user_id, is_active);

-- 3. 기존 사용자들을 위한 기본 결제수단 자동 생성
-- 각 사용자마다 템플릿을 복사하여 개인 결제수단 목록 생성
INSERT INTO user_payment_methods (user_id, name, sort_order)
SELECT
    u.id,
    pmt.name,
    pmt.sort_order
FROM users u
CROSS JOIN payment_method_templates pmt
WHERE u.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- 4. 기존 transactions 테이블에 존재하는 커스텀 결제수단 추출 및 추가
-- 사용자별로 고유한 결제수단을 찾아서 user_payment_methods에 추가
INSERT INTO user_payment_methods (user_id, name, is_active, sort_order)
SELECT DISTINCT
    t.user_id,
    t.payment_method,
    TRUE,
    999 -- 커스텀 결제수단은 마지막에 정렬
FROM transactions t
WHERE t.deleted_at IS NULL
  AND t.payment_method IS NOT NULL
  AND t.payment_method != ''
  -- 이미 추가된 결제수단은 제외
  AND NOT EXISTS (
      SELECT 1
      FROM user_payment_methods upm
      WHERE upm.user_id = t.user_id
        AND upm.name = t.payment_method
  )
ON CONFLICT DO NOTHING;

-- 5. transactions 테이블에 새로운 payment_method_id 컬럼 추가
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method_id BIGINT;

-- 6. 기존 데이터 마이그레이션: payment_method 문자열을 payment_method_id로 매핑
UPDATE transactions t
SET payment_method_id = upm.id
FROM user_payment_methods upm
WHERE t.user_id = upm.user_id
  AND t.payment_method = upm.name
  AND t.deleted_at IS NULL
  AND t.payment_method_id IS NULL;

-- 7. FK 제약조건 추가 (마이그레이션 완료 후)
ALTER TABLE transactions
ADD CONSTRAINT fk_transactions_payment_method
FOREIGN KEY (payment_method_id)
REFERENCES user_payment_methods(id)
ON DELETE RESTRICT;

-- 8. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_transactions_payment_method_id ON transactions(payment_method_id);

-- 9. 기존 payment_method 컬럼 삭제
ALTER TABLE transactions DROP COLUMN IF EXISTS payment_method;