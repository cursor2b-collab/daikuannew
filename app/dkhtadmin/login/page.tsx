'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styled from 'styled-components'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 检查是否已登录
    fetch('/api/admin/check_session')
      .then(res => res.json())
      .then(data => {
        if (data.logged_in) {
          router.push('/dkhtadmin')
        }
      })
      .catch(() => {
        // 忽略错误
      })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      alert('请输入邮箱和密码')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('email', email)
      formData.append('password', password)

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.code === 200) {
        alert('登录成功')
        router.push('/dkhtadmin')
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
    <StyledWrapper>
      <div className="admin-bg" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <aside className="inner"></aside>
        <div id="form-ui" style={{ position: 'relative', zIndex: 10000 }}>
          <form action="#" method="post" id="form" onSubmit={handleSubmit}>
            <div id="form-body">
              <div id="welcome-lines">
                <div id="welcome-line-1">催收系统</div>
                <div id="welcome-line-2">Welcome</div>
              </div>
              <div id="input-area">
                <div className="form-inp">
                  <input 
                    placeholder="请输入邮箱" 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-inp">
                  <input 
                    placeholder="请输入密码" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div id="submit-button-cvr">
                <button 
                  id="submit-button" 
                  type="submit"
                  disabled={loading}
                  style={{
                    opacity: loading ? 0.6 : 1,
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? '登录中...' : '立即登录'}
                </button>
              </div>
              <div id="forgot-pass">
              </div>
              <div id="bar" />
            </div>
          </form>
        </div>
      </div>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.div`
  #form-ui {
    position: relative;
    z-index: 10000;
  }

  #form {
    display: grid;
    place-items: center;
    width: 350px;
    height: 399px;
    padding: 25px;
    background-color: #161616;
    box-shadow: 0px 15px 60px #00FF7F;
    outline: 1px solid #2b9962;
    border-radius: 30px;
    position: relative;
    z-index: 10000;
  }

  #form-body {
    position: absolute;
    top: 50%;
    right: 25px;
    left: 25px;
    width: 230px;
    margin: -156px auto 0 auto;
  }

  #welcome-lines {
    text-align: center;
    line-height: 1;
  }

  #welcome-line-1 {
    color: #00FF7F;
    font-weight: 600;
    font-size: 40px;
  }

  #welcome-line-2 {
    color: #ffffff;
    font-size: 18px;
    margin-top: 17px;
  }

  #input-area {
    margin-top: 40px;
  }

  .form-inp {
    padding: 11px 25px;
    background: transparent;
    border: 1px solid #e3e3e3;
    line-height: 1;
    border-radius: 8px;
    position: relative;
    z-index: 10001;
  }

  .form-inp:focus-within {
    border: 1px solid #00FF7F;
  }

  .form-inp:first-child {
    margin-bottom: 15px;
  }

  .form-inp input {
    width: 100%;
    background: none;
    font-size: 13.4px;
    color: #00FF7F;
    border: none;
    padding: 0;
    margin: 0;
    position: relative;
    z-index: 10002;
  }

  .form-inp input::placeholder {
    color: #868686;
  }

  .form-inp input:focus {
    outline: none;
  }

  #submit-button-cvr {
    margin-top: 20px;
    position: relative;
    z-index: 10001;
  }

  #submit-button {
    display: block;
    width: 100%;
    color: #00FF7F;
    background-color: transparent;
    font-weight: 600;
    font-size: 14px;
    margin: 0;
    padding: 14px 13px 12px 13px;
    border: 0;
    outline: 1px solid #00FF7F;
    border-radius: 8px;
    line-height: 1;
    cursor: pointer;
    transition: all ease-in-out .3s;
    position: relative;
    z-index: 10002;
  }

  #submit-button:hover:not(:disabled) {
    transition: all ease-in-out .3s;
    background-color: #00FF7F;
    color: #161616;
    cursor: pointer;
  }

  #submit-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  #forgot-pass {
    text-align: center;
    margin-top: 10px;
  }

  #forgot-pass a {
    color: #868686;
    font-size: 12px;
    text-decoration: none;
  }

  #bar {
    position: relative;
    z-index: 10001;
  }
`
