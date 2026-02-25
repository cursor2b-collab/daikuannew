/**
 * 兼容性检测和降级处理
 * 支持旧版本浏览器和移动端
 */

// 检测浏览器兼容性
var Compatibility = {
    // 检测是否支持现代特性
    hasFetch: typeof fetch !== 'undefined',
    hasClipboard: typeof navigator !== 'undefined' && navigator.clipboard,
    hasLocalStorage: typeof localStorage !== 'undefined',
    hasPromise: typeof Promise !== 'undefined',
    hasFlexbox: false,
    hasTransform: false,
    hasTransition: false,
    
    // 初始化检测
    init: function() {
        this.detectFlexbox();
        this.detectTransform();
        this.detectTransition();
        this.addCompatibilityClasses();
    },
    
    // 检测Flexbox支持
    detectFlexbox: function() {
        var testElement = document.createElement('div');
        testElement.style.display = 'flex';
        this.hasFlexbox = testElement.style.display === 'flex';
    },
    
    // 检测Transform支持
    detectTransform: function() {
        var testElement = document.createElement('div');
        var prefixes = ['transform', 'webkitTransform', 'mozTransform', 'msTransform'];
        for (var i = 0; i < prefixes.length; i++) {
            if (testElement.style[prefixes[i]] !== undefined) {
                this.hasTransform = true;
                break;
            }
        }
    },
    
    // 检测Transition支持
    detectTransition: function() {
        var testElement = document.createElement('div');
        var prefixes = ['transition', 'webkitTransition', 'mozTransition', 'msTransition'];
        for (var i = 0; i < prefixes.length; i++) {
            if (testElement.style[prefixes[i]] !== undefined) {
                this.hasTransition = true;
                break;
            }
        }
    },
    
    // 添加兼容性类名
    addCompatibilityClasses: function() {
        var html = document.documentElement;
        
        if (!this.hasFlexbox) {
            html.className += ' no-flexbox';
        }
        
        if (!this.hasTransform) {
            html.className += ' no-transform';
        }
        
        if (!this.hasTransition) {
            html.className += ' no-transition';
        }
        
        // 检测移动端
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
            html.className += ' mobile';
        }
        
        // 检测iOS
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            html.className += ' ios';
        }
        
        // 检测Android
        if (/Android/.test(navigator.userAgent)) {
            html.className += ' android';
        }
    }
};

// 兼容性AJAX请求函数
var CompatibleAjax = {
    // 统一的AJAX请求方法
    request: function(url, options) {
        options = options || {};
        
        if (this.hasFetch && options.method !== 'GET') {
            return this.fetchRequest(url, options);
        } else {
            return this.xhrRequest(url, options);
        }
    },
    
    // Fetch请求（现代浏览器）
    fetchRequest: function(url, options) {
        if (!this.hasFetch) {
            return this.xhrRequest(url, options);
        }
        
        var fetchOptions = {
            method: options.method || 'GET',
            headers: options.headers || {}
        };
        
        if (options.data) {
            if (options.method === 'POST') {
                fetchOptions.body = options.data;
            }
        }
        
        return fetch(url, fetchOptions)
            .then(function(response) {
                return response.json();
            })
            .catch(function(error) {
                throw error;
            });
    },
    
    // XMLHttpRequest请求（兼容旧浏览器）
    xhrRequest: function(url, options) {
        return new Promise(function(resolve, reject) {
            var xhr = new XMLHttpRequest();
            xhr.open(options.method || 'GET', url, true);
            
            // 设置请求头
            if (options.headers) {
                for (var key in options.headers) {
                    xhr.setRequestHeader(key, options.headers[key]);
                }
            }
            
            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        try {
                            var data = JSON.parse(xhr.responseText);
                            resolve(data);
                        } catch (e) {
                            reject(new Error('JSON解析失败'));
                        }
                    } else {
                        reject(new Error('请求失败: ' + xhr.status));
                    }
                }
            };
            
            xhr.onerror = function() {
                reject(new Error('网络错误'));
            };
            
            if (options.data) {
                xhr.send(options.data);
            } else {
                xhr.send();
            }
        });
    }
};

// 兼容性剪贴板操作
var CompatibleClipboard = {
    // 复制文本到剪贴板
    copyText: function(text, callback) {
        if (Compatibility.hasClipboard && window.isSecureContext) {
            // 使用现代Clipboard API
            navigator.clipboard.writeText(text)
                .then(function() {
                    if (callback) callback(true);
                })
                .catch(function() {
                    CompatibleClipboard.fallbackCopy(text, callback);
                });
        } else {
            // 降级到传统方法
            CompatibleClipboard.fallbackCopy(text, callback);
        }
    },
    
    // 降级复制方法
    fallbackCopy: function(text, callback) {
        var textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            var successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (callback) callback(successful);
        } catch (err) {
            document.body.removeChild(textArea);
            if (callback) callback(false);
        }
    }
};

// 移动端触摸优化
var TouchOptimization = {
    // 防止双击缩放
    preventDoubleZoom: function() {
        var lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            var now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
    },
    
    // 优化滚动
    optimizeScroll: function() {
        // 添加触摸滚动优化
        document.body.style.webkitOverflowScrolling = 'touch';
        document.body.style.overflowScrolling = 'touch';
    },
    
    // 初始化触摸优化
    init: function() {
        this.preventDoubleZoom();
        this.optimizeScroll();
    }
};

// 页面加载完成后初始化兼容性检测
document.addEventListener('DOMContentLoaded', function() {
    Compatibility.init();
    TouchOptimization.init();
});

// 导出到全局作用域
window.Compatibility = Compatibility;
window.CompatibleAjax = CompatibleAjax;
window.CompatibleClipboard = CompatibleClipboard;
window.TouchOptimization = TouchOptimization;
