import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase, md5Hash } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')
    if (!sessionCookie?.value) {
      return NextResponse.json({ code: 401, msg: '请先登录' }, { status: 401 })
    }

    const sessionData = JSON.parse(sessionCookie.value)
    const adminId = sessionData.admin_id

    const body = await request.json()
    const { old_password, new_password } = body
    if (!old_password || !new_password) {
      return NextResponse.json({ code: 400, msg: '请输入原密码和新密码' }, { status: 400 })
    }
    if (new_password.length < 6) {
      return NextResponse.json({ code: 400, msg: '新密码长度至少6位' }, { status: 400 })
    }

    const { data: admin, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, password')
      .eq('id', adminId)
      .eq('status', 1)
      .single()

    if (fetchError || !admin) {
      return NextResponse.json({ code: 401, msg: '登录已失效，请重新登录' }, { status: 401 })
    }

    const oldHash = md5Hash(old_password)
    if (admin.password !== oldHash) {
      return NextResponse.json({ code: 400, msg: '原密码错误' }, { status: 200 })
    }

    const { error: updateError } = await supabase
      .from('admin_users')
      .update({
        password: md5Hash(new_password),
        updated_at: new Date().toISOString()
      })
      .eq('id', adminId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({ code: 200, msg: '密码修改成功，请使用新密码登录' })
  } catch (error: any) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '修改失败' },
      { status: 500 }
    )
  }
}
