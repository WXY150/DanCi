# DanCi 单词本 - 快速启动指南

## 🚀 5 分钟快速启动

### 步骤 1：配置环境变量

```bash
# Windows PowerShell
copy .env.example .env
```

编辑 `.env` 文件，设置 MySQL 密码：
```env
MYSQL_PASSWORD=your_mysql_password
```

### 步骤 2：启动服务

```bash
npm start
```

### 步骤 3：访问应用

打开浏览器访问：

| 功能 | 地址 | 说明 |
|------|------|------|
| 📚 **学习端** | http://127.0.0.1:4173/ | 开始学习单词 |
| 🔐 **管理员登录** | http://127.0.0.1:4173/login.html | 管理后台入口 |

**默认管理员账号：**
- 用户名：`admin`
- 密码：`admin123`

⚠️ 首次登录后请立即修改密码！

---

## 📋 功能概览

### 用户学习端功能
✅ 每日学习任务和进度跟踪  
✅ 主动回忆 + 艾宾浩斯复习  
✅ 错题本和错题复习  
✅ 词根词缀串记（26个词根）  
✅ 形近词对照（22组）  
✅ 多级回忆线索（3级提示）  
✅ 5分钟速刷模式  
✅ 听音拼写训练  
✅ 学习统计和连续打卡  

### 管理员后台功能
✅ 词库管理（查看、搜索）  
✅ AI 图片批量生成（5/10/20个/批）  
✅ 单词图片重新生成  
✅ 数据统计和监控  
✅ 系统状态检查  

---

## 🎯 常见问题

### Q1: 数据库连接失败？
**A:** 检查以下内容：
1. MySQL 是否已启动
2. `.env` 中的密码是否正确
3. 数据库端口是否为 3306

### Q2: 如何添加新单词？
**A:** 目前需要直接操作数据库或修改 `data/word2-words.js` 文件。后续版本将在管理后台添加词库导入功能。

### Q3: AI 图片生成不可用？
**A:** 需要在 `.env` 中配置 OpenAI API Key：
```env
OPENAI_API_KEY=your_api_key
OPENAI_BASE_URL=https://api.openai.com/v1
```

### Q4: 如何创建新的管理员账户？
**A:** 登录管理后台后，未来版本会提供用户管理界面。当前可以使用 API：
```bash
curl -X POST http://127.0.0.1:4173/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"username":"newadmin","password":"password123","role":"admin"}'
```

---

## 📞 技术支持

遇到问题？
1. 检查 `npm run check` 是否通过
2. 查看服务器日志输出
3. 检查浏览器控制台错误信息

---

## 🎉 开始学习

访问 http://127.0.0.1:4173/ 开始你的单词学习之旅！
