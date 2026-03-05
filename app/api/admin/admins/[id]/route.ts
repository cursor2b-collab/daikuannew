import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getAdminFromCookie } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

// 删除管理员（Supabase Auth 用户，需 Service Role）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const id = params.id
    if (admin.id === id) {
      return NextResponse.json({ code: 400, msg: '不能删除自己' }, { status: 400 })
    }

    const { error } = await supabase.auth.admin.deleteUser(id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      code: 200,
      msg: '删除成功'
    })
  } catch (error: unknown) {
    console.error('Delete admin error:', error)
    return NextResponse.json(
      { code: 500, msg: error instanceof Error ? error.message : '删除管理员失败' },
      { status: 500 }
    )
  }
}
