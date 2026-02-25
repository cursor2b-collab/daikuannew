/**
 * API 调用工具函数
 */

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined'

/**
 * 获取当前登录用户信息
 */
export function getCurrentUser() {
  if (!isBrowser) return null
  
  const userInfo = localStorage.getItem('userInfo')
  if (!userInfo) {
    return null
  }
  
  try {
    return JSON.parse(userInfo)
  } catch (e) {
    return null
  }
}

/**
 * 设置用户登录状态
 */
export function setUserLogin(userData: any) {
  if (!isBrowser) return
  localStorage.setItem('userInfo', JSON.stringify(userData))
}

/**
 * 清除用户登录状态
 */
export function clearUserLogin() {
  if (!isBrowser) return
  localStorage.removeItem('userInfo')
}

/**
 * 检查用户登录状态
 */
export function checkLoginStatus(redirect: boolean = true): boolean {
  if (!isBrowser) return false
  
  const userInfo = localStorage.getItem('userInfo')
  if (!userInfo) {
    if (redirect && isBrowser) {
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    }
    return false
  }
  
  try {
    const user = JSON.parse(userInfo)
    if (!user.phone) {
      if (redirect && isBrowser) {
        setTimeout(() => {
          window.location.href = '/login'
        }, 100)
      }
      return false
    }
    return true
  } catch (e) {
    if (redirect && isBrowser) {
      setTimeout(() => {
        window.location.href = '/login'
      }, 100)
    }
    return false
  }
}

/**
 * 与服务端会话同步登录状态
 */
export async function syncLoginWithServer(clearLocalOnServerLogout: boolean = true): Promise<boolean> {
  if (!isBrowser) return false
  
  try {
    const response = await fetch('/api/check_session', {
      method: 'GET',
      credentials: 'same-origin'
    })
    const data = await response.json()
    
    if (data && data.logged_in) {
      const local = getCurrentUser()
      if (!local || !local.phone) {
        const serverUser = data.data || {}
        setUserLogin({
          id: serverUser.user_id,
          phone: serverUser.phone,
          login_time: serverUser.login_time
        })
      }
      return true
    } else {
      if (clearLocalOnServerLogout) {
        clearUserLogin()
      }
      return false
    }
  } catch (error) {
    // 网络异常时退化为本地判断
    return !!getCurrentUser()
  }
}

/**
 * 加载页面数据
 */
export async function loadPageData(page: string, phone?: string): Promise<any> {
  let url = `/api/getData?page=${page}`
  if (phone) {
    url += `&phone=${encodeURIComponent(phone)}`
  }
  
  try {
    const response = await fetch(url)
    const data = await response.json()
    return data
  } catch (error) {
    console.error('加载数据失败:', error)
    throw error
  }
}

/**
 * 发送验证码（需先完成图形验证码）
 */
export async function sendVerificationCode(
  phone: string,
  captchaToken: string,
  captchaValue: string
): Promise<any> {
  const formData = new FormData()
  formData.append('phone', phone)
  formData.append('captcha_token', captchaToken)
  formData.append('captcha_value', captchaValue)
  const response = await fetch('/api/send_code', {
    method: 'POST',
    body: formData
  })
  return await response.json()
}

/**
 * 提交登录
 */
export async function submitLogin(phone: string, code: string): Promise<any> {
  const response = await fetch('/api/check_login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `phone=${encodeURIComponent(phone)}&code=${encodeURIComponent(code)}`
  })
  return await response.json()
}

/**
 * 退出登录
 */
export async function logout(): Promise<void> {
  try {
    await fetch('/api/logout', {
      method: 'POST',
      credentials: 'same-origin'
    })
  } catch (error) {
    // 忽略网络错误，保障本地退出
  } finally {
    clearUserLogin()
    if (isBrowser) {
      window.location.href = '/login'
    }
  }
}

