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
    const map: [string, string][] = [
      ['/admin/users', 'users'],
      ['/admin/contracts', 'contracts'],
      ['/admin/vouchers', 'vouchers'],
      ['/admin/announcements', 'announcements'],
      ['/admin/refunds', 'refunds'],
      ['/admin/agents', 'agents'],
      ['/admin/robot-perms', 'robot-perms'],
      ['/admin/cs-perms', 'cs-perms'],
      ['/admin/cs-login-limit', 'cs-login-limit'],
      ['/admin/agent-login-limit', 'agent-login-limit'],
      ['/admin/domain-sale', 'domain-sale'],
      ['/admin/codes', 'codes'],
      ['/admin/settings', 'settings'],
      ['/admin/admins', 'admins'],
    ]
    const found = map.find(([prefix]) => pathname?.startsWith(prefix))
    setActiveMenu(found ? found[1] : 'dashboard')
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
          <nav style={{ flex: 1, padding: '6px 0', overflowY: 'auto' }}>
          {([
            { href: '/admin', key: 'dashboard', label: '仪表盘', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            )},
            { href: '/admin/users', key: 'users', label: '客户管理', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            )},
            { href: '/admin/contracts', key: 'contracts', label: '合同管理', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            )},
            { href: '/admin/vouchers', key: 'vouchers', label: '付款凭证', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            )},
            { href: '/admin/refunds', key: 'refunds', label: '退款信息', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
              </svg>
            )},
            { href: '/admin/agents', key: 'agents', label: '代理站点', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            )},
            { href: '/admin/robot-perms', key: 'robot-perms', label: '机器人权限授予', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M12 2a2 2 0 0 1 2 2v3H10V4a2 2 0 0 1 2-2z"/>
                <circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/>
                <line x1="8" y1="22" x2="8" y2="22"/><line x1="16" y1="22" x2="16" y2="22"/>
              </svg>
            )},
            { href: '/admin/cs-perms', key: 'cs-perms', label: '客服权限授予', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
                <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
              </svg>
            )},
            { href: '/admin/cs-login-limit', key: 'cs-login-limit', label: '客服限制登录数', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )},
            { href: '/admin/agent-login-limit', key: 'agent-login-limit', label: '代理限制登录数', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            )},
            { href: '/admin/announcements', key: 'announcements', label: '发布公告', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            )},
            { href: '/admin/domain-sale', key: 'domain-sale', label: '域名出售系统', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
            )},
          ] as { href: string; key: string; label: string; icon: React.ReactNode }[]).map(item => (
            <Link key={item.key} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '10px 16px',
                cursor: 'pointer',
                background: activeMenu === item.key ? '#3d3d3d' : 'transparent',
                borderLeft: activeMenu === item.key ? '3px solid #667eea' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: activeMenu === item.key ? '#ffffff' : '#aaaaaa',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { if (activeMenu !== item.key) (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
              onMouseLeave={e => { if (activeMenu !== item.key) (e.currentTarget as HTMLElement).style.color = '#aaaaaa' }}
              >
                {item.icon}
                <span style={{ fontSize: 13 }}>{item.label}</span>
              </div>
            </Link>
          ))}
          {/* 分割线 */}
          <div style={{ margin: '8px 16px', borderTop: '1px solid #404040' }} />
          {([
            { href: '/admin/codes', key: 'codes', label: '验证码', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            )},
            { href: '/admin/settings', key: 'settings', label: '系统设置', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            )},
            { href: '/admin/admins', key: 'admins', label: '管理员', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            )},
          ] as { href: string; key: string; label: string; icon: React.ReactNode }[]).map(item => (
            <Link key={item.key} href={item.href} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '10px 16px',
                cursor: 'pointer',
                background: activeMenu === item.key ? '#3d3d3d' : 'transparent',
                borderLeft: activeMenu === item.key ? '3px solid #667eea' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: activeMenu === item.key ? '#ffffff' : '#aaaaaa',
                transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => { if (activeMenu !== item.key) (e.currentTarget as HTMLElement).style.color = '#ffffff' }}
              onMouseLeave={e => { if (activeMenu !== item.key) (e.currentTarget as HTMLElement).style.color = '#aaaaaa' }}
              >
                {item.icon}
                <span style={{ fontSize: 13 }}>{item.label}</span>
              </div>
            </Link>
          ))}
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
                  {activeMenu === 'dashboard' && '仪表盘'}
                  {activeMenu === 'users' && '客户管理'}
                  {activeMenu === 'contracts' && '合同管理'}
                  {activeMenu === 'vouchers' && '付款凭证'}
                  {activeMenu === 'refunds' && '退款信息'}
                  {activeMenu === 'agents' && '代理站点'}
                  {activeMenu === 'robot-perms' && '机器人权限授予'}
                  {activeMenu === 'cs-perms' && '客服权限授予'}
                  {activeMenu === 'cs-login-limit' && '客服限制登录数'}
                  {activeMenu === 'agent-login-limit' && '代理限制登录数'}
                  {activeMenu === 'announcements' && '发布公告'}
                  {activeMenu === 'domain-sale' && '域名出售系统'}
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
