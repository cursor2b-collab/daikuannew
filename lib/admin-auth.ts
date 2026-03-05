import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export type AdminUser = { id: string; email: string | undefined }

/**
 * 从 cookie 解析管理后台登录态（Supabase Auth JWT），返回当前管理员或 null。
 * 若 access_token 过期会尝试用 refresh_token 刷新并写回 cookie。
 */
export async function getAdminFromCookie(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')
  if (!sessionCookie?.value) return null

  let sessionData: { access_token?: string; refresh_token?: string }
  try {
    sessionData = JSON.parse(sessionCookie.value)
  } catch {
    return null
  }
  const accessToken = sessionData.access_token
  if (!accessToken) return null

  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (!error && user) {
    return { id: user.id, email: user.email }
  }

  const refreshToken = sessionData.refresh_token
  if (refreshToken) {
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
    if (!refreshError && refreshData?.session?.user) {
      const payload = {
        access_token: refreshData.session.access_token,
        refresh_token: refreshData.session.refresh_token ?? '',
        expires_at: refreshData.session.expires_at
      }
      cookieStore.set('admin_session', JSON.stringify(payload), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      })
      return { id: refreshData.user.id, email: refreshData.user.email }
    }
  }
  return null
}
