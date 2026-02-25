'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { loadPageData, checkLoginStatus, syncLoginWithServer } from '@/lib/api'
import FooterNav from '@/components/FooterNav'
import LoadingOverlay from '@/components/LoadingOverlay'

// 吉祥物图片：使用完整路径避免 Netlify 等部署环境下静态资源 404（需确保 public/resources/images/strip.png 已提交到 Git）
function getMascotSrc(): string {
  if (typeof window !== 'undefined') return `${window.location.origin}/resources/images/strip.png`
  return '/resources/images/strip.png'
}

interface PageData {
  title?: string
  page_title?: string
  subtitle?: string
  welcome_text?: string
  amount_label?: string
  amount_value?: string
  rate_label?: string
  login_btn_text?: string
  tip_text?: string
  marquee_text?: string
  step1_text?: string
  step2_text?: string
  step3_text?: string
  product_title?: string
  rate_info?: string
  max_amount?: string
  payment_method?: string
  process_method?: string
  cooperation_title?: string
  bank_count?: string
  insurance_count?: string
  finance_count?: string
}

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pageData, setPageData] = useState<PageData>({})
  const [marqueeText, setMarqueeText] = useState('加载中...')

  useEffect(() => {
    // 检查登录状态
    if (checkLoginStatus(false)) {
      syncLoginWithServer().then((loggedIn) => {
        if (loggedIn) {
          router.push('/user')
          return
        }
      }).catch(() => {
        // 检查失败不影响页面加载
      })
    }

    // 加载页面数据
    loadPageData('index')
      .then((data) => {
        setPageData(data)
        setLoading(false)
      })
      .catch((error) => {
        console.error('加载数据失败:', error)
        setLoading(false)
      })
  }, [router])

  useEffect(() => {
    const messages = Array.isArray((pageData as any).marquee_messages) && (pageData as any).marquee_messages.length > 0
      ? (pageData as any).marquee_messages
      : [
          '07-07 用户尾号4826 成功申请服务 78800元',
          '07-07 用户尾号1234 成功申请服务 50000元',
          '07-07 用户尾号5678 成功申请服务 30000元'
        ]
    let index = 0
    const updateMarquee = () => {
      setMarqueeText(messages[index] ?? '')
      index = (index + 1) % messages.length
    }
    updateMarquee()
    const interval = setInterval(updateMarquee, 3000)
    return () => clearInterval(interval)
  }, [pageData])

  return (
    <>
      {loading && <LoadingOverlay />}
      <div className={`main-content ${!loading ? 'loaded' : ''}`}>
        {/* 顶部标题区：主标题 + 副标题 */}
        <div className="home-header-text">
          <h1 className="home-header-title">{pageData.page_title || pageData.title || '分期付'}</h1>
          <p className="home-header-subtitle">{pageData.subtitle || '超快下款 超低利率'}</p>
        </div>

        {/* 蓝色信息卡片：左侧吉祥物 + 右侧额度与按钮 */}
        <div className="hero-card">
          <div className="hero-card-inner">
            <div className="hero-card-mascot">
              <img src={getMascotSrc()} alt="" role="presentation" className="hero-mascot-img" onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = 'none'; el.nextElementSibling?.classList.add('show'); }} />
              <div className="hero-mascot-placeholder" aria-hidden>
                <img src={getMascotSrc()} alt="" role="presentation" />
              </div>
            </div>
            <div className="hero-card-content">
              <h2 className="hero-card-product-name">{(pageData as any).hero_product_name ?? pageData.page_title ?? pageData.title ?? '分期付'}</h2>
              <p className="hero-card-quota-label">{(pageData as any).hero_quota_label ?? '最高可获额度（元）'}</p>
              <div className="hero-card-amount">{(pageData as any).hero_amount ?? '200,000'}</div>
              <p className="hero-card-rate">{(pageData as any).hero_rate ?? '年化利率（单利）7.2%起'}</p>
              <Link href="/login" className="hero-card-btn">
                立即登录
              </Link>
            </div>
          </div>
          <div className="hero-card-tip">
            <span className="hero-card-tip-line" />
            <span className="hero-card-tip-text">{(pageData as any).hero_tip ?? '理性借贷 合理消费'}</span>
            <span className="hero-card-tip-line" />
          </div>
        </div>

        <div className="marquee-box" id="marquee">
          <span id="marquee_text">{marqueeText}</span>
        </div>

        <div className="layui-row layui-col-space10 step-box" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
          <div style={{ textAlign: 'center' }}>
            <img 
              src="/resources/images/step-1.webp" 
              alt="申请服务" 
              style={{ width: '48px', height: '48px', margin: 'auto' }}
            />
            <p id="step1_text">{pageData.step1_text || '加载中...'}</p>
          </div>

          <div style={{ padding: '0 5px' }}>
            <img 
              src="/resources/images/zb.png" 
              alt="箭头" 
              style={{ width: '24px', height: 'auto' }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <img 
              src="/resources/images/step-2.webp" 
              alt="最快审批" 
              style={{ width: '48px', height: '48px', margin: 'auto' }}
            />
            <p id="step2_text">{pageData.step2_text || '加载中...'}</p>
          </div>

          <div style={{ padding: '0 5px' }}>
            <img 
              src="/resources/images/zb.png" 
              alt="箭头" 
              style={{ width: '24px', height: 'auto' }}
            />
          </div>

          <div style={{ textAlign: 'center' }}>
            <img 
              src="/resources/images/step-3.webp" 
              alt="最快处理" 
              style={{ width: '48px', height: '48px', margin: 'auto' }}
            />
            <p id="step3_text">{pageData.step3_text || '加载中...'}</p>
          </div>
        </div>

        <div className="layui-card product-card layui-container">
          <div className="layui-card-header" id="product_title">{pageData.product_title || '加载中...'}</div>
          <div className="layui-card-body">
            <table className="layui-table" style={{ fontSize: 'small' }} data-lay-size="sm">
              <tbody>
                <tr>
                  <td>服务费率</td>
                  <td id="rate_info">{pageData.rate_info || '加载中...'}</td>
                </tr>
                <tr>
                  <td>最高额度</td>
                  <td id="max_amount">{pageData.max_amount || '加载中...'}</td>
                </tr>
                <tr>
                  <td>计费方式</td>
                  <td id="payment_method">{pageData.payment_method || '加载中...'}</td>
                </tr>
                <tr>
                  <td>处理方式</td>
                  <td id="process_method">{pageData.process_method || '加载中...'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="layui-container" style={{ marginTop: '20px' }}>
          <div className="layui-card">
            <div className="layui-card-header" style={{ textAlign: 'center', fontSize: '1.1rem' }} id="cooperation_title">
              {pageData.cooperation_title || '加载中...'}
            </div>
            <div className="layui-card-body" style={{ textAlign: 'center' }}>
              <div style={{ marginTop: '15px' }}>
                <img src="/resources/images/cooperation.webp" alt="合作机构" style={{ width: '100%', height: 'auto' }} />
              </div>
            </div>
          </div>
        </div>

        <FooterNav />
      </div>
    </>
  )
}
