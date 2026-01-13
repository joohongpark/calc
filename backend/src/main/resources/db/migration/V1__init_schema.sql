-- 초기 스키마 생성
-- V1__init_schema.sql

-- users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- username 인덱스
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
-- email 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- soft delete를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- transactions 테이블 생성
CREATE TABLE IF NOT EXISTS transactions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE')),
    amount NUMERIC(15, 2) NOT NULL,
    description VARCHAR(255) NOT NULL,
    payment_method VARCHAR(100) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    original_amount NUMERIC(15, 2),
    discount_rate NUMERIC(5, 2),
    exchange_rate NUMERIC(10, 4),
    tags TEXT,
    transaction_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT fk_transactions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- user_id 인덱스 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
-- transaction_date 인덱스 (날짜별 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
-- type 인덱스 (수입/지출 필터링)
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
-- soft delete를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_transactions_deleted_at ON transactions(deleted_at);
-- 복합 인덱스: 사용자별 날짜 조회 최적화
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date);
