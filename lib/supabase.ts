import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hywtoijblgfgivmwicmj.supabase.co'
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5d3RvaWpibGdmZ2l2bXdpY21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NzQ2NzQsImV4cCI6MjA4ODQ1MDY3NH0.UOtmslmjDzXFgIU_n5zlCihf0tjRxUPME1sq35hDcmQ'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 服务端使用的 Supabase 客户端。生产环境务必配置 SUPABASE_SERVICE_ROLE_KEY，否则 RLS 会拦截写表导致 500。
export const supabase = createClient(supabaseUrl, serviceRoleKey || publishableKey)

/** 是否已配置 Service Role（未配置时 POST /api/admin/users、generate_codes 等会因 RLS 报 500） */
export function hasServiceRoleKey(): boolean {
  return Boolean(serviceRoleKey)
}

// 客户端使用的 Supabase 客户端（仅使用 publishable key）
export function createSupabaseClient() {
  return createClient(supabaseUrl, publishableKey)
}

// MD5哈希函数（用于密码验证，与数据库中的密码匹配）
export function md5Hash(input: string): string {
  return createHash('md5').update(input).digest('hex')
}
