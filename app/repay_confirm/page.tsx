'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { checkLoginStatus, getCurrentUser } from '@/lib/api'
import FooterNav from '@/components/FooterNav'

export default function RepayConfirmPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const periodFromUrl = searchParams.get('period')
  const amountFromUrl = searchParams.get('amount')
  const [userInfo, setUserInfo] = useState<any>(null)
  const [loanData, setLoanData] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [selectedCard, setSelectedCard] = useState('银行卡一')
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)

  const isPeriodRepay = periodFromUrl && amountFromUrl
  const displayAmount = isPeriodRepay ? amountFromUrl : (loanData?.totalRepayment || '0.00')

  useEffect(() => {
    if (!checkLoginStatus(true)) {
      return
    }
    const user = getCurrentUser()
    setUserInfo(user)
    loadUserData()
  }, [router])

  const loadUserData = async () => {
    try {
      const user = getCurrentUser()
      const userId = (user as any)?.id ?? (user as any)?.user_id
      if (!user?.phone && !userId) {
        return
      }
      const query = userId ? `userId=${userId}` : `phone=${encodeURIComponent(user!.phone)}`
      const response = await fetch(`/api/get_user_data?${query}`, { cache: 'no-store' })
      const result = await response.json()

      if (result.code === 200 && result.data) {
        setLoanData(result.data)
        
        // 获取收款方式
        const paymentMethodsData = result.data.payment_method || []
        if (paymentMethodsData.length > 0) {
          setPaymentMethods(paymentMethodsData)
          setSelectedCard(paymentMethodsData[0].type || '银行卡一')
        } else {
          // 如果没有收款方式，从系统设置获取
          try {
            const settingsResponse = await fetch('/api/get_payment_methods')
            const settingsResult = await settingsResponse.json()
            if (settingsResult.code === 200 && settingsResult.data) {
              setPaymentMethods(settingsResult.data)
              if (settingsResult.data.length > 0) {
                setSelectedCard(settingsResult.data[0].type || '银行卡一')
              }
            }
          } catch (error) {
            console.error('获取系统收款方式失败:', error)
          }
        }
      }
    } catch (error) {
      console.error('加载用户数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSelectedPaymentMethod = () => {
    return paymentMethods.find(method => method.type === selectedCard) || paymentMethods[0] || {}
  }

  const handleCopyCardNumber = () => {
    const selectedMethod = getSelectedPaymentMethod()
    const cardNumber = selectedMethod.card_number || ''
    
    if (!cardNumber) {
      alert('卡号不存在')
      return
    }

    navigator.clipboard.writeText(cardNumber).then(() => {
      alert('卡号已复制到剪贴板')
    }).catch(() => {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = cardNumber
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        alert('卡号已复制到剪贴板')
      } catch (err) {
        alert('复制失败，请手动复制')
      }
      document.body.removeChild(textArea)
    })
  }

  const maskCardNumber = (cardNumber: string) => {
    if (!cardNumber) return '****************'
    if (cardNumber.length <= 8) return '****************'
    return cardNumber.slice(0, 4) + ' ' + '*'.repeat(8) + ' ' + cardNumber.slice(-4)
  }

  const maskName = (name: string) => {
    if (!name) return '***'
    if (name.length <= 2) return '***'
    return name.slice(0, 1) + '**'
  }

  const handleContactService = async () => {
    try {
      const response = await fetch('/api/get_customer_service_url')
      const result = await response.json()
      const url = result.code === 200 && result.data?.url ? result.data.url : 'https://kefu-seven.vercel.app/'
      window.open(url, '_blank')
    } catch (error) {
      window.open('https://kefu-seven.vercel.app/', '_blank')
    }
  }

  if (loading) {
    return (
      <div className="repay-confirm-container">
        <div className="repay-confirm-content">
          <div className="repay-confirm-card" style={{ textAlign: 'center', padding: '40px' }}>
            <div>加载中...</div>
          </div>
        </div>
      </div>
    )
  }

  const selectedMethod = getSelectedPaymentMethod()

  return (
    <div className="repay-confirm-container">
      {/* Header */}
      <div className="repay-confirm-header">
        <button className="repay-confirm-back-btn" onClick={() => router.back()} type="button">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="repay-confirm-title">收银台</h1>
        <div style={{ width: '24px' }}></div>
      </div>

      <div className="repay-confirm-content">
        {/* Confirm Repayment Information Section */}
        <div className="repay-confirm-card">
          <h2 className="repay-confirm-section-title">确认还款信息</h2>
          {isPeriodRepay && (
            <div className="repay-confirm-info-item" style={{ marginBottom: '8px' }}>
              <span className="repay-confirm-label">还款期数:</span>
              <span className="repay-confirm-value">第{periodFromUrl}期</span>
            </div>
          )}
          <div className="repay-confirm-info-item">
            <span className="repay-confirm-label">贷款编号:</span>
            <span className="repay-confirm-value">{loanData?.loan_number || '-'}</span>
          </div>
          <div className="repay-confirm-info-item">
            <span className="repay-confirm-label">借款金额:</span>
            <span className="repay-confirm-value">¥{loanData?.loanAmount || '0.00'}</span>
          </div>
          <div className="repay-confirm-info-item repay-confirm-total">
            <span className="repay-confirm-label" style={{ color: '#dc2626' }}>
              {isPeriodRepay ? '本期还款金额:' : '总还款金额:'}
            </span>
            <span className="repay-confirm-value" style={{ color: '#dc2626' }}>¥{displayAmount}</span>
          </div>
        </div>

        {/* Choose Repayment Method Section */}
        <div className="repay-confirm-card">
          <h2 className="repay-confirm-section-title">选择还款方式</h2>
          
          {paymentMethods.length > 0 ? (
            <>
              <div className="repay-confirm-dropdown-wrapper">
                <div 
                  className="repay-confirm-dropdown"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <span>{selectedCard}</span>
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 12 12" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="#666666" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                
                {showDropdown && (
                  <div className="repay-confirm-dropdown-list">
                    {paymentMethods.map((method, index) => (
                      <div
                        key={index}
                        className={`repay-confirm-dropdown-item ${selectedCard === method.type ? 'selected' : ''}`}
                        onClick={() => {
                          setSelectedCard(method.type)
                          setShowDropdown(false)
                        }}
                      >
                        {method.type}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="repay-confirm-bank-info">
                <div className="repay-confirm-info-item">
                  <span className="repay-confirm-label">开户行:</span>
                  <span className="repay-confirm-value">{selectedMethod.bank_name || '-'}</span>
                </div>
                <div className="repay-confirm-info-item">
                  <span className="repay-confirm-label">户名:</span>
                  <span className="repay-confirm-value">{maskName(selectedMethod.payee_name || '')}</span>
                </div>
                <div className="repay-confirm-info-item">
                  <span className="repay-confirm-label">卡号:</span>
                  <span className="repay-confirm-value repay-confirm-card-number">{maskCardNumber(selectedMethod.card_number || '')}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              暂无收款方式
            </div>
          )}
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="repay-confirm-footer">
        <button 
          className="repay-confirm-btn repay-confirm-btn-copy"
          onClick={handleCopyCardNumber}
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 3H7C5.89543 3 5 3.89543 5 5V13C5 14.1046 5.89543 15 7 15H13C14.1046 15 15 14.1046 15 13V5C15 3.89543 14.1046 3 13 3Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11 1V5C11 5.55228 11.4477 6 12 6H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span>复制卡号</span>
        </button>
        <button 
          className="repay-confirm-btn repay-confirm-btn-service"
          onClick={handleContactService}
          type="button"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 2C5.58172 2 2 4.58172 2 9C2 10.9062 2.75 12.625 4 13.875L2 18L6.5 16C7.75 16.75 8.8125 17 10 17C14.4183 17 18 14.4183 18 9C18 4.58172 14.4183 2 10 2Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="7" cy="9" r="1" fill="white"/>
            <circle cx="10" cy="9" r="1" fill="white"/>
            <circle cx="13" cy="9" r="1" fill="white"/>
          </svg>
          <span>联系在线客服</span>
        </button>
      </div>

      <FooterNav />
    </div>
  )
}

