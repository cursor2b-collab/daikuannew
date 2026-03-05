-- 客户管理新增字段：性别、贷款期数
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS loan_term INTEGER;
