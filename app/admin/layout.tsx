'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { RefreshIcon, FullscreenIcon, UserIcon } from '@/components/Icons'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const [activeMenu, setActiveMenu] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 如果是登录页面，不需要检查
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

    // 检查登录状态
    let cancelled = false
    
    fetch('/api/admin/check_session')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        
        if (!data.logged_in) {
          router.push('/admin/login')
        } else {
          setAdminInfo(data.data)
          setLoading(false)
        }
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Check session error:', error)
        setLoading(false)
        router.push('/admin/login')
      })

    return () => {
      cancelled = true
    }
  }, [router, pathname])

  useEffect(() => {
    // 根据路径设置活动菜单
    if (pathname === '/admin' || pathname.startsWith('/admin/users')) {
      setActiveMenu('users')
    } else if (pathname.startsWith('/admin/codes')) {
      setActiveMenu('codes')
    } else if (pathname.startsWith('/admin/settings')) {
      setActiveMenu('settings')
    } else {
      setActiveMenu('dashboard')
    }
  }, [pathname])

  useEffect(() => {
    if (pathname?.startsWith('/admin') && pathname !== '/admin/login') {
      document.documentElement.classList.add('admin-page')
      document.body.classList.add('admin-page')
      return () => {
        document.documentElement.classList.remove('admin-page')
        document.body.classList.remove('admin-page')
      }
    }
  }, [pathname])

  const handleLogout = async () => {
    if (confirm('确定要退出登录吗？')) {
      await fetch('/api/admin/logout', { method: 'POST' })
      router.push('/admin/login')
    }
  }

  // 如果是登录页面，直接渲染子组件
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  // 如果还在加载中，显示加载提示
  if (loading || !adminInfo) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a1a1a',
        color: '#fff'
      }}>
        <div>加载中...</div>
      </div>
    )
  }

  return (
    <div className="admin-bg" style={{ position: 'relative', minHeight: '100vh', background: '#1a1a1a' }}>
      {/* 左侧导航栏：固定不随滚动 */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '200px',
        height: '100vh',
        background: '#2d2d2d',
        borderRight: '1px solid #404040',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 10
      }}>
          {/* Logo */}
          <div style={{
            padding: '20px',
            borderBottom: '1px solid #404040',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
          <img 
            src="/resources/images/red_packet_safe_1_dark.png" 
            alt="催收系统" 
            style={{ width: '40px', height: '40px', borderRadius: '8px' }}
          />
            <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#ffffff' }}>催收系统</span>
          </div>

          {/* 导航菜单 */}
          <nav style={{ flex: 1, padding: '10px 0' }}>
          <Link href="/admin/users" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '12px 20px',
              cursor: 'pointer',
              color: '#ffffff',
              background: activeMenu === 'users' ? '#3d3d3d' : 'transparent',
              borderLeft: activeMenu === 'users' ? '3px solid #667eea' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <img 
                src="/resources/images/real_name_verify.png" 
                alt="用户" 
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: '#ffffff' }}>用户</span>
            </div>
          </Link>
          
          <Link href="/admin/codes" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '12px 20px',
              cursor: 'pointer',
              color: '#ffffff',
              background: activeMenu === 'codes' ? '#3d3d3d' : 'transparent',
              borderLeft: activeMenu === 'codes' ? '3px solid #667eea' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <img 
                src="/resources/images/safe_center.png" 
                alt="验证码" 
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: '#ffffff' }}>验证码</span>
            </div>
          </Link>
          
          <Link href="/admin/settings" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '12px 20px',
              cursor: 'pointer',
              color: '#ffffff',
              background: activeMenu === 'settings' ? '#3d3d3d' : 'transparent',
              borderLeft: activeMenu === 'settings' ? '3px solid #667eea' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <img 
                src="/resources/images/settings.png" 
                alt="系统设置" 
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: '#ffffff' }}>系统设置</span>
            </div>
          </Link>

          <Link href="/admin/admins" style={{ textDecoration: 'none' }}>
            <div style={{
              padding: '12px 20px',
              cursor: 'pointer',
              color: '#ffffff',
              background: activeMenu === 'admins' ? '#3d3d3d' : 'transparent',
              borderLeft: activeMenu === 'admins' ? '3px solid #667eea' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <img 
                src="/resources/images/safe_center.png" 
                alt="管理员" 
                style={{ width: '18px', height: '18px' }}
              />
              <span style={{ color: '#ffffff' }}>管理员</span>
            </div>
          </Link>
          </nav>
      </div>

      {/* 主内容区：仅此区域可滚动 */}
      <div style={{ marginLeft: '200px', display: 'flex', flexDirection: 'column', minHeight: '100vh', width: 'calc(100% - 200px)' }}>
          {/* 顶部导航栏 */}
          <header style={{
            height: '60px',
            background: '#2d2d2d',
            borderBottom: '1px solid #404040',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px'
          }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                  {activeMenu === 'users' && '用户'}
                  {activeMenu === 'codes' && '验证码'}
                  {activeMenu === 'settings' && '系统设置'}
                  {activeMenu === 'admins' && '管理员'}
                </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="刷新"
            >
              <RefreshIcon size={20} color="#ffffff" />
            </button>
            <button
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen()
                } else {
                  document.documentElement.requestFullscreen()
                }
              }}
              style={{
                padding: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="全屏"
            >
              <FullscreenIcon size={20} color="#ffffff" />
            </button>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              padding: '8px 12px',
              borderRadius: '4px',
              background: '#3d3d3d',
              color: '#ffffff'
            }}
            onClick={handleLogout}
            >
              <UserIcon size={18} color="#ffffff" />
              <span style={{ color: '#ffffff' }}>{adminInfo?.username || 'Administrator'}</span>
              <span style={{ fontSize: '12px' }}>▼</span>
            </div>
            </div>
          </header>

          {/* 内容区域：仅此处可上下滚动 */}
          <div style={{ 
            flex: 1, 
            padding: '20px', 
            overflowY: 'auto',
            overflowX: 'hidden',
            background: '#1a1a1a',
            minHeight: 0
          }}>
            {children}
          </div>
      </div>
    </div>
  )
}
