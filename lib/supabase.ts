import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjodvwgmwwgixwpyuvos.supabase.co'
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_Fy16nfH8omr46sGvBzisEg_wq3UWtuc'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// 服务端使用的 Supabase 客户端（有 SUPABASE_SERVICE_ROLE_KEY 时使用以绕过 RLS）
export const supabase = createClient(supabaseUrl, serviceRoleKey || publishableKey)

// 客户端使用的 Supabase 客户端（仅使用 publishable key）
export function createSupabaseClient() {
  return createClient(supabaseUrl, publishableKey)
}

// MD5哈希函数（用于密码验证，与数据库中的密码匹配）
export function md5Hash(input: string): string {
  return createHash('md5').update(input).digest('hex')
}
