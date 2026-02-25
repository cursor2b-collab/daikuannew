# 快速开始指南

## 安装和运行

1. **安装依赖**
   ```bash
   npm install
   ```

2. **启动开发服务器**
   ```bash
   npm run dev
   ```

3. **访问应用**
   打开浏览器访问: http://localhost:3000

## 测试登录

在开发环境中，可以使用以下方式测试登录：

- **手机号**: 任意11位手机号（格式：1xxxxxxxxxx）
- **验证码**: `1234`（开发环境固定验证码）

## 项目结构说明

### 主要目录

- `app/` - Next.js App Router 目录
  - `page.tsx` - 首页
  - `login/` - 登录页面
  - `user/` - 用户中心
  - `api/` - API 路由（替代原 PHP API）
  
- `components/` - React 组件
  - `FooterNav.tsx` - 底部导航栏
  - `LoadingOverlay.tsx` - 加载动画

- `lib/` - 工具函数
  - `api.ts` - API 调用函数

- `public/resources/images/` - 图片资源

## 主要改动

1. **从 PHP/HTML 转换为 React/Next.js**
   - 所有页面都转换为 React 组件
   - 使用 Next.js App Router 进行路由管理

2. **API 路由**
   - 原 PHP API (`getData.php`, `check_login.php` 等) 转换为 Next.js API 路由
   - 位于 `app/api/` 目录下

3. **状态管理**
   - 使用 React Hooks (`useState`, `useEffect`) 管理组件状态
   - 使用 localStorage 存储用户登录信息（客户端）
   - 使用 Cookie 管理会话（服务端）

4. **样式**
   - 保留了原有的 CSS 样式
   - 使用全局 CSS 文件 (`app/globals.css`)
   - 图标使用 Emoji 字符替代（可后续替换为图标库）

## 下一步

1. **连接数据库**: 修改 API 路由，连接真实的数据库
2. **集成短信服务**: 实现真实的短信验证码发送功能
3. **完善页面内容**: 补充用户中心、还款等页面的具体功能
4. **添加错误处理**: 完善错误处理和用户提示
5. **优化性能**: 添加代码分割、图片优化等

## 注意事项

- 当前 API 返回的是模拟数据，需要连接真实数据库
- 验证码功能在开发环境使用固定值，生产环境需要集成短信服务
- 图片资源已复制到 `public` 目录，可以直接使用
- 建议在生产环境使用环境变量管理敏感配置

