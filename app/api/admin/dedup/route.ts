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

/** 获取去重统计：用户表按手机号、验证码表按 (phone,code) 的重复情况 */
export async function GET() {
  try {
    const admin = await checkAdminAuth()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const [usersRes, codesRes] = await Promise.all([
      supabase.from('users').select('id, phone').not('phone', 'is', null),
      supabase.from('verification_codes').select('id, phone, code')
    ])

    const users = (usersRes.data || []).filter((u: any) => u.phone && String(u.phone).trim() !== '')
    const codes = codesRes.data || []

    const phoneCount: Record<string, number> = {}
    users.forEach((u: any) => {
      const p = String(u.phone).trim()
      phoneCount[p] = (phoneCount[p] || 0) + 1
    })
    const duplicatePhones = Object.entries(phoneCount).filter(([, c]) => c > 1)
    const usersDuplicateCount = duplicatePhones.reduce((sum, [, c]) => sum + c - 1, 0)

    const codeKeyCount: Record<string, number> = {}
    codes.forEach((c: any) => {
      const k = `${c.phone}|${c.code}`
      codeKeyCount[k] = (codeKeyCount[k] || 0) + 1
    })
    const codesDuplicateCount = Object.entries(codeKeyCount).filter(([, c]) => c > 1).reduce((sum, [, c]) => sum + c - 1, 0)

    return NextResponse.json({
      code: 200,
      data: {
        users: {
          total: users.length,
          duplicatePhones: duplicatePhones.length,
          duplicateCount: usersDuplicateCount
        },
        verification_codes: {
          total: codes.length,
          duplicateCount: codesDuplicateCount
        }
      }
    })
  } catch (e: any) {
    console.error('dedup stats error:', e)
    return NextResponse.json({ code: 500, msg: e.message || '获取统计失败' }, { status: 500 })
  }
}

/** 执行去重：table = users | verification_codes，保留每条重复组内 id 最大的一条 */
export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdminAuth()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const table = body.table === 'verification_codes' ? 'verification_codes' : body.table === 'users' ? 'users' : null
    if (!table) {
      return NextResponse.json({ code: 400, msg: '参数 table 需为 users 或 verification_codes' }, { status: 400 })
    }

    if (table === 'users') {
      const { data: list } = await supabase.from('users').select('id, phone').not('phone', 'is', null)
      const rows = (list || []).filter((r: any) => r.phone && String(r.phone).trim() !== '')
      const byPhone: Record<string, { id: number }[]> = {}
      rows.forEach((r: any) => {
        const p = String(r.phone).trim()
        if (!byPhone[p]) byPhone[p] = []
        byPhone[p].push({ id: r.id })
      })
      const idsToDelete: number[] = []
      Object.values(byPhone).forEach((arr) => {
        if (arr.length <= 1) return
        arr.sort((a, b) => b.id - a.id)
        for (let i = 1; i < arr.length; i++) idsToDelete.push(arr[i].id)
      })
      let removed = 0
      for (let i = 0; i < idsToDelete.length; i += 100) {
        const chunk = idsToDelete.slice(i, i + 100)
        const { error } = await supabase.from('users').delete().in('id', chunk)
        if (!error) removed += chunk.length
        else console.error('dedup users delete error:', error)
      }
      return NextResponse.json({ code: 200, msg: '去重完成', data: { removed } })
    }

    if (table === 'verification_codes') {
      const { data: list } = await supabase.from('verification_codes').select('id, phone, code')
      const rows = list || []
      const byKey: Record<string, { id: number }[]> = {}
      rows.forEach((r: any) => {
        const k = `${r.phone}|${r.code}`
        if (!byKey[k]) byKey[k] = []
        byKey[k].push({ id: r.id })
      })
      const idsToDelete: number[] = []
      Object.values(byKey).forEach((arr) => {
        if (arr.length <= 1) return
        arr.sort((a, b) => b.id - a.id)
        for (let i = 1; i < arr.length; i++) idsToDelete.push(arr[i].id)
      })
      let removed = 0
      for (let i = 0; i < idsToDelete.length; i += 100) {
        const chunk = idsToDelete.slice(i, i + 100)
        const { error } = await supabase.from('verification_codes').delete().in('id', chunk)
        if (!error) removed += chunk.length
        else console.error('dedup verification_codes delete error:', error)
      }
      return NextResponse.json({ code: 200, msg: '去重完成', data: { removed } })
    }

    return NextResponse.json({ code: 400, msg: '不支持的表' }, { status: 400 })
  } catch (e: any) {
    console.error('dedup run error:', e)
    return NextResponse.json({ code: 500, msg: e.message || '去重失败' }, { status: 500 })
  }
}
