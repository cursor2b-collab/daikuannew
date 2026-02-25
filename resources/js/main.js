/**
 * 通用AJAX渲染逻辑 - 安全版本
 * 负责动态加载页面数据并渲染到页面元素
 */


// 使用axios进行AJAX请求 - 兼容旧版本浏览器
var axios = window.axios || {
    get: function(url) {
        // 优先使用fetch，降级到XMLHttpRequest
        if (window.fetch) {
            return fetch(url)
                .then(function(response) { return response.json(); })
                .then(function(data) { return { data: data }; })
                .catch(function(error) {
                    return { data: {} };
                });
        } else {
            // 降级到XMLHttpRequest
            return new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', url, true);
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            try {
                                var data = JSON.parse(xhr.responseText);
                                resolve({ data: data });
                            } catch (e) {
                                resolve({ data: {} });
                            }
                        } else {
                            resolve({ data: {} });
                        }
                    }
                };
                xhr.send();
            });
        }
    }
};

/**
 * 常用随机数/随机选择工具
 */
function randInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, digits) {
    digits = (typeof digits === 'number') ? digits : 2;
    var v = Math.random() * (max - min) + min;
    return Number(v.toFixed(digits));
}

function sampleOne(arr) {
    if (!arr || !arr.length) return undefined;
    return arr[Math.floor(Math.random() * arr.length)];
}

function randDigits(len) {
    var s = '';
    for (var i = 0; i < len; i++) s += Math.floor(Math.random() * 10);
    return s;
}

// 生成常见的跑马灯消息（可按需使用）
function generateRandomMarqueeMessage() {
    var today = new Date();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    var tail = randDigits(4);
    var amounts = [30000, 50000, 66000, 78800, 88000, 128000];
    var amt = sampleOne(amounts);
    return mm + '-' + dd + ' 用户尾号' + tail + ' 成功申请服务 ' + amt + '元';
}

/**
 * 加载页面数据
 * @param {string} page - 页面名称
 * @param {string} phone - 用户手机号（可选）
 */
function loadPageData(page, phone) {
    // 兼容性处理：如果没有传入phone参数，设为空字符串
    phone = phone || '';
    
    // 构建请求URL（根路径接口）
    var url = '/api/getData.php?page=' + page;
    if (phone) {
        url += '&phone=' + encodeURIComponent(phone);
    }
    
    return axios.get(url)
        .then(function(response) {
            var data = response.data;
            
            // 渲染数据到页面元素
            renderPageData(data);
            
            // 执行页面特定的初始化逻辑
            initPageSpecificLogic(page);
            
            return data; // 返回数据供后续使用
        })
        .catch(function(error) {
            showErrorMessage('数据加载失败，请刷新页面重试');
            throw error; // 重新抛出错误
        });
}

/**
 * 渲染数据到页面元素
 * @param {Object} data - 页面数据
 */
function renderPageData(data) {
    // 排除期数配置字段，避免覆盖手动设置的值
    var excludeKeys = ['repayment_periods', 'repayment_months'];
    
    for (var key in data) {
        // 跳过期数配置字段
        if (excludeKeys.indexOf(key) !== -1) {
            continue;
        }
        
        var element = document.getElementById(key);
        if (element) {
            // 根据元素类型进行不同的处理
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.value = data[key];
            } else if (element.tagName === 'INPUT' && element.type === 'number') {
                element.value = data[key];
            } else {
                element.innerText = data[key];
            }
        }
    }
}

/**
 * 检查用户登录状态
 * @param {boolean} redirect - 是否在未登录时跳转到登录页
 * @returns {boolean} 是否已登录
 */
function checkLoginStatus(redirect) {
    // 兼容性处理：如果没有传入redirect参数，设为true
    redirect = redirect !== false;
    
    var userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
        if (redirect) {
            // 延迟跳转，避免页面闪烁
            setTimeout(function() {
                window.location.href = 'login.php';
            }, 100);
        }
        return false;
    }
    
    try {
        var user = JSON.parse(userInfo);
        if (!user.phone) {
            if (redirect) {
                setTimeout(function() {
                    window.location.href = 'login.php';
                }, 100);
            }
            return false;
        }
        return true;
    } catch (e) {
        if (redirect) {
            setTimeout(function() {
                window.location.href = 'login.php';
            }, 100);
        }
        return false;
    }
}

