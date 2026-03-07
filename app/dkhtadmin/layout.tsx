'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { RefreshIcon, FullscreenIcon, UserIcon } from '@/components/Icons'
import AdminLoader from '@/components/AdminLoader'

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
  const [showChangePwdModal, setShowChangePwdModal] = useState(false)
  const [changePwdOld, setChangePwdOld] = useState('')
  const [changePwdNew, setChangePwdNew] = useState('')
  const [changePwdConfirm, setChangePwdConfirm] = useState('')
  const [changePwdLoading, setChangePwdLoading] = useState(false)

  useEffect(() => {
    // 如果是登录页面，不需要检查
    if (pathname === '/dkhtadmin/login') {
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
          router.push('/dkhtadmin/login')
        } else {
          setAdminInfo(data.data)
          setLoading(false)
        }
      })
      .catch((error) => {
        if (cancelled) return
        console.error('Check session error:', error)
        setLoading(false)
        router.push('/dkhtadmin/login')
      })

    return () => {
      cancelled = true
    }
  }, [router, pathname])

  useEffect(() => {
    const map: [string, string][] = [
      ['/dkhtadmin/users', 'users'],
      ['/dkhtadmin/contracts', 'contracts'],
      ['/dkhtadmin/vouchers', 'vouchers'],
      ['/dkhtadmin/announcements', 'announcements'],
      ['/dkhtadmin/refunds', 'refunds'],
      ['/dkhtadmin/agents', 'agents'],
      ['/dkhtadmin/robot-perms', 'robot-perms'],
      ['/dkhtadmin/cs-perms', 'cs-perms'],
      ['/dkhtadmin/cs-login-limit', 'cs-login-limit'],
      ['/dkhtadmin/agent-login-limit', 'agent-login-limit'],
      ['/dkhtadmin/domain-sale', 'domain-sale'],
      ['/dkhtadmin/codes', 'codes'],
      ['/dkhtadmin/settings', 'settings'],
      ['/dkhtadmin/admins', 'admins'],
    ]
    const found = map.find(([prefix]) => pathname?.startsWith(prefix))
    setActiveMenu(found ? found[1] : 'dashboard')
  }, [pathname])

  useEffect(() => {
    if (pathname?.startsWith('/dkhtadmin') && pathname !== '/dkhtadmin/login') {
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
      router.push('/dkhtadmin/login')
    }
  }

  const handleChangePassword = async () => {
    if (!changePwdOld.trim() || !changePwdNew.trim()) {
      alert('请填写原密码和新密码')
      return
    }
    if (changePwdNew.length < 6) {
      alert('新密码长度至少6位')
      return
    }
    if (changePwdNew !== changePwdConfirm) {
      alert('两次输入的新密码不一致')
      return
    }
    setChangePwdLoading(true)
    try {
      const res = await fetch('/api/admin/change_password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ old_password: changePwdOld, new_password: changePwdNew })
      })
      const data = await res.json()
      if (data.code === 200) {
        alert(data.msg || '密码修改成功，请使用新密码重新登录')
        setShowChangePwdModal(false)
        setChangePwdOld('')
        setChangePwdNew('')
        setChangePwdConfirm('')
        await fetch('/api/admin/logout', { method: 'POST' })
        router.push('/dkhtadmin/login')
      } else {
        alert(data.msg || '修改失败')
      }
    } catch (e) {
      alert('修改失败，请重试')
    } finally {
      setChangePwdLoading(false)
    }
  }

  // 如果是登录页面，直接渲染子组件
  if (pathname === '/dkhtadmin/login') {
    return <>{children}</>
  }

  // 如果还在加载中，显示加载动画
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
        <AdminLoader />
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
            { href: '/dkhtadmin', key: 'dashboard', label: '仪表盘', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
              </svg>
            )},
            { href: '/dkhtadmin/users', key: 'users', label: '客户管理', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            )},
            { href: '/dkhtadmin/contracts', key: 'contracts', label: '合同管理', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            )},
            { href: '/dkhtadmin/vouchers', key: 'vouchers', label: '付款凭证', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            )},
            { href: '/dkhtadmin/refunds', key: 'refunds', label: '退款信息', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>
              </svg>
            )},
            { href: '/dkhtadmin/agents', key: 'agents', label: '代理站点', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            )},
            { href: '/dkhtadmin/robot-perms', key: 'robot-perms', label: '机器人权限授予', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M12 2a2 2 0 0 1 2 2v3H10V4a2 2 0 0 1 2-2z"/>
                <circle cx="9" cy="16" r="1" fill="currentColor"/><circle cx="15" cy="16" r="1" fill="currentColor"/>
                <line x1="8" y1="22" x2="8" y2="22"/><line x1="16" y1="22" x2="16" y2="22"/>
              </svg>
            )},
            { href: '/dkhtadmin/cs-perms', key: 'cs-perms', label: '客服权限授予', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
                <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
              </svg>
            )},
            { href: '/dkhtadmin/cs-login-limit', key: 'cs-login-limit', label: '客服限制登录数', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            )},
            { href: '/dkhtadmin/agent-login-limit', key: 'agent-login-limit', label: '代理限制登录数', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            )},
            { href: '/dkhtadmin/announcements', key: 'announcements', label: '发布公告', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3z"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            )},
            { href: '/dkhtadmin/domain-sale', key: 'domain-sale', label: '域名出售系统', icon: (
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
            { href: '/dkhtadmin/codes', key: 'codes', label: '验证码', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
            )},
            { href: '/dkhtadmin/settings', key: 'settings', label: '系统设置', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            )},
            { href: '/dkhtadmin/admins', key: 'admins', label: '管理员', icon: (
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
            <button
              type="button"
              onClick={() => setShowChangePwdModal(true)}
              style={{
                padding: '6px 12px',
                background: '#404040',
                border: '1px solid #555',
                borderRadius: '4px',
                color: '#fff',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              修改密码
            </button>
            <div
              role="button"
              style={{
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
              <span style={{ color: '#ffffff' }}>{adminInfo?.email || adminInfo?.username || 'Administrator'}</span>
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

      {/* 修改密码弹窗 */}
      {showChangePwdModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#2d2d2d', borderRadius: '8px', padding: '24px', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ margin: '0 0 20px', color: '#fff', fontSize: '16px' }}>修改登录密码</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '13px' }}>原密码</label>
              <input type="password" value={changePwdOld} onChange={e => setChangePwdOld(e.target.value)} placeholder="请输入原密码"
                style={{ width: '100%', padding: '10px 12px', background: '#1a1a1a', border: '1px solid #444', borderRadius: '4px', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '13px' }}>新密码（至少6位）</label>
              <input type="password" value={changePwdNew} onChange={e => setChangePwdNew(e.target.value)} placeholder="请输入新密码"
                style={{ width: '100%', padding: '10px 12px', background: '#1a1a1a', border: '1px solid #444', borderRadius: '4px', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '6px', color: '#aaa', fontSize: '13px' }}>确认新密码</label>
              <input type="password" value={changePwdConfirm} onChange={e => setChangePwdConfirm(e.target.value)} placeholder="请再次输入新密码"
                style={{ width: '100%', padding: '10px 12px', background: '#1a1a1a', border: '1px solid #444', borderRadius: '4px', color: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowChangePwdModal(false); setChangePwdOld(''); setChangePwdNew(''); setChangePwdConfirm('') }}
                style={{ padding: '8px 16px', background: '#404040', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>取消</button>
              <button type="button" onClick={handleChangePassword} disabled={changePwdLoading}
                style={{ padding: '8px 16px', background: '#667eea', color: '#fff', border: 'none', borderRadius: '4px', cursor: changePwdLoading ? 'not-allowed' : 'pointer' }}>{changePwdLoading ? '提交中...' : '确定'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
