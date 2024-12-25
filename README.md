# 自动签到脚本

自动完成各种网站的签到任务，支持失败重试和 Telegram 通知。

## 支持的网站

### 百度贴吧

自动完成百度贴吧的每日签到，支持以下功能：
- 自动签到所有关注的贴吧
- 通过 Telegram 发送签到结果通知
- 签到失败自动重试（最多 3 次）
- 使用 PM2 管理定时任务（每天早上 8 点运行）

#### 配置说明
1. 获取百度 Cookie:
   - 使用浏览器访问 https://tieba.baidu.com/
   - 登录您的百度账号
   - 按 F12 打开开发者工具
   - 切换到 Network 标签
   - 刷新页面
   - 找到 `json_userinfo` 请求
   - 在请求头中复制 Cookie 的值

2. 在 `config.json` 中配置：
```json
{
    "baidu": {
        "cookie": "YOUR_BAIDU_COOKIE"
    }
}
```

#### 手动运行
```bash
node baidu_checkin.js
```

## 通用配置

### Telegram 通知配置

1. 获取配置信息:
   - 在 Telegram 中找到 @BotFather 创建机器人，获取 botToken
   - 将机器人添加到群组或与机器人私聊
   - 访问 `https://api.telegram.org/bot<YourBOTToken>/getUpdates` 获取 chatId

2. 在 `config.json` 中配置：
```json
{
    "telegram": {
        "botToken": "YOUR_BOT_TOKEN",
        "chatId": "YOUR_CHAT_ID"
    }
}
```

## 安装和运行

1. 安装依赖：
```bash
npm install axios pm2
```

2. 配置文件：
复制 `config.template.json` 为 `config.json` 并填写配置。

3. 启动定时任务：
```bash
# 启动
pm2 start ecosystem.config.js

# 查看任务状态
pm2 list

# 查看日志
pm2 logs

# 停止任务
pm2 stop all

# 删除任务
pm2 delete all
```

## 注意事项

1. 请确保 `config.json` 中的 Cookie 值是最新的，Cookie 可能会定期失效
2. 如果使用 Git，建议将 `config.json` 添加到 `.gitignore` 中
3. 确保服务器时间正确，否则可能影响定时任务的执行
4. 建议定期检查日志确保脚本正常运行

## License

MIT
