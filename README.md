# 单词本 - AI 驱动的考研英语学习应用

这是一个完整的前后端分离应用，包含用户学习端和管理员后台系统。词库由 Node.js 后端提供，支持 MySQL 存储；学习进度保存在浏览器中。

## 🌟 核心特性

### 用户学习端
- ✅ **主动回忆学习法** - 先回忆再查看答案
- ✅ **智能复习算法** - 基于艾宾浩斯遗忘曲线
- ✅ **错题本系统** - 连续答对3次才算掌握
- ✅ **词根词缀串记** - 26个常用词根
- ✅ **形近词对照** - 22组易混词
- ✅ **多级回忆线索** - 首字母→音标→图片
- ✅ **5分钟速刷** - 快速复习重点词
- ✅ **听音拼写模式** - 训练音形对应
- ✅ **学习统计打卡** - 连续天数、成长曲线

### 管理员后台
- ✅ **词库管理** - 查看、搜索单词
- ✅ **AI 图片生成** - 批量生成联想图
- ✅ **数据统计** - 系统状态监控
- ✅ **权限控制** - 基于角色的访问控制

## 🚀 快速启动

首次运行先安装依赖并复制环境变量模板：

```bash
npm install
copy .env.example .env
```

在 `.env` 中填写 MySQL 密码：

```env
MYSQL_PASSWORD=your_mysql_password
```

若要使用 AI 图片生成功能，还需填写：

```env
OPENAI_API_KEY=your_openai_compatible_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
```

启动服务：

```bash
npm start
```

## 访问入口

| 功能 | 地址 | 说明 |
|------|------|------|
| 📚 学习端 | http://127.0.0.1:4173/ | 单词学习应用 |
| 🔐 管理员登录 | http://127.0.0.1:4173/login.html | 管理后台入口 |

**默认管理员账号：**
- 用户名：`admin`
- 密码：`admin123`
- ⚠️ **首次登录后请立即修改密码！**

服务启动时会自动创建 `danci` 数据库、`users`、`sessions`、`words`、`user_progress`、`word_images` 表，并导入 114 个图片演示词。

## 📊 词库信息

- **总词数**: 5528个（NETEM考研词库）
- **演示词**: 114个带图单词
- **词根库**: 26个常用词根
- **形近词**: 22组易混词

**数据来源：** NETEM 数据采用 CC BY-NC-SA 4.0 协议，仅用于非商业 Demo。

## 🧪 检查和测试

```bash
npm test        # 运行功能测试
npm run check   # 语法检查
```

## 📂 项目结构

```text
DanCi/
├── apps/
│   ├── user-h5/           # H5 用户端兼容实现：页面、学习服务、词库和图片
│   ├── auth-web/          # 登录/注册入口（H5 与管理员共用）
│   ├── admin-web/         # 管理员 Web：词库、用户和 AI 图片审核
│   └── miniapp/           # 微信小程序用户端：API 服务层和页面骨架
├── server/                # 服务端：HTTP API、认证、MySQL、AI 生图和运行时图片
├── packages/              # 可复用规则（当前为学习规则迁移副本）
├── contracts/             # API 契约
├── tests/                 # 契约和自动化检查
├── tools/                 # 开发/验证脚本
├── ops/                   # 备份和回滚脚本
├── docs/                  # 产品需求和项目文档
├── specs/                 # Spec Kit 规格、计划、任务和契约
└── .specify/              # Spec Kit 工作流、模板和项目章程
```

服务启动时会把 `/` 映射到 `apps/user-h5/`，把 `/login.html` 映射到
`apps/auth-web/`，把 `/admin.html` 映射到 `apps/admin-web/`；这些是兼容入口，
服务端真实代码只在 `server/`，微信小程序代码只在 `apps/miniapp/`。

## 📖 项目文档

- [快速启动指南](QUICK_START.md) - 5分钟快速上手
- [需求文档](docs/requirements.md) - 产品定位、MVP范围
- [计划任务](docs/project-plan.md) - 开发计划和任务

## 🔐 安全说明

**生产环境部署前必须：**
1. ✅ 修改默认管理员密码
2. ✅ 配置 HTTPS（SSL证书）
3. ✅ 启用 Rate Limiting
4. ✅ 设置更短的会话过期时间
5. ✅ 配置防火墙规则

## 🎯 技术栈

- **前端**: 原生 JavaScript (ES Module)
- **后端**: Node.js + MySQL
- **认证**: Session + HttpOnly Cookie
- **密码**: crypto.scrypt 加盐哈希
- **AI**: OpenAI 兼容 API（可选）

## 📝 API 文档

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `GET /api/auth/status` - 获取当前用户状态
- `POST /api/auth/register` - 创建新用户（仅管理员）

### 管理员专用
- `POST /api/admin/words/:id/regenerate-image` - 重新生成图片
- `POST /api/admin/words/:id/select-image` - 选择生成的图片
- `POST /api/admin/words/:id/upload-image` - 上传图片
- `GET /api/admin/words/:id/images` - 查看图片历史
- `POST /api/admin/words/:id/images/:imageId/activate` - 启用历史图片
- `POST /api/admin/words/:id/images/:imageId/delete` - 删除历史图片

### 公开接口
- `GET /api/words` - 获取词库
- `GET /api/health` - 健康检查

用户端只通过 `GET /api/words` 读取词条和当前图片地址，不提供 AI 生图、上传或图片切换能力；AI 生图及图片审核统一在管理员后台完成。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

本项目采用 MIT 许可证。

---

**版本**: 2.0.0  
**更新日期**: 2026-09-23  
**维护者**: DanCi Team
