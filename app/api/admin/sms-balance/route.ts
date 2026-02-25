import { NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const SMS_BAO_QUERY_URL = 'https://api.smsbao.com/query'

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

async function getSystemSetting(key: string): Promise<string> {
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .maybeSingle()
    const v = data?.setting_value
    return typeof v === 'string' ? v : ''
  } catch {
    return ''
  }
}

function toSmsBaoPassword(value: string): string {
  const t = value.trim()
  if (/^[a-fA-F0-9]{32}$/.test(t)) return t
  return createHash('md5').update(t, 'utf8').digest('hex')
}

export async function GET() {
  try {
    const admin = await checkAdminAuth()
    if (!admin) {
      return NextResponse.json({ code: 401, msg: '未授权' }, { status: 401 })
    }

    const username =
      (process.env.SMSBAO_USERNAME as string)?.trim() || (await getSystemSetting('smsbao_username'))
    const passwordOrApikey =
      (process.env.SMSBAO_PASSWORD as string)?.trim() ||
      (await getSystemSetting('smsbao_password'))

    if (!username || !passwordOrApikey) {
      return NextResponse.json({
        code: 400,
        msg: '请先在系统设置中配置短信宝用户名和密码/ApiKey'
      })
    }

    const p = toSmsBaoPassword(passwordOrApikey)
    const url = new URL(SMS_BAO_QUERY_URL)
    url.searchParams.set('u', username)
    url.searchParams.set('p', p)

    const res = await fetch(url.toString(), { method: 'GET' })
    const text = await res.text()
    const lines = text.trim().split('\n')
    const firstLine = lines[0]?.trim() ?? ''

    if (firstLine !== '0') {
      const errMap: Record<string, string> = {
        '30': '错误密码',
        '40': '账号不存在',
        '41': '余额不足',
        '43': 'IP地址限制'
      }
      return NextResponse.json({
        code: 200,
        msg: errMap[firstLine] || firstLine,
        data: null
      })
    }

    const secondLine = lines[1]?.trim() ?? ''
    const [sent, remaining] = secondLine.split(',').map((s) => s.trim())

    return NextResponse.json({
      code: 200,
      msg: '查询成功',
      data: { sent: sent ?? '0', remaining: remaining ?? '0' }
    })
  } catch (error: any) {
    console.error('sms-balance error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '查询失败' },
      { status: 500 }
    )
  }
}
