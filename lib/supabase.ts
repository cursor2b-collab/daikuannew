import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjodvwgmwwgixwpyuvos.supabase.co'
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_Fy16nfH8omr46sGvBzisEg_wq3UWtuc'
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