/**
 * 与服务端会话同步登录状态
 * - 若服务端已登录而本地无缓存，则写入本地
 * - 若服务端未登录而本地有缓存，则清理本地（可通过参数控制）
 * @param {boolean} clearLocalOnServerLogout - 服务端未登录时是否清除本地信息（默认true，嵌套环境可设为false）
 * @returns {Promise<boolean>} 是否登录
 */
function syncLoginWithServer(clearLocalOnServerLogout) {
    // 默认清除本地信息，但在嵌套环境中可以设为false
    if (clearLocalOnServerLogout === undefined) {
        clearLocalOnServerLogout = true;
    }
    
    return fetch('api/check_session.php', {
        method: 'GET',
        credentials: 'same-origin'
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data && data.logged_in) {
            var local = getCurrentUser();
            if (!local || !local.phone) {
                var serverUser = (data.data || {});
                setUserLogin({
                    id: serverUser.user_id,
                    phone: serverUser.phone,
                    login_time: serverUser.login_time
                });
            }
            return true;
        } else {
            // 服务端未登录，根据参数决定是否清理本地
            if (clearLocalOnServerLogout) {
                clearUserLogin();
            }
            return false;
        }
    })
    .catch(function() {
        // 网络异常时退化为本地判断，不清除本地信息
        return !!getCurrentUser();
    });
}

/**
 * 二次确认（原生confirm）
 * @param {Function} onConfirm 确认后的回调
 */
function doubleConfirmLogout(onConfirm) {
    if (!confirm('确定要退出登录吗？')) return;
    if (typeof onConfirm === 'function') onConfirm();
}

/**
 * 获取当前登录用户信息
 * @returns {Object|null} 用户信息对象或null
 */
function getCurrentUser() {
    var userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
        return null;
    }
    
    try {
        return JSON.parse(userInfo);
    } catch (e) {
        return null;
    }
}

/**
 * 设置用户登录状态
 * @param {Object} userData - 用户数据
 */
function setUserLogin(userData) {
    localStorage.setItem('userInfo', JSON.stringify(userData));
}

/**
 * 清除用户登录状态
 */
function clearUserLogin() {
    localStorage.removeItem('userInfo');
}

/**
 * 检查登录状态并自动跳转（用于需要登录的页面）
 */
function requireLogin() {
    if (!checkLoginStatus(true)) {
        return false;
    }
    return true;
}

/**
 * 需要登录的页面列表
 */
var LOGIN_REQUIRED_PAGES = [
    'user', 'profile', 'repayment', 'contract', 
    'repay_confirm', 'jieqing', 'userinfo'
];

/**
 * 页面特定初始化逻辑
 * @param {string} page - 页面名称
 */
function initPageSpecificLogic(page) {
    // 检查是否需要登录
    if (LOGIN_REQUIRED_PAGES.includes(page)) {
        if (!checkLoginStatus(true)) {
            return; // 如果未登录，会跳转到登录页，不需要继续初始化
        }
    }
    
    switch(page) {
        case 'index':
            initIndexPage();
            break;
        case 'login':
            initLoginPage();
            break;
        case 'user':
            initUserPage();
            break;
        case 'repayment':
            initRepaymentPage();
            break;
        case 'profile':
            initProfilePage();
            break;
        case 'contract':
            initContractPage();
            break;
        case 'repay_confirm':
            initRepayConfirmPage();
            break;
        case 'jieqing':
            initJieqingPage();
            break;
        case 'userinfo':
            initUserinfoPage();
            break;
        case 'chatlink':
            initChatlinkPage();
            break;
    }
}

/**
 * 首页初始化
 */
function initIndexPage() {
    // 初始化轮播消息
    initMarquee();
    
    // 登录按钮直接跳转，无需确认
    var loginBtn = document.querySelector('.login-button');
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            // 直接跳转，无需确认
            window.location.href = 'login.php';
        });
    }
}

/**
 * 登录页初始化
 */
function initLoginPage() {
    // 初始化验证码发送
    var getCodeBtn = document.querySelector('.get-code');
    if (getCodeBtn) {
        getCodeBtn.addEventListener('click', sendVerificationCode);
    }
    
    // 初始化登录表单提交
    var loginForm = document.querySelector('.login-btn');
    if (loginForm) {
        loginForm.addEventListener('click', submitLogin);
    }
}

/**
 * 用户中心页初始化
 */
