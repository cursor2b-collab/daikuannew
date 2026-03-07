# 管理后台使用说明

## 功能概述

管理后台是一个完整的催收系统后台管理系统，包含以下功能：

1. **用户管理** - 管理催收系统的用户数据
2. **验证码管理** - 查看和管理验证码记录
3. **系统设置** - 配置系统基本设置、收款方式、**Telegram 群组登录通知**

## 访问地址

- 管理后台登录页面: `/dkhtadmin/login`
- 管理后台首页: `/dkhtadmin` (自动重定向到用户管理页面)

## 登录信息

- 用户名: `admin`
- 密码: `123456`

## 数据库配置

系统使用 Supabase 作为数据库，配置信息：

```
NEXT_PUBLIC_SUPABASE_URL=https://qojbcfijkinlfymvfvwx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_Fy16nfH8omr46sGvBzisEg_wq3UWtuc
```

请在 `.env.local` 文件中配置这些环境变量（如果还没有配置）。

## 数据库表结构

### 1. users 表（用户表）
存储催收系统的用户数据，包含以下字段：
- id: 主键（自增）
- name: 姓名
- phone: 手机号码
- id_number: 身份证号码
- loan_number: 放款编号
- bank_card: 银行卡号
- amount: 金额
- loan_date: 放款时间
- overdue_days: 逾期天数
- overdue_amount: 逾期金额
- amount_due: 应还金额
- is_settled: 是否结清（布尔值）
- is_interest_free: 是否免息（布尔值）
- voucher_images: 凭证图片URL数组
- payment_method: 收款方式信息（JSON格式）
- created_at: 创建时间
- updated_at: 更新时间

### 2. system_settings 表（系统设置表）
存储系统配置信息：
- id: 主键（自增）
- setting_key: 设置键（唯一）
- setting_value: 设置值（JSON格式）
- created_at: 创建时间
- updated_at: 更新时间

常用键：`customer_service_url`（在线客服链接）、`payment_methods`（收款方式）、`telegram_bot_token`、`telegram_chat_id`（Telegram 登录通知，可选）。

### 3. verification_codes 表（验证码表）
存储验证码记录：
- id: 主键（自增）
- phone: 手机号
- code: 验证码
- used: 是否已使用（布尔值）
- expires_at: 过期时间
- created_at: 创建时间

### 4. admin_users 表（管理员表）
存储管理员账号信息：
- id: 主键（UUID）
- username: 用户名（唯一）
- password: 密码（MD5哈希）
- status: 状态（1=启用，0=禁用）
- login_at: 最后登录时间
- login_num: 登录次数
- created_at: 创建时间
- updated_at: 更新时间

## 功能说明

### 用户管理页面

- **查看用户列表**: 显示所有用户数据，支持分页
- **搜索功能**: 支持按姓名、手机号、放款编号搜索
- **筛选功能**: 支持按是否结清状态筛选
- **新增用户**: 点击"新增"按钮可以添加新用户
- **编辑用户**: 点击"编辑"按钮可以修改用户信息
  - 基本设置标签页：编辑用户基本信息
  - 收款方式标签页：配置用户的收款方式（银行卡信息）
- **删除用户**: 点击"删除"按钮可以删除用户记录
- **查看凭证图片**: 点击"凭证图片"可以查看用户上传的凭证

### 验证码管理页面

- **查看验证码列表**: 显示所有验证码记录
- **搜索功能**: 支持按手机号搜索
- **查看验证码状态**: 显示验证码是否已使用
- **查看过期时间**: 显示验证码的过期时间

### 系统设置页面

- **基本设置标签页**: 在线客服链接等
- **收款方式标签页**: 配置系统默认的收款方式
  - 支持配置多个收款方式（银行卡一、银行卡二）
  - 每个收款方式包含：收款类型、银行卡名称、收款人姓名、银行卡号
- **Telegram 通知标签页**: 用户登录群组通知
  - 配置 **Telegram Bot Token**（在 @BotFather 创建机器人后获得）
  - 配置 **Telegram 群组 Chat ID**（将机器人拉入群组后获得，通常为 `-100xxxxxxxxxx`）
  - 配置后，用户每次登录成功，机器人会向该群组发送一条通知，包含：登录用户姓名、登录手机号、欠款金额、逾期天数
  - 也可使用环境变量 `TELEGRAM_BOT_TOKEN`、`TELEGRAM_CHAT_ID` 覆盖（适合部署在 Vercel/服务器时使用）

## API路由说明

### 管理员相关
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/check_session` - 检查管理员登录状态
- `POST /api/admin/logout` - 管理员退出登录

### 用户管理相关
- `GET /api/admin/users` - 获取用户列表（支持分页和筛选）
- `POST /api/admin/users` - 创建新用户
- `PUT /api/admin/users/[id]` - 更新用户信息
- `DELETE /api/admin/users/[id]` - 删除用户

### 系统设置相关
- `GET /api/admin/settings?key=xxx` - 获取系统设置
- `PUT /api/admin/settings` - 更新系统设置

### 验证码管理相关
- `GET /api/admin/codes` - 获取验证码列表（支持分页和筛选）

## 开始使用

1. **安装依赖**（如果还没有安装）
   ```bash
   npm install
   ```

2. **配置环境变量**
   复制 `.env.example` 为 `.env.local`，并填写：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://qojbcfijkinlfymvfvwx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_Fy16nfH8omr46sGvBzisEg_wq3UWtuc
   ```
   如需用户登录时向 Telegram 群组发通知，可额外配置（也可在管理后台「系统设置 → Telegram 通知」中填写）：
   ```
   TELEGRAM_BOT_TOKEN=你的Bot Token
   TELEGRAM_CHAT_ID=群组Chat ID（如 -1001234567890）
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **访问管理后台**
   打开浏览器访问: http://localhost:3000/dkhtadmin/login
   
   使用以下账号登录：
   - 用户名: `admin`
   - 密码: `123456`

## 注意事项

1. **密码安全**: 当前系统使用MD5哈希存储密码。在生产环境中，建议使用更安全的密码哈希算法（如bcrypt）。

2. **权限控制**: 当前版本所有管理员拥有相同的权限。未来可以扩展角色和权限管理。

3. **数据安全**: 敏感信息（如身份证号、银行卡号）在显示时会进行脱敏处理。

4. **分页限制**: 默认每页显示20条记录，可以在代码中修改。

5. **会话管理**: 管理员登录后，会话信息存储在Cookie中，默认有效期为7天。

## 开发计划

- [ ] 添加数据导出功能（Excel导出）
- [ ] 添加数据导入功能
- [ ] 完善基本设置功能
- [ ] 添加操作日志记录
- [ ] 添加角色和权限管理
- [ ] 优化移动端适配
- [ ] 添加数据统计图表（控制台页面）
