import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAdminFromCookie } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '请先登录' }, { status: 401 })
    }
    const body = await request.json()
    const { old_password, new_password } = body
    if (!old_password || !new_password) {
      return NextResponse.json({ code: 400, msg: '请输入原密码和新密码' }, { status: 400 })
    }
    if (new_password.length < 6) {
      return NextResponse.json({ code: 400, msg: '新密码长度至少6位' }, { status: 400 })
    }

    const email = admin.email
    if (!email) {
      return NextResponse.json({ code: 400, msg: '当前账号无邮箱，无法在此修改密码' }, { status: 400 })
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: old_password
    })
    if (signInError) {
      return NextResponse.json({ code: 400, msg: '原密码错误' })
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(admin.id, {
      password: new_password
    })
    if (updateError) {
      console.error('Update password error:', updateError)
      return NextResponse.json(
        { code: 500, msg: updateError.message || '修改失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ code: 200, msg: '密码修改成功，请使用新密码重新登录' })
  } catch (error: unknown) {
    console.error('Change password error:', error)
    return NextResponse.json(
      { code: 500, msg: error instanceof Error ? error.message : '修改失败' },
      { status: 500 }
    )
  }
}
