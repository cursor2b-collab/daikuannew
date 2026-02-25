import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

// 使用 cookies() 必须动态渲染，避免 Vercel 静态化报错
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ logged_in: false })
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (e) {
      return NextResponse.json({ logged_in: false })
    }

    if (!sessionData.admin_id) {
      return NextResponse.json({ logged_in: false })
    }

    // 验证管理员用户是否存在且有效
    const { data: admin, error } = await supabase
      .from('admin_users')
      .select('id, username, status')
      .eq('id', sessionData.admin_id)
      .eq('status', 1)
      .single()

    if (error || !admin) {
      // 清除无效会话
      cookieStore.delete('admin_session')
      return NextResponse.json({ logged_in: false })
    }

    return NextResponse.json({
      logged_in: true,
      data: {
        id: admin.id,
        username: admin.username
      }
    })
  } catch (error: any) {
    console.error('Check session error:', error)
    return NextResponse.json({ 
      logged_in: false,
      error: error?.message || 'Unknown error'
    })
  }
}
