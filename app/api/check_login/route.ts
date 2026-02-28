import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// 发送 Telegram 群组通知（用户登录时）
async function sendTelegramLoginNotify(
  botToken: string,
  chatId: string,
  payload: { name: string; phone: string; debtAmount: string; overdueDays: number }
) {
  const text = [
    '🔔 用户登录通知',
    '',
    `👤 登录用户姓名：${payload.name}`,
    `📱 登录手机号：${payload.phone}`,
    `💰 欠款金额：${payload.debtAmount} 元`,
    `📅 逾期天数：${payload.overdueDays} 天`
  ].join('\n')

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text })
  })
  if (res.ok) {
    console.log('[check_login] Telegram 登录通知已发送')
  } else {
    const err = await res.text()
    console.error('[check_login] Telegram 发送失败:', res.status, err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const phone = formData.get('phone') as string
    const code = formData.get('code') as string

    if (!phone || !/^1\d{10}$/.test(phone)) {
      return NextResponse.json(
        { code: 400, msg: '请输入有效的11位手机号' },
        { status: 400 }
      )
    }

    if (!code || !/^\d{4,6}$/.test(code)) {
      return NextResponse.json(
        { code: 400, msg: '请输入有效验证码' },
        { status: 400 }
      )
    }

    // 规范化手机号（去除空格）
    const normalizedPhone = phone.trim()

    // 从数据库验证验证码
    const { data: verificationCodes, error: codeError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone', normalizedPhone)
      .eq('code', code.trim())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    // 如果查询出错，记录错误信息
    if (codeError) {
      console.error('验证码查询错误:', codeError)
    }

    // 开发环境允许使用固定验证码 '1234' 或 '123456' 作为备用
    const isDevCode = process.env.NODE_ENV === 'development' && (code === '1234' || code === '123456')

    const verificationCode = verificationCodes && verificationCodes.length > 0 ? verificationCodes[0] : null

    if (!verificationCode && !isDevCode) {
      return NextResponse.json(
        { code: 400, msg: '验证码错误或已过期' },
        { status: 400 }
      )
    }

    // 如果找到了验证码，标记为已使用
    if (verificationCode) {
      await supabase
        .from('verification_codes')
        .update({ used: true })
        .eq('id', verificationCode.id)
    }

    // 从数据库获取用户信息（含欠款、逾期字段，用于 Telegram 通知）
    const userFields = 'id, name, phone, amount, amount_due, overdue_amount, overdue_days'
    let userData: any = {
      user_id: Date.now().toString(),
      phone,
      name: '用户',
      login_time: new Date().toISOString()
    }

    let debtAmount = '0.00'
    let overdueDays = 0

    // 尝试从users表获取用户信息
    if (verificationCode?.user_id) {
      const { data: user } = await supabase
        .from('users')
        .select(userFields)
        .eq('id', verificationCode.user_id)
        .single()

      if (user) {
        userData = {
          user_id: user.id.toString(),
          phone: user.phone || phone,
          name: user.name || '用户',
          login_time: new Date().toISOString()
        }
        const due = parseFloat(String(user.amount_due ?? user.overdue_amount ?? user.amount ?? 0))
        debtAmount = (Number.isNaN(due) ? 0 : due).toFixed(2)
        overdueDays = Number(user.overdue_days) || 0
      }
    } else {
      // 如果没有user_id，尝试通过手机号查找用户
      const { data: users } = await supabase
        .from('users')
        .select(userFields)
        .eq('phone', phone)
        .limit(1)

      if (users && users.length > 0) {
        const user = users[0]
        userData = {
          user_id: user.id.toString(),
          phone: user.phone || phone,
          name: user.name || '用户',
          login_time: new Date().toISOString()
        }
        const due = parseFloat(String(user.amount_due ?? user.overdue_amount ?? user.amount ?? 0))
        debtAmount = (Number.isNaN(due) ? 0 : due).toFixed(2)
        overdueDays = Number(user.overdue_days) || 0
      }
    }

    // 设置 cookie（实际应该使用 JWT 或 session）
    const cookieStore = await cookies()
    cookieStore.set('user_session', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7天
    })

    // Telegram 群组通知（不阻塞登录，失败仅打日志）
    const botToken =
      (process.env.TELEGRAM_BOT_TOKEN as string)?.trim() ||
      (await getSystemSetting('telegram_bot_token'))
    const chatId =
      (process.env.TELEGRAM_CHAT_ID as string)?.trim() ||
      (await getSystemSetting('telegram_chat_id'))
    if (botToken && chatId) {
      console.log('[check_login] 正在发送 Telegram 登录通知')
      sendTelegramLoginNotify(botToken, chatId, {
        name: userData.name,
        phone: userData.phone,
        debtAmount,
        overdueDays
      }).catch((e) => console.error('[check_login] Telegram 通知异常:', e))
    } else {
      console.log('[check_login] Telegram 未发送: 未配置 Bot Token 或 Chat ID（请在管理后台或环境变量中配置）')
    }

    return NextResponse.json({
      code: 200,
      msg: '登录成功',
      data: userData
    })
  } catch (error) {
    return NextResponse.json(
      { code: 500, msg: '登录失败，请重试' },
      { status: 500 }
    )
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

