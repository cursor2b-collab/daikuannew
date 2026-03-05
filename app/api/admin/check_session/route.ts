import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('admin_session')

    if (!sessionCookie?.value) {
      return NextResponse.json({ logged_in: false })
    }

    let sessionData: { access_token?: string; refresh_token?: string }
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch {
      return NextResponse.json({ logged_in: false })
    }

    const accessToken = sessionData.access_token
    if (!accessToken) {
      return NextResponse.json({ logged_in: false })
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      const refreshToken = sessionData.refresh_token
      if (refreshToken) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({ refresh_token: refreshToken })
        if (!refreshError && refreshData?.session) {
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
          return NextResponse.json({
            logged_in: true,
            data: {
              id: refreshData.user.id,
              email: refreshData.user.email
            }
          })
        }
      }
      cookieStore.delete('admin_session')
      return NextResponse.json({ logged_in: false })
    }

    return NextResponse.json({
      logged_in: true,
      data: {
        id: user.id,
        email: user.email
      }
    })
  } catch (error: unknown) {
    console.error('Check session error:', error)
    return NextResponse.json({
      logged_in: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
