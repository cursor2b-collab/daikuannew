-- 好享贷/催收系统 - PostgreSQL 建表脚本
-- 适用于 Supabase 或自建 PostgreSQL

-- 1. users 表（用户表）
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT,
  id_number TEXT,
  loan_number TEXT,
  bank_card TEXT,
  amount NUMERIC(12,2) DEFAULT 0,
  loan_date TIMESTAMPTZ,
  overdue_days INTEGER DEFAULT 0,
  overdue_amount NUMERIC(12,2),
  amount_due NUMERIC(12,2),
  is_settled BOOLEAN DEFAULT FALSE,
  is_interest_free BOOLEAN DEFAULT FALSE,
  voucher_images TEXT[],
  payment_method JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_loan_number ON users(loan_number);
CREATE INDEX IF NOT EXISTS idx_users_is_settled ON users(is_settled);

-- 2. system_settings 表（系统设置表）
CREATE TABLE IF NOT EXISTS system_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- 3. verification_codes 表（验证码表）
CREATE TABLE IF NOT EXISTS verification_codes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_phone ON verification_codes(phone);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires ON verification_codes(expires_at);

-- 4. admin_users 表（管理员表）
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  status INTEGER DEFAULT 1,
  login_at TIMESTAMPTZ,
  login_num INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);

-- 可选：插入默认管理员 admin / 123456（密码 MD5：e10adc3949ba59abbe56e057f20f883e）
-- INSERT INTO admin_users (username, password, status) VALUES ('admin', 'e10adc3949ba59abbe56e057f20f883e', 1)
-- ON CONFLICT (username) DO NOTHING;
