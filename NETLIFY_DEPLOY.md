# Netlify 部署说明 · daikuannew

## 一、部署步骤

### 1. 连接仓库

1. 登录 [Netlify](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. 选择 Git 提供商（GitHub / GitLab / Bitbucket），授权并选择本项目的仓库
4. 分支选择 `main`（或你的默认分支）

### 2. 构建配置（可选）

若使用项目根目录的 `netlify.toml`，Netlify 会自动读取，一般无需在界面再填：

- **Build command**: `npm run build`（与 netlify.toml 一致）
- **Publish directory**: 留空或由 Netlify 自动处理（Next.js 使用 OpenNext 适配）
- **Base directory**: 留空（项目在仓库根目录时）

### 3. 环境变量

在 **Site settings** → **Environment variables** 中新增以下变量（按需填写）。

---

## 二、环境变量清单

在 Netlify 后台 **Environment variables** 中添加以下变量（值请替换为实际配置）。

### 必填（前端 + 接口）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase 匿名公钥（anon key） | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

### 可选（仅在 Netlify 配置）

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `CAPTCHA_SECRET` | 图形验证码签发/校验密钥，生产环境务必设置 | 随机长字符串（如 32 位） |

**说明：**

- **Telegram（登录通知）**、**短信宝（验证码）**、**短信模板** 等均在 **管理后台「系统设置」** 中配置，无需在 Netlify 环境变量里填写。
- 部署完成后登录管理后台，在「系统设置」相应标签页中设置即可。

### 复制用（Netlify 环境变量）

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
CAPTCHA_SECRET=
```

---

## 三、部署后检查

1. **Build 成功**：在 **Deploys** 中查看构建日志，确认 `npm run build` 无报错。
2. **前端**：访问分配的子域名（如 `https://xxx.netlify.app`），确认首页、登录、管理后台可打开。
3. **接口**：登录、验证码、管理后台保存配置等接口可正常使用。
4. **环境变量**：确认敏感信息未写进代码，仅在 Netlify 的 Environment variables 中配置。

---

## 四、常用操作

- **重新部署**：Deploys → **Trigger deploy** → **Deploy site**
- **查看构建日志**：Deploys → 某次部署 → **Build log**
- **修改环境变量**：Site settings → Environment variables → 编辑后需重新部署一次才会生效
