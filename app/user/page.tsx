'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { checkLoginStatus, syncLoginWithServer, loadPageData, getCurrentUser } from '@/lib/api'
import FooterNav from '@/components/FooterNav'

export default function UserPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pageData, setPageData] = useState<any>({})
  const [marqueeText, setMarqueeText] = useState('加载中...')
  const [isRepaid, setIsRepaid] = useState(false)
  const [isFreeInterest, setIsFreeInterest] = useState(false)
  const [overdueDays, setOverdueDays] = useState<number>(0)
  const [totalDebt, setTotalDebt] = useState<string>('0.00')

  // 设置 body 类名
  useEffect(() => {
    document.body.classList.add('user-page')
    return () => {
      document.body.classList.remove('user-page')
    }
  }, [])

  useEffect(() => {
    // 检查登录状态
    const userInfo = getCurrentUser()
    if (!userInfo || !userInfo.phone) {
      syncLoginWithServer().then((loggedIn) => {
        if (!loggedIn) {
          router.push('/login')
          return
        }
        loadUserData()
      }).catch(() => {
        router.push('/login')
      })
    } else {
      loadUserData()
    }

    // 初始化滚动消息轮播
    const messages = [
      '07-07 用户尾号4826 成功申请服务 78800元',
      '07-08 用户尾号1234 成功申请服务 50000元',
      '07-09 用户尾号5678 成功申请服务 30000元',
      '07-10 用户尾号9012 成功申请服务 66000元',
      '07-11 用户尾号3456 成功申请服务 45000元',
      '07-12 用户尾号7890 成功申请服务 88000元'
    ]
    
    let index = 0
    const updateMarquee = () => {
      setMarqueeText(messages[index])
      index = (index + 1) % messages.length
    }
    
    updateMarquee()
    const interval = setInterval(updateMarquee, 3000)
    
    return () => clearInterval(interval)
  }, [router])

  const loadUserData = async () => {
    const userInfo = getCurrentUser()
    const userId = (userInfo as any)?.id ?? (userInfo as any)?.user_id
    if (!userInfo?.phone && !userId) {
      router.push('/login')
      return
    }

    try {
      const query = userId ? `userId=${userId}` : `phone=${encodeURIComponent(userInfo!.phone)}`
      const userDataResponse = await fetch(`/api/get_user_data?${query}`, { cache: 'no-store' })
      const userDataResult = await userDataResponse.json()

      const data = await loadPageData('user', userInfo?.phone || '')

      if (userDataResult.code === 200 && userDataResult.data) {
        const userData = userDataResult.data
        if (userData.name) data.user_name = userData.name
        const days = Number(userData.overdueDays) || 0
        const debt = userData.totalRepayment != null ? String(userData.totalRepayment) : (userData.amount_due != null ? String(userData.amount_due) : '0.00')
        setOverdueDays(days)
        setTotalDebt(debt)
        data.amount_value = `${parseFloat(debt).toFixed(2)}元`
        setIsRepaid(userData.is_settled || false)
        setIsFreeInterest(userData.is_interest_free || false)
      } else {
        setOverdueDays(0)
        setTotalDebt('0.00')
        try {
          const repaymentData = await loadPageData('repayment', userInfo?.phone || '')
          setIsRepaid(String(repaymentData?.is_repaid || '0') === '1')
          setIsFreeInterest(String(repaymentData?.is_free_interest || '0') === '1')
        } catch (_) {}
      }

      setPageData(data)
      setLoading(false)
    } catch (error) {
      console.error('加载数据失败:', error)
      setLoading(false)
    }
  }


  const showTip = (message: string) => {
    const tip = document.createElement('div')
    tip.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 9999;
      font-size: 14px;
    `
    tip.textContent = message
    document.body.appendChild(tip)
    
    setTimeout(() => {
      if (document.body.contains(tip)) {
        document.body.removeChild(tip)
      }
    }, 2000)
  }

  const openSettlementService = async () => {
    try {
      const response = await fetch('/api/get_site_config')
      const data = await response.json()
      
      if (data && data.code === 200 && data.data) {
        const configs = data.data
        const ua = navigator.userAgent || navigator.vendor || ''
        const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
        const link = isIOS ? (configs.ios_link || '') : (configs.android_link || '')
        
        if (link && link.trim() !== '') {
          window.open(link, '_blank')
        } else {
          alert('会议链接未配置，请联系在线客服')
        }
      }
    } catch (error) {
      alert('获取会议链接失败，请稍后重试')
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>加载中...</div>
      </div>
    )
  }

  const userInfo = getCurrentUser()
  const statusText = isRepaid ? '已结清' : isFreeInterest ? '免息用户' : (overdueDays > 0 ? `您已经逾期 ${overdueDays}天` : '您已经逾期')
  const repayBtnText = isRepaid ? '结清证明' : isFreeInterest ? '免息还款' : '立即还款'
  const debtDisplay = totalDebt ? `${parseFloat(totalDebt).toFixed(2)}元` : (pageData?.amount_value || '0元')

  const displayName = pageData?.user_name || userInfo?.name || userInfo?.phone || '用户'

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>加载中...</div>
      </div>
    )
  }

  return (
    <>
      <div className="top-notice">
        <div className="top-notice-title" id="welcome_text">
          {pageData.welcome_text || '欢迎'}
        </div>
        <div className="top-notice-subtitle" id="subtitle">
          {pageData.subtitle || '加载中...'}
        </div>
      </div>

      <div className={`user-header ${isRepaid ? 'repaid' : ''}`}>
        <h2 id="user_name">{displayName} 先生/女士</h2>
        <p id="status_text">{statusText}</p>
        <p>
          <span id="amount_label">{pageData.amount_label || '总计欠款'}</span>{' '}
          <strong id="amount_value">{debtDisplay}</strong>
        </p>
        <Link href="/repayment">
          <button className="repay-btn" id="repay_btn">
            {repayBtnText}
          </button>
        </Link>
        <p style={{ fontSize: '12px', marginTop: '8px', color: '#fff' }}>理性消费 合理规划</p>
      </div>

      <div className="marquee">
        <i className="layui-icon layui-icon-speaker"></i>
        <span id="marquee_text">{marqueeText}</span>
      </div>

      <div className="menu-grid">
        <div className="menu-item" onClick={() => showTip('你已有服务订单，请勿重复申请')}>
          <img src="/resources/images/apply-loan.webp" alt="申请服务" />
          <div className="label" id="menu1_text">{pageData.menu1_text || '申请服务'}</div>
        </div>
        <div className="menu-item" onClick={() => router.push('/repayment')}>
          <img src="/resources/images/my-loan.webp" alt="我的服务" />
          <div className="label" id="menu2_text">{pageData.menu2_text || '我的服务'}</div>
        </div>
        <div className="menu-item" onClick={() => router.push('/repayment')}>
          <img src="/resources/images/my-repayment.webp" alt="我的欠款" />
          <div className="label" id="menu3_text">{pageData.menu3_text || '我的欠款'}</div>
        </div>
        <div className="menu-item" onClick={() => router.push('/userinfo')}>
          <img src="/resources/images/my-data.webp" alt="我的资料" />
          <div className="label" id="menu5_text">{pageData.menu5_text || '我的资料'}</div>
        </div>
        <div className="menu-item" onClick={() => router.push('/profile')}>
          <img src="/resources/images/personal-center.webp" alt="个人中心" />
          <div className="label" id="menu6_text">{pageData.menu6_text || '个人中心'}</div>
        </div>
        <div className="menu-item" onClick={openSettlementService}>
          <img src="/resources/images/personal-center.webp" alt="结清顾问" />
          <div className="label">结清顾问</div>
        </div>
      </div>

      <div className="section-title" id="impact_title">
        {pageData.impact_title || '逾期影响'}
      </div>
      <div className="blue-icons">
        <div>
          <img src="/resources/images/overdue-impact.webp" alt="延迟费用/延迟费" />
          <div id="penalty_text">{pageData.penalty_text || '延迟费用/延迟费'}</div>
        </div>
        <div>
          <img src="/resources/images/overdue-impact.webp" alt="上报征信" />
          <div id="credit_text">{pageData.credit_text || '上报征信'}</div>
        </div>
        <div>
          <img src="/resources/images/overdue-impact.webp" alt="出行受限" />
          <div id="legal_text">{pageData.legal_text || '出行受限'}</div>
        </div>
      </div>

      <div className="footer-img">
        <div className="section-title" id="cooperation_title">
          {pageData.cooperation_title || '合作机构'}
        </div>
        <img src="/resources/images/cooperation.webp" alt="合作机构" style={{ width: '100%', height: 'auto' }} />
      </div>

      <FooterNav />
    </>
  )
}