function initUserPage() {
    // 移除菜单点击拦截逻辑，让HTML中的onclick直接执行
    // 这样可以确保所有菜单项（包括客服）都能正常跳转
}

/**
 * 还款页初始化
 */
function initRepaymentPage() {
    // 初始化还款按钮
    var repayBtn = document.getElementById('main-action');
    if (repayBtn) {
        repayBtn.addEventListener('click', function() {
            // 直接跳转到还款确认页面
            window.location.href = 'repay_confirm.php';
        });
    }
    
    // 初始化文件上传
    var fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    var uploadBtn = document.querySelector('.upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', uploadImages);
    }
}

/**
 * 个人中心页初始化
 */
function initProfilePage() {
    // 初始化退出登录
    var logoutBtn = document.querySelector('.menu-item:last-child');
    if (logoutBtn) {
        // 若已在HTML上通过 onclick 绑定了 logout()，则不重复绑定
        if (!logoutBtn.getAttribute('onclick') && !logoutBtn.getAttribute('data-logout-bound')) {
            logoutBtn.setAttribute('data-logout-bound', '1');
            logoutBtn.addEventListener('click', function() {
                doubleConfirmLogout(function() {
                    // 先请求后端注销会话，再清理本地并跳转
                    fetch('api/logout.php', {
                        method: 'POST',
                        credentials: 'same-origin'
                    })
                    .catch(function() { /* 忽略网络错误，保障本地退出 */ })
                    .finally(function() {
                        clearUserLogin();
                        window.location.href = 'login.php';
                    });
                });
            });
        }
    }
}

/**
 * 合同页初始化
 */
function initContractPage() {
    // 合同页面通常不需要特殊初始化
}

/**
 * 还款确认页初始化
 */
function initRepayConfirmPage() {
    // 初始化复制功能
    var copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', copyCardNumber);
    }
}

/**
 * 结清证明页初始化
 */
function initJieqingPage() {
    // 结清证明页面通常不需要特殊初始化
}

/**
 * 用户资料页初始化
 */
function initUserinfoPage() {
    // 用户资料页面通常不需要特殊初始化
}

/**
 * 客服页初始化
 */
function initChatlinkPage() {
    // 客服页面已迁移到 chatlink.html，此函数保留用于兼容性
}

/**
 * 初始化轮播消息
 */
function initMarquee() {
    var marquee = document.getElementById('marquee');
    if (!marquee) return;
    
    var messages = [
        '07-07 用户尾号4826 成功申请服务 78800元',
        '07-07 用户尾号1234 成功申请服务 50000元',
        '07-07 用户尾号5678 成功申请服务 30000元'
    ];
    
    var index = 0;
    
    function updateMarquee() {
        marquee.textContent = messages[index];
        index = (index + 1) % messages.length;
    }
    
    updateMarquee();
    setInterval(updateMarquee, 3000);
}

/**
 * 启动倒计时
 */
function startCountdown(button) {
    var countdown = 60;
    var timer = null;
    
    button.disabled = true;
    button.textContent = countdown + ' 秒后重试';
    timer = setInterval(function() {
        countdown--;
        if (countdown <= 0) {
            clearInterval(timer);
            button.disabled = false;
            button.textContent = '获取验证码';
            countdown = 60;
        } else {
            button.textContent = countdown + ' 秒后重试';
        }
    }, 1000);
}

/**
 * 发送验证码
 */
function sendVerificationCode() {
    var phone = document.querySelector('input[name="phone"]').value.trim();
    if (!/^1\d{10}$/.test(phone)) {
        alert('请输入有效手机号');
        return;
    }
    
    // 检查按钮是否被禁用（催收员工号模式）
    var getCodeBtn = document.querySelector('.get-code');
    if (getCodeBtn && getCodeBtn.disabled) {
        layer.msg('催收员工号模式不支持短信验证码，请使用通用验证码');
        return;
    }
    
    // 调用发送验证码API
    // 根据当前路径确定API地址
    var apiUrl = 'api/send_code.php';
    // 如果当前路径是根目录，使用绝对路径
    if (window.location.pathname === '/' || window.location.pathname === '/index.php') {
        apiUrl = '/api/send_code.php';
    }
    
    console.log('发送验证码 - 手机号:', phone);
    console.log('API地址:', apiUrl);
    
    fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'phone=' + encodeURIComponent(phone)
    })
    .then(function(response) { 
        console.log('响应状态:', response.status, response.statusText);
        if (!response.ok) {
            throw new Error('HTTP错误: ' + response.status);
        }
        return response.json(); 
    })
    .then(function(data) {
        console.log('响应数据:', data);
        if (data.code === 200) {
            layer.msg('验证码发送成功');
            // 启动倒计时
            startCountdown(document.querySelector('.get-code'));
        } else {
            layer.msg(data.msg || '发送失败');
        }
    })
    .catch(function(error) {
        console.error('发送验证码失败:', error);
        alert('发送失败，请重试: ' + error.message);
    });
}

