import { NextResponse } from 'next/server'
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
      .from('admin_users').select('id, username, status')
      .eq('id', sessionData.admin_id).eq('status', 1).single()
    return admin
  } catch { return null }
}

export async function GET() {
  try {
    const admin = await checkAdminAuth()
    if (!admin) return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })

    const [usersRes, settledRes, overdueRes, codesRes] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_settled', true),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('is_settled', false).gt('overdue_days', 0),
      supabase.from('verification_codes').select('id', { count: 'exact', head: true }).eq('used', false).gt('expires_at', new Date().toISOString()),
    ])

    // 待审核凭证（有 voucher_images 的未结清用户）
    const { data: voucherUsers } = await supabase
      .from('users').select('voucher_images').eq('is_settled', false).not('voucher_images', 'is', null)
    const pendingVouchers = (voucherUsers || []).filter((u: any) => Array.isArray(u.voucher_images) && u.voucher_images.length > 0).length

    // 最近 5 个用户
    const { data: recentUsers } = await supabase
      .from('users').select('id, name, phone, amount, overdue_days, is_settled, created_at')
      .order('created_at', { ascending: false }).limit(5)

    return NextResponse.json({
      code: 200,
      data: {
        totalUsers: usersRes.count ?? 0,
        settledUsers: settledRes.count ?? 0,
        overdueUsers: overdueRes.count ?? 0,
        pendingVouchers,
        activeCodes: codesRes.count ?? 0,
        recentUsers: recentUsers || [],
      }
    })
  } catch (e: any) {
    return NextResponse.json({ code: 500, msg: e.message || '获取失败' }, { status: 500 })
  }
}
