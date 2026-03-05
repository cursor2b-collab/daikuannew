'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendVerificationCode, submitLogin, syncLoginWithServer, loadPageData } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pageData, setPageData] = useState<any>({})
  const [appTitle, setAppTitle] = useState('分期付')
  const [captchaToken, setCaptchaToken] = useState('')
  const [captchaSvg, setCaptchaSvg] = useState('')
  const [captchaValue, setCaptchaValue] = useState('')
  const [captchaLoading, setCaptchaLoading] = useState(false)

  useEffect(() => {
    // 检查登录状态
    syncLoginWithServer().then((loggedIn) => {
      if (loggedIn) {
        router.push('/user')
        return
      }
      // 未登录，加载页面数据
      loadPageData('login').then((data) => {
        setPageData(data)
        // 设置验证码输入框的 placeholder
        if (data && data.code_placeholder) {
          // placeholder 会在渲染时设置
        }
      }).catch(() => {
        // 加载失败不影响页面显示
      })
    }).catch(() => {
      // 检查失败不影响页面显示
    })

    // 加载网站名称
    fetch('/api/get_site_config')
      .then(res => res.json())
      .then(data => {
        if (data && data.code === 200 && data.data) {
          setAppTitle(data.data.site_name || '分期付')
        }
      })
      .catch(() => {
        setAppTitle('分期付')
      })
  }, [router])

  const loadCaptcha = useCallback(async () => {
    setCaptchaLoading(true)
    setCaptchaValue('')
    try {
      const res = await fetch('/api/captcha')
      const data = await res.json()
      if (data.token && data.svg) {
        setCaptchaToken(data.token)
        setCaptchaSvg(data.svg)
      }
    } catch (e) {
      console.error('加载图形验证码失败', e)
    } finally {
      setCaptchaLoading(false)
    }
  }, [])

  useEffect(() => {
    loadCaptcha()
  }, [loadCaptcha])

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D+/g, '').slice(0, 11)
    setPhone(value)
  }

  const handleSendCode = async () => {
    if (!/^1\d{10}$/.test(phone)) {
      alert('请输入有效手机号')
      return
    }
    if (!captchaToken || !captchaValue.trim()) {
      alert('请先输入图形验证码')
      return
    }

    setLoading(true)
    try {
      const result = await sendVerificationCode(phone, captchaToken, captchaValue.trim())
      if (result.code === 200) {
        const smsNotConfigured = result.data?.code != null
        if (smsNotConfigured) {
          // 未配置短信接口：自动填入验证码并提示
          setCode(String(result.data.code))
          alert('已验证本机，已填入验证码，请点立即登录')
          loadCaptcha()
        } else {
          alert('验证码发送成功')
          loadCaptcha()
          setCountdown(60)
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer)
                return 0
              }
              return prev - 1
            })
          }, 1000)
        }
      } else {
        alert(result.msg || '发送失败')
        loadCaptcha()
      }
    } catch (error) {
      alert('发送失败，请重试')
      loadCaptcha()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!/^1\d{10}$/.test(phone)) {
      alert('请输入有效的11位手机号')
      return
    }

    if (!/^\d{4,6}$/.test(code)) {
      alert('请输入有效验证码')
      return
    }

    setLoading(true)
    try {
      const result = await submitLogin(phone, code)
      if (result.code === 200) {
        // 保存用户信息到 localStorage
        localStorage.setItem('userInfo', JSON.stringify(result.data))
        alert('登录成功')
        setTimeout(() => {
          router.push('/user')
        }, 1000)
      } else {
        alert(result.msg || '登录失败')
      }
    } catch (error) {
      alert('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="login-header">
        <Link href="/" className="back layui-icon layui-icon-left"></Link>
        <h1 className="app-title" id="app_title">{appTitle}</h1>
        <div className="tab-bar">
          <div className="tab-item active" id="login_tab">
            登录
            <span className="tab-indicator"></span>
          </div>
        </div>
      </div>

      <div className="login-form">
        <div className="form-card">
          <div className="form-box">
            <i className="layui-icon layui-icon-cellphone"></i>
            <input
              id="phoneInput"
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              name="phone"
              placeholder="输入你的手机号"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={11}
            />
          </div>

          <div className="form-box" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: '0 0 auto', width: '120px', height: '44px', overflow: 'hidden', borderRadius: '4px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {captchaLoading ? (
                <span style={{ fontSize: '12px', color: '#999' }}>加载中...</span>
              ) : captchaSvg ? (
                <img
                  src={`data:image/svg+xml;base64,${typeof btoa !== 'undefined' ? btoa(unescape(encodeURIComponent(captchaSvg))) : ''}`}
                  alt="图形验证码"
                  style={{ width: '120px', height: '44px', display: 'block', cursor: 'pointer' }}
                  onClick={loadCaptcha}
                  title="点击刷新"
                />
              ) : null}
            </div>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="请输入图形验证码"
              value={captchaValue}
              onChange={(e) => setCaptchaValue(e.target.value.replace(/\D+/g, '').slice(0, 4))}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                fontSize: '16px'
              }}
            />
            <button
              type="button"
              onClick={loadCaptcha}
              disabled={captchaLoading}
              style={{
                padding: '8px 12px',
                fontSize: '12px',
                color: '#667eea',
                background: 'transparent',
                border: '1px solid #667eea',
                borderRadius: '4px',
                cursor: captchaLoading ? 'not-allowed' : 'pointer'
              }}
            >
              刷新
            </button>
          </div>

          <div className="code-row">
            <div className="form-box">
              <i className="layui-icon layui-icon-password"></i>
              <input
                type="text"
                name="code"
                placeholder={pageData.code_placeholder || '请输入验证码'}
                minLength={4}
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]{4,6}"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D+/g, '').slice(0, 6))}
              />
            </div>
            <button
              className="get-code"
              id="get_code_btn"
              onClick={handleSendCode}
              disabled={countdown > 0 || loading || pageData.login_auth_type === '2'}
              title={pageData.login_auth_type === '2' ? '催收员工号模式不支持短信验证码，请使用通用验证码' : ''}
            >
              {countdown > 0 ? `${countdown} 秒后重试` : (pageData.get_code_btn || '获取验证码')}
            </button>
          </div>

          <button className="login-btn" id="login_btn" onClick={handleSubmit} disabled={loading}>
            {loading ? '登录中...' : '立即登录'}
          </button>
        </div>

        <div className="skip-link">
          <Link href="/">跳过，返回首页</Link>
        </div>
      </div>

      {/* 底部风险提示 - 已隐藏 */}
      {/* <div className="risk-notice">
        <div className="risk-content">
          <div className="risk-text">
            <strong>风险提示：</strong> 本站仅作信息展示，不提供任何借贷服务。借款请通过持牌机构。
          </div>
          <div className="company-info">
            公司：分期付网络贷款有限公司 | 电话：400-888-8888 | ICP：京ICP备2024000000号
          </div>
        </div>
      </div> */}
    </>
  )
}
