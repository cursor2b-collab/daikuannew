# 数据库建表说明

## 通过 MCP 在服务器上已执行

在服务器 **107.148.130.223** 上已完成：

1. 安装 PostgreSQL 12
2. 创建数据库 `daikuan`
3. 执行 `init_tables.sql`，创建以下表及索引：

| 表名 | 说明 |
|------|------|
| **users** | 用户表（姓名、手机、贷款信息、逾期、收款方式等） |
| **system_settings** | 系统设置（setting_key 唯一，含客服链接、收款方式、Telegram、短信宝、短信模板等） |
| **verification_codes** | 验证码表（phone、code、used、expires_at、user_id 外键） |
| **admin_users** | 管理员表（UUID、username 唯一、password MD5、status） |

4. 已插入默认管理员：**用户名 `admin`，密码 `123456`**（仅当不存在时插入）。

## 应用连接本机 PostgreSQL 时

当前项目默认使用 **Supabase 云**（见 `.env.local`）。若改为使用本服务器上的 PostgreSQL：

- 在服务器上开放 5432 端口（仅内网或 VPN 时更安全）。
- 连接串示例：`postgresql://daikuan_app:daikuan_app_change_me@107.148.130.223:5432/daikuan`
- 请在服务器上执行 `ALTER USER daikuan_app WITH PASSWORD '你的强密码';` 修改密码。
- Supabase JS 客户端主要面向 Supabase 云；连自建 Postgres 需使用 Supabase 自托管或直接使用 `pg` 等驱动并改项目数据访问层。

## 在 Supabase 云上建表

若继续使用 Supabase 云，可在 Supabase 控制台 → SQL Editor 中粘贴并执行 `init_tables.sql` 内容（注意：Supabase 已有 `pgcrypto`，若报错可去掉 `CREATE EXTENSION IF NOT EXISTS "pgcrypto";` 或保留亦可）。

## 建表脚本位置

- `scripts/init_tables.sql`：完整建表 + 索引 + 可选默认管理员注释。
