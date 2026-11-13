# DanCi 微信小程序

这是用户学习端的迁移骨架。小程序只调用服务端的认证、词库和进度接口，
不包含 AI provider、数据库凭据，也不提供图片生成、上传、启用或删除操作。

正式环境只配置 HTTPS 服务端 origin，并在微信后台加入合法 request/download
域名。具体接口和验收步骤见仓库根目录 `contracts/api-v1.md` 与
`specs/001-server-wechat-miniapp/quickstart.md`。
