# 百度贴吧自动签到脚本

自动完成百度贴吧的每日签到，支持 Telegram 通知和失败重试。

## 功能特点

- 自动签到所有关注的贴吧
- 通过 Telegram 发送签到结果通知
- 签到失败自动重试（最多 3 次）
- 使用 PM2 管理定时任务

## 使用方法

1. 安装依赖：
```bash
npm install axios pm2
```

2. 配置文件：
复制 `config.template.json` 为 `config.json` 并填写配置：
```json
{
    "baidu": {
        "cookie": "YOUR_BAIDU_COOKIE"
    },
    "telegram": {
        "botToken": "YOUR_BOT_TOKEN",
        "chatId": "YOUR_CHAT_ID"
    }
}
```

### 获取配置信息

1. 百度 Cookie:
   - 使用浏览器访问 https://tieba.baidu.com/
   - 登录您的百度账号
   - 按 F12 打开开发者工具
   - 切换到 Network 标签
   - 刷新页面
   - 找到 `json_userinfo` 请求
   - 在请求头中复制 Cookie 的值

2. Telegram 配置:
   - 在 Telegram 中找到 @BotFather 创建机器人，获取 botToken
   - 将机器人添加到群组或与机器人私聊
   - 访问 `https://api.telegram.org/bot<YourBOTToken>/getUpdates` 获取 chatId

## 运行

### 手动运行
```bash
node baidu_checkin.js
```

### 设置定时任务
```bash
# 启动定时任务
pm2 start ecosystem.config.js

# 查看任务状态
pm2 list

# 查看日志
pm2 logs baidu-tieba-checkin

# 停止任务
pm2 stop baidu-tieba-checkin

# 删除任务
pm2 delete baidu-tieba-checkin
```

## 定时设置

默认每天早上 8 点运行签到任务。如需修改运行时间，请编辑 `ecosystem.config.js` 中的 `cron_restart` 值。

## 注意事项

1. 请确保 `config.json` 中的 Cookie 值是最新的，Cookie 可能会定期失效
2. 如果使用 Git，建议将 `config.json` 添加到 `.gitignore` 中
3. 确保服务器时间正确，否则可能影响定时任务的执行
