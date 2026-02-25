import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjodvwgmwwgixwpyuvos.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_Fy16nfH8omr46sGvBzisEg_wq3UWtuc'

// 服务端使用的Supabase客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 客户端使用的Supabase客户端
export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

// MD5哈希函数（用于密码验证，与数据库中的密码匹配）
export function md5Hash(input: string): string {
  return createHash('md5').update(input).digest('hex')
}
