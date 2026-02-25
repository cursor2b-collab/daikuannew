import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const session = cookieStore.get('user_session')

    if (!session) {
      return NextResponse.json({
        logged_in: false
      })
    }

    try {
      const userData = JSON.parse(session.value)
      return NextResponse.json({
        logged_in: true,
        data: userData
      })
    } catch (e) {
      return NextResponse.json({
        logged_in: false
      })
    }
  } catch (error) {
    return NextResponse.json({
      logged_in: false
    })
  }
}

