import { createHmac } from 'crypto'

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || 'daikuan-captcha-secret-change-in-production'

function base64UrlDecode(str: string): Buffer {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4
  if (pad) b64 += '='.repeat(4 - pad)
  return Buffer.from(b64, 'base64')
}

function sign(payload: string): string {
  return createHmac('sha256', CAPTCHA_SECRET).update(payload).digest('hex')
}

/**
 * 校验图形验证码 token 与用户输入是否一致
 * @returns { valid: boolean, msg?: string }
 */
export function verifyCaptcha(token: string, userInput: string): { valid: boolean; msg?: string } {
  if (!token || typeof userInput !== 'string') {
    return { valid: false, msg: '请完成图形验证' }
  }
  const trimmed = userInput.trim()
  if (!trimmed) {
    return { valid: false, msg: '请输入图形验证码' }
  }
  const parts = token.split('.')
  if (parts.length !== 2) {
    return { valid: false, msg: '验证码无效，请刷新重试' }
  }
  try {
    const payloadB64 = parts[0]
    const sig = parts[1]
    if (sign(payloadB64) !== sig) {
      return { valid: false, msg: '验证码无效，请刷新重试' }
    }
    const json = base64UrlDecode(payloadB64).toString('utf8')
    const { code, exp } = JSON.parse(json)
    if (Date.now() > exp) {
      return { valid: false, msg: '验证码已过期，请刷新重试' }
    }
    if (String(code) !== trimmed) {
      return { valid: false, msg: '图形验证码错误' }
    }
    return { valid: true }
  } catch {
    return { valid: false, msg: '验证码无效，请刷新重试' }
  }
}
