import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

async function checkAdminAuth() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('admin_session')
  
  if (!sessionCookie?.value) {
    return null
  }

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

// 获取系统设置
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminAuth()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const key = searchParams.get('key')

    if (key) {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('setting_key', key)
        .maybeSingle()
      if (error) throw error
      return NextResponse.json({
        code: 200,
        msg: '获取成功',
        data
      })
    }

    const { data, error } = await supabase.from('system_settings').select('*')
    if (error) throw error
    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: { list: data || [] }
    })
  } catch (error: any) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '获取设置失败' },
      { status: 500 }
    )
  }
}

// 更新系统设置
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminAuth()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ code: 400, msg: '缺少设置键' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('system_settings')
      .upsert({
        setting_key: key,
        setting_value: value,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'setting_key'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({
      code: 200,
      msg: '更新成功',
      data
    })
  } catch (error: any) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '更新设置失败' },
      { status: 500 }
    )
  }
}