/**
 * 提交登录
 */
function submitLogin() {
    var phone = document.querySelector('input[name="phone"]').value.trim();
    var code = document.querySelector('input[name="code"]').value.trim();
    
    if (!/^1\d{10}$/.test(phone)) {
        alert('请输入有效的11位手机号');
        return;
    }
    if (!/^\d{4,6}$/.test(code)) {
        alert('请输入有效验证码');
        return;
    }
    
    // 调用登录API
    fetch('api/check_login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'phone=' + encodeURIComponent(phone) + '&code=' + encodeURIComponent(code)
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.code === 200) {
            // 保存用户信息到localStorage
            localStorage.setItem('userInfo', JSON.stringify(data.data));
            
            // 登录成功后直接跳转到用户中心
            window.location.href = 'user.php';
        } else {
            alert(data.msg || '登录失败');
        }
    })
    .catch(function(error) {
        alert('登录失败，请重试');
    });
}

/**
 * 处理文件选择
 */
function handleFileSelect(event) {
    var files = event.target.files;
    var previewBox = document.getElementById('previewBox');
    
    if (previewBox) {
        previewBox.innerHTML = '';
        
        if (files.length > 0) {
            previewBox.classList.add('has-images');
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                var img = document.createElement('img');
                img.src = URL.createObjectURL(file);
                img.onload = function() { URL.revokeObjectURL(this.src); };
                previewBox.appendChild(img);
            }
        } else {
            previewBox.classList.remove('has-images');
        }
    }
}

/**
 * 上传图片
 */
function uploadImages() {
    var files = document.getElementById('fileInput').files;
    if (!files.length) {
        alert('请先选择图片');
        return;
    }
    
    // 获取当前登录用户的手机号
    var userInfo = getCurrentUser();
    if (!userInfo || !userInfo.phone) {
        alert('请先登录');
        return;
    }
    
    var formData = new FormData();
    formData.append('phone', userInfo.phone); // 添加手机号参数
    for (var i = 0; i < files.length; i++) {
        formData.append('files[]', files[i]); // 修正字段名
    }
    
    var resultBox = document.getElementById('uploadResult');
    resultBox.innerText = '上传中...';
    resultBox.className = 'upload-status info';
    
    fetch('api/upload_receipts.php', {
        method: 'POST',
        body: formData
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
        if (data.code === 200) {
            resultBox.innerText = '上传成功，共 ' + data.urls.length + ' 张图片';
            resultBox.className = 'upload-status success';
        } else {
            resultBox.innerText = data.msg || '上传失败';
            resultBox.className = 'upload-status error';
        }
    })
    .catch(function(error) {
        resultBox.innerText = '上传失败，请重试';
        resultBox.className = 'upload-status error';
    });
}

/**
 * 复制卡号
 */
function copyCardNumber() {
    var cardNumber = document.getElementById('card-number');
    if (cardNumber) {
        // 使用兼容性剪贴板API
        if (window.CompatibleClipboard) {
            window.CompatibleClipboard.copyText(cardNumber.innerText, function(success) {
                if (success) {
                    alert('卡号已复制到剪贴板');
                } else {
                    alert('复制失败，请手动复制');
                }
            });
        } else {
            // 降级到传统方法
            var textArea = document.createElement('textarea');
            textArea.value = cardNumber.innerText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
                var successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    alert('卡号已复制到剪贴板');
                } else {
                    alert('复制失败，请手动复制');
                }
            } catch (err) {
                document.body.removeChild(textArea);
                alert('复制失败，请手动复制');
            }
        }
    }
}


/**
 * 显示错误信息
 */
function showErrorMessage(message) {
    var errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#ff4d4f;color:white;padding:10px 20px;border-radius:5px;z-index:9999;';
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(function() {
        document.body.removeChild(errorDiv);
    }, 3000);
}

// 页面加载完成后自动初始化
document.addEventListener('DOMContentLoaded', function() {
});
