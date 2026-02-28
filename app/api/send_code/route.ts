import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { supabase } from '@/lib/supabase'
import { verifyCaptcha } from '@/lib/captcha'

export const dynamic = 'force-dynamic'

// 短信宝发送接口：https://api.smsbao.com/sms?u={用户名}&p={密码或ApiKey}&m={手机号}&c={内容URL编码}
const SMS_BAO_SEND_URL = 'https://api.smsbao.com/sms'

const DEFAULT_SMS_TEMPLATE = '【短信宝】您的验证码是{code}，5分钟内有效。'

const SMS_BAO_ERROR: Record<string, string> = {
  '30': '错误密码',
  '40': '账号不存在',
  '41': '余额不足',
  '43': 'IP地址限制',
  '50': '内容含有敏感词',
  '51': '手机号码不正确'
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

/** 若为 32 位十六进制则视为 ApiKey，否则视为明文密码并返回 MD5 */
function toSmsBaoPassword(value: string): string {
  const t = value.trim()
  if (/^[a-fA-F0-9]{32}$/.test(t)) return t
  return createHash('md5').update(t, 'utf8').digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const phone = (formData.get('phone') as string)?.trim()
    const captchaToken = (formData.get('captcha_token') as string)?.trim()
    const captchaValue = (formData.get('captcha_value') as string) ?? ''

    if (!phone || !/^1\d{10}$/.test(phone)) {
      return NextResponse.json(
        { code: 400, msg: '请输入有效手机号' },
        { status: 400 }
      )
    }

    const captchaResult = verifyCaptcha(captchaToken, captchaValue)
    if (!captchaResult.valid) {
      return NextResponse.json(
        { code: 400, msg: captchaResult.msg || '请完成图形验证' },
        { status: 400 }
      )
    }

    const username =
      (process.env.SMSBAO_USERNAME as string)?.trim() || (await getSystemSetting('smsbao_username'))
    const passwordOrApikey =
      (process.env.SMSBAO_PASSWORD as string)?.trim() ||
      (await getSystemSetting('smsbao_password'))
    const goodsId =
      (process.env.SMSBAO_GOODS_ID as string)?.trim() ||
      (await getSystemSetting('smsbao_goods_id'))

    const code = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join('')
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 5)

    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('phone', phone)
      .limit(1)
      .maybeSingle()

    const { error: insertError } = await supabase.from('verification_codes').insert({
      phone,
      code,
      used: false,
      expires_at: expiresAt.toISOString(),
      ...(user?.id && { user_id: user.id })
    })

    if (insertError) {
      console.error('verification_codes insert error:', insertError)
      return NextResponse.json(
        { code: 500, msg: '发送失败，请重试' },
        { status: 500 }
      )
    }

    if (username && passwordOrApikey) {
      const template =
        (process.env.SMSBAO_CONTENT_TEMPLATE as string)?.trim() ||
        (await getSystemSetting('smsbao_content_template')) ||
        DEFAULT_SMS_TEMPLATE
      const content = template.replace(/\{code\}/g, code)
      const encodedContent = encodeURIComponent(content)
      const p = toSmsBaoPassword(passwordOrApikey)
      const url = new URL(SMS_BAO_SEND_URL)
      url.searchParams.set('u', username)
      url.searchParams.set('p', p)
      url.searchParams.set('m', phone)
      url.searchParams.set('c', encodedContent)
      if (goodsId) url.searchParams.set('g', goodsId)

      const res = await fetch(url.toString(), { method: 'GET' })
      const text = await res.text()
      const result = text.trim()

      if (result !== '0') {
        const msg = SMS_BAO_ERROR[result] || result || '短信发送失败'
        return NextResponse.json({ code: 500, msg }, { status: 200 })
      }
    } else {
      // 未配置短信接口：验证码已写入数据库，在响应中返回供用户填写登录
      if (process.env.NODE_ENV === 'development') {
        console.log(`[send_code] 未配置短信宝，验证码已生成: ${code}`)
      }
    }

    const sentBySms = !!(username && passwordOrApikey)
    return NextResponse.json({
      code: 200,
      msg: sentBySms ? '验证码发送成功' : '验证码已生成，请填写下方验证码登录',
      data: {
        phone,
        // 未配置短信时返回验证码，供前端展示/自动填入
        ...(!sentBySms && { code })
      }
    })
  } catch (error) {
    console.error('send_code error:', error)
    return NextResponse.json(
      { code: 500, msg: '发送失败，请重试' },
      { status: 500 }
    )
  }
}
