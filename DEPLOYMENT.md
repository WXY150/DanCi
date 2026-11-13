# DanCi 单词本 - 生产环境部署清单

## ✅ 部署前检查清单

### 1. 安全配置

- [ ] **修改默认管理员密码**
  ```bash
  # 登录管理后台后立即修改
  # 访问: http://your-domain.com/login.html
  # 用户名: admin, 密码: admin123 (仅首次)
  ```

- [ ] **配置环境变量**
  ```bash
  # 生产环境 .env 配置
  PORT=4173
  MYSQL_HOST=your_mysql_host
  MYSQL_PORT=3306
  MYSQL_USER=danci_user  # 建议创建专用数据库用户
  MYSQL_PASSWORD=strong_password_here  # 使用强密码
  MYSQL_DATABASE=danci
  DB_REQUIRED=true
  
  # AI 图片生成（可选）
  OPENAI_API_KEY=your_production_key
  OPENAI_BASE_URL=https://api.openai.com/v1
  TEXT_MODEL=gpt-4
  IMAGE_MODEL=dall-e-3
  ```

- [ ] **启用 HTTPS**
  - 获取 SSL 证书（Let's Encrypt 或商业证书）
  - 配置 Nginx/Apache 反向代理
  - 强制 HTTP 跳转到 HTTPS
  - 启用 HSTS (HTTP Strict Transport Security)

- [ ] **配置 CORS（如需要）**
  - 在 `server/index.js` 中添加 CORS 白名单
  - 仅允许信任的域名访问 API

- [ ] **实施 Rate Limiting**
  ```javascript
  // 建议安装 express-rate-limit
  npm install express-rate-limit
  
  // 示例配置（防止暴力破解）
  const rateLimit = require('express-rate-limit');
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 5, // 最多5次尝试
    message: '登录尝试次数过多，请15分钟后再试'
  });
  ```

### 2. 数据库优化

- [ ] **创建专用数据库用户**
  ```sql
  CREATE USER 'danci_user'@'localhost' IDENTIFIED BY 'strong_password';
  GRANT SELECT, INSERT, UPDATE, DELETE ON danci.* TO 'danci_user'@'localhost';
  FLUSH PRIVILEGES;
  ```

- [ ] **数据库备份策略**
  ```bash
  # 每日自动备份
  0 2 * * * mysqldump -u danci_user -p danci > /backup/danci_$(date +\%Y\%m\%d).sql
  ```

- [ ] **优化数据库索引**
  - `users.username` 已有索引
  - `sessions.token` 已有索引
  - `sessions.expires_at` 已有索引
  - 根据查询需求添加其他索引

### 3. 服务器配置

- [ ] **配置进程管理器（PM2）**
  ```bash
  npm install -g pm2
  pm2 start server/index.js --name danci
  pm2 startup  # 开机自启动
  pm2 save
  ```

- [ ] **配置 Nginx 反向代理**
  ```nginx
  server {
      listen 443 ssl http2;
      server_name your-domain.com;
      
      ssl_certificate /path/to/cert.pem;
      ssl_certificate_key /path/to/key.pem;
      
      location / {
          proxy_pass http://127.0.0.1:4173;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
      
      # 管理后台 IP 白名单（可选）
      location /admin.html {
          allow 192.168.1.0/24;  # 允许内网访问
          deny all;
          proxy_pass http://127.0.0.1:4173;
      }
  }
  
  server {
      listen 80;
      server_name your-domain.com;
      return 301 https://$server_name$request_uri;
  }
  ```

- [ ] **配置防火墙**
  ```bash
  # 仅开放必要端口
  ufw allow 22/tcp    # SSH
  ufw allow 80/tcp    # HTTP
  ufw allow 443/tcp   # HTTPS
  ufw deny 4173/tcp   # 禁止直接访问Node.js端口
  ufw enable
  ```

### 4. 监控和日志

- [ ] **配置日志管理**
  ```javascript
  // 使用 winston 或 pino 记录日志
  // 记录登录尝试、错误、管理员操作
  ```

- [ ] **设置监控告警**
  - 服务器 CPU/内存使用率
  - 数据库连接数
  - API 响应时间
  - 错误率统计

- [ ] **定期审计日志**
  - 检查异常登录尝试
  - 审查管理员操作记录
  - 监控 API 使用情况

### 5. 性能优化

- [ ] **启用 Gzip 压缩**
  ```javascript
  // 在 Nginx 中配置
  gzip on;
  gzip_types text/plain text/css application/json application/javascript;
  ```

- [ ] **配置静态资源缓存**
  ```nginx
  location ~* \.(jpg|jpeg|png|gif|css|js)$ {
      expires 30d;
      add_header Cache-Control "public, immutable";
  }
  ```

- [ ] **优化会话清理**
  - 确认会话清理定时任务正常运行
  - 根据负载调整清理频率

### 6. 安全加固

- [ ] **修改会话过期时间（可选）**
  ```javascript
  // server/auth.js
  const SESSION_DURATION = 2 * 60 * 60 * 1000; // 改为2小时
  ```

- [ ] **启用内容安全策略 (CSP)**
  ```javascript
  // 添加响应头
  response.setHeader('Content-Security-Policy', 
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'");
  ```

- [ ] **禁用不必要的HTTP方法**
  ```nginx
  if ($request_method !~ ^(GET|POST|HEAD)$ ) {
      return 405;
  }
  ```

- [ ] **定期更新依赖**
  ```bash
  npm audit
  npm audit fix
  npm outdated
  ```

### 7. 备份和恢复

- [ ] **配置自动备份**
  - 数据库备份（每日）
  - 配置文件备份
  - 用户上传内容备份

- [ ] **测试恢复流程**
  - 验证备份文件完整性
  - 在测试环境验证恢复流程

### 8. 文档和培训

- [ ] **准备运维文档**
  - 服务启动/停止流程
  - 故障排查指南
  - 紧急联系方式

- [ ] **管理员培训**
  - 管理后台使用说明
  - 安全最佳实践
  - 应急响应流程

---

## 🚀 快速部署脚本

```bash
#!/bin/bash
# DanCi 生产环境部署脚本

echo "🚀 开始部署 DanCi 单词本..."

# 1. 安装依赖
npm install --production

# 2. 运行语法检查
npm run check

# 3. 运行测试
npm test

# 4. 创建日志目录
mkdir -p logs

# 5. 使用 PM2 启动
pm2 delete danci 2>/dev/null || true
pm2 start server/index.js --name danci \
  --log logs/danci.log \
  --error logs/danci-error.log

# 6. 保存 PM2 配置
pm2 save

# 7. 配置开机自启
pm2 startup

echo "✅ 部署完成！"
echo "📊 查看日志: pm2 logs danci"
echo "🔍 查看状态: pm2 status"
echo "🌐 访问地址: https://your-domain.com"
```

---

## 🔥 应急响应

### 服务停止
```bash
pm2 stop danci
```

### 服务重启
```bash
pm2 restart danci
```

### 查看日志
```bash
pm2 logs danci
tail -f logs/danci-error.log
```

### 回滚部署
```bash
# 恢复上一个版本
git checkout previous-version
npm install
pm2 restart danci
```

### 数据库恢复
```bash
# 从备份恢复
mysql -u root -p danci < /backup/danci_20260923.sql
```

---

## 📞 技术支持

如遇问题，请提供以下信息：
1. 错误日志 (`pm2 logs danci`)
2. 系统环境 (Node版本、MySQL版本)
3. 浏览器控制台错误信息
4. 详细的复现步骤

---

**部署负责人**: _______________  
**部署日期**: _______________  
**审核人**: _______________
