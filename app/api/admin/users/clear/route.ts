import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')
  if (!sessionCookie?.value) return null
  try {
    const sessionData = JSON.parse(sessionCookie.value)
    const { data: admin } = await supabase
      .from('admin_users')
      .select('id, username, status')
      .eq('id', sessionData.admin_id)
      .eq('status', 1)
      .single()
    return admin
  } catch {
    return null
  }
}

/** 一键清空：先删验证码，再删全部客户 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const chunk = 500

    // 1. 先删验证码（避免外键）
    let codeIds: number[] = []
    let from = 0
    do {
      const { data } = await supabase
        .from('verification_codes')
        .select('id')
        .order('id', { ascending: true })
        .range(from, from + chunk - 1)
      const list = (data || []).map((r: { id: number }) => r.id)
      codeIds = codeIds.concat(list)
      if (list.length < chunk) break
      from += chunk
    } while (true)

    for (let i = 0; i < codeIds.length; i += chunk) {
      await supabase.from('verification_codes').delete().in('id', codeIds.slice(i, i + chunk))
    }

    // 2. 再删全部客户
    let userIds: number[] = []
    from = 0
    do {
      const { data } = await supabase
        .from('users')
        .select('id')
        .order('id', { ascending: true })
        .range(from, from + chunk - 1)
      const list = (data || []).map((r: { id: number }) => r.id)
      userIds = userIds.concat(list)
      if (list.length < chunk) break
      from += chunk
    } while (true)

    for (let i = 0; i < userIds.length; i += chunk) {
      await supabase.from('users').delete().in('id', userIds.slice(i, i + chunk))
    }

    return NextResponse.json({
      code: 200,
      msg: '清空成功',
      data: { deletedUsers: userIds.length, deletedCodes: codeIds.length }
    })
  } catch (error: any) {
    console.error('Clear users error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '清空失败' },
      { status: 500 }
    )
  }
}
