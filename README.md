# SMZDM自动签到脚本

什么值得买（SMZDM）自动签到脚本，支持失败重试和 Telegram 通知。

## 功能特点
- 使用 Cookie 进行身份验证
- 自动执行签到（默认每天早上9点）
- 签到失败自动重试
- Telegram 通知（成功和失败都会通知）
- 详细的日志记录
- PM2 进程管理

## 安装部署
1. 克隆仓库
```bash
git clone https://github.com/yourusername/smzdm-checkin.git
cd smzdm-checkin
```

2. 安装依赖
```bash
npm install
```

3. 配置
复制示例配置文件并修改：
```bash
cp config.example.json config.json
```
修改 `config.json` 中的配置：
- 替换 cookie 为你的实际 cookie
- 配置 Telegram bot token 和 chat ID（可选）

4. 启动
```bash
pm2 start ecosystem.config.js
```

## 配置说明
- `cookie`: SMZDM 的登录 cookie
- `telegram.botToken`: Telegram bot token
- `telegram.chatId`: Telegram chat ID
- `maxRetries`: 最大重试次数
- `retryDelay`: 重试间隔（毫秒）

## 注意事项
1. 请勿提交 `config.json` 到代码库
2. cookie 有效期可能会过期，需要定期更新
3. 建议定期检查日志确保脚本正常运行
