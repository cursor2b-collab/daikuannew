'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkLoginStatus, logout, getCurrentUser } from '@/lib/api'
import FooterNav from '@/components/FooterNav'

export default function ProfilePage() {
  const router = useRouter()
  const [userInfo, setUserInfo] = useState<any>(null)

  useEffect(() => {
    if (!checkLoginStatus(true)) {
      return
    }
    const user = getCurrentUser()
    setUserInfo(user)
  }, [router])

  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) return
    await logout()
  }

  const handleMenuClick = (menu: string) => {
    switch (menu) {
      case 'my-services':
        router.push('/repayment')
        break
      case 'my-details':
        router.push('/repayment')
        break
      case 'my-data':
        router.push('/userinfo')
        break
      case 'super-service':
        fetch('/api/get_customer_service_url')
          .then(res => res.json())
          .then(result => {
            const url = result.code === 200 && result.data?.url ? result.data.url : 'https://kefu'
            window.open(url, '_blank')
          })
          .catch(() => {
            window.open('https://kefu', '_blank')
          })
        break
      default:
        break
    }
  }

  return (
    <div className="profile-page-container">
      <div className="profile-header">
        <h1 className="profile-title">个人中心</h1>
      </div>

      <div className="profile-user-section">
        <div className="profile-avatar">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/149/149071.png" 
            alt="用户头像" 
            className="profile-avatar-img"
          />
        </div>
        <div className="profile-user-info">
          <div className="profile-name">{userInfo?.name || '未登录'}</div>
          <div className="profile-phone">{userInfo?.phone || '未登录'}</div>
        </div>
      </div>

      <div className="profile-menu-list">
        <div className="profile-menu-item" onClick={() => handleMenuClick('my-services')}>
          <span>我的服务</span>
          <span className="menu-arrow">›</span>
        </div>
        <div className="profile-menu-item" onClick={() => handleMenuClick('my-details')}>
          <span>我的详情</span>
          <span className="menu-arrow">›</span>
        </div>
        <div className="profile-menu-item" onClick={() => handleMenuClick('my-data')}>
          <span>我的资料</span>
          <span className="menu-arrow">›</span>
        </div>
        <div className="profile-menu-item" onClick={() => handleMenuClick('super-service')}>
          <span>在线客服</span>
          <span className="menu-arrow">›</span>
        </div>
        <div className="profile-menu-item logout-item" onClick={handleLogout}>
          <span>退出登录</span>
          <span className="menu-arrow">›</span>
        </div>
      </div>

      <FooterNav />
    </div>
  )
}

