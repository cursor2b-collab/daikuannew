-- 客户管理新增字段：到期时间、违约金、利息
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS penalty_fee NUMERIC(14,2),
  ADD COLUMN IF NOT EXISTS interest NUMERIC(14,2);
