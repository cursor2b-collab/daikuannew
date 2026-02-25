# Vercel 部署指南

## 部署步骤

### 方法一：通过 Vercel CLI 部署（推荐）

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署项目**
   ```bash
   cd "C:\Users\alex\Downloads\a_817322_cn_1765354210142"
   vercel
   ```

4. **生产环境部署**
   ```bash
   vercel --prod
   ```

### 方法二：通过 GitHub 部署（推荐用于持续部署）

1. **初始化 Git 仓库**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **创建 GitHub 仓库**
   - 访问 https://github.com/new
   - 创建新仓库（例如：`financial-app-nextjs`）

3. **推送到 GitHub**
   ```bash
   git remote add origin https://github.com/你的用户名/financial-app-nextjs.git
   git branch -M main
   git push -u origin main
   ```

4. **在 Vercel 中导入项目**
   - 访问 https://vercel.com/new
   - 点击 "Import Git Repository"
   - 选择你的 GitHub 仓库
   - Vercel 会自动检测 Next.js 项目
   - 点击 "Deploy" 开始部署

### 方法三：通过 Vercel Dashboard 直接上传

1. 访问 https://vercel.com/new
2. 选择 "Upload" 选项
3. 将项目文件夹拖拽到上传区域
4. Vercel 会自动构建和部署

## 部署配置

项目已包含 `vercel.json` 配置文件，包含以下设置：
- **框架**: Next.js（自动检测）
- **构建命令**: `npm run build`
- **安装命令**: `npm install`
- **区域**: 香港（hkg1）

## 环境变量（如需要）

如果项目需要环境变量，可以在 Vercel Dashboard 中设置：
1. 进入项目设置
2. 选择 "Environment Variables"
3. 添加所需的环境变量

## 注意事项

1. **构建优化**: Next.js 会自动优化构建
2. **静态资源**: 所有 `public` 目录下的资源会自动部署
3. **API 路由**: Next.js API 路由会自动作为 Serverless Functions 部署
4. **域名**: Vercel 会自动分配一个域名，也可以绑定自定义域名

## 部署后检查

部署完成后，检查以下内容：
- ✅ 首页是否正常显示
- ✅ 登录功能是否正常
- ✅ API 路由是否正常工作
- ✅ 图片资源是否正常加载
- ✅ 移动端响应式是否正常

## 更新部署

每次推送到 GitHub 的 main 分支，Vercel 会自动重新部署。

## 故障排除

如果部署失败，检查：
1. `package.json` 中的构建脚本是否正确
2. 是否有 TypeScript 错误
3. 是否有缺失的依赖
4. 查看 Vercel 构建日志

