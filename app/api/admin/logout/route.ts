import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')

    return NextResponse.json({
      code: 200,
      msg: '退出成功'
    })
  } catch (error) {
    return NextResponse.json(
      { code: 500, msg: '退出失败' },
      { status: 500 }
    )
  }
}
