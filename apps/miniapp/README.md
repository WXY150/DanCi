# DanCi 微信小程序

这是用户学习端的迁移骨架。小程序只调用服务端的认证、词库和进度接口，
不包含 AI provider、数据库凭据，也不提供图片生成、上传、启用或删除操作。

本地开发者工具预览使用 `http://127.0.0.1:4173`，并由
`project.config.json` 关闭开发工具的域名校验。正式环境必须配置 HTTPS
服务端 origin，并在微信后台加入合法 request/download 域名。真实微信登录
还需要自己的小程序 AppID、AppSecret 和服务端环境变量。接口和验收步骤见 `contracts/api-v1.md` 与
`specs/001-server-wechat-miniapp/quickstart.md`。
