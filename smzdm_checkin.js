const axios = require('axios');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');

class SmzdmCheckin {
    constructor() {
        this.loadConfig();
        this.session = axios.create({
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'zh-CN,zh;q=0.9',
                'Referer': 'https://www.smzdm.com/',
                'Origin': 'https://www.smzdm.com',
                'Cookie': this.config.cookie
            }
        });
        
        // 初始化Telegram Bot
        if (this.config.telegram.botToken && this.config.telegram.chatId) {
            this.bot = new TelegramBot(this.config.telegram.botToken);
        }
    }

    // 加载配置文件
    loadConfig() {
        try {
            const configPath = path.join(__dirname, 'config.json');
            const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
            if (!config.cookie) {
                throw new Error('Cookie not found in config.json');
            }
            this.config = config;
            this.log('配置文件加载成功');
        } catch (error) {
            this.log('加载配置文件失败: ' + error.message, 'error');
            throw error;
        }
    }

    // 发送Telegram消息
    async sendTelegramMessage(message) {
        if (this.bot && this.config.telegram.chatId) {
            try {
                await this.bot.sendMessage(this.config.telegram.chatId, message);
                this.log('Telegram通知发送成功');
            } catch (error) {
                this.log('Telegram通知发送失败: ' + error.message, 'error');
            }
        }
    }

    // 日志记录
    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `${timestamp} - ${level.toUpperCase()} - ${message}`;
        
        // 输出到控制台
        console.log(logMessage);
        
        // 写入日志文件
        fs.appendFileSync('smzdm_checkin.log', logMessage + '\n');
    }

    // 延时函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 签到（带重试）
    async checkinWithRetry() {
        const maxRetries = this.config.maxRetries || 3;
        const retryDelay = this.config.retryDelay || 5000;
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const success = await this.checkin();
                if (success) {
                    return true;
                }
                
                if (attempt < maxRetries) {
                    this.log(`签到失败，${attempt}/${maxRetries} 次尝试，等待 ${retryDelay/1000} 秒后重试...`);
                    await this.sleep(retryDelay);
                }
            } catch (error) {
                lastError = error;
                if (attempt < maxRetries) {
                    this.log(`签到出错，${attempt}/${maxRetries} 次尝试，等待 ${retryDelay/1000} 秒后重试...`);
                    await this.sleep(retryDelay);
                }
            }
        }

        // 所有重试都失败后发送Telegram通知
        const errorMessage = `什么值得买签到失败！\n已重试 ${maxRetries} 次\n最后一次错误: ${lastError?.message || '未知错误'}`;
        await this.sendTelegramMessage(errorMessage);
        return false;
    }

    // 签到
    async checkin() {
        try {
            const checkinUrl = 'https://zhiyou.smzdm.com/user/checkin/jsonp_checkin';
            const response = await this.session.get(checkinUrl);
            const result = response.data;

            if (result.error_code === 0) {
                const data = result.data || {};
                const msg = `签到成功！\n` +
                    `连续签到: ${data.checkin_num || '未知'}天\n` +
                    `获得金币: ${data.gold || '未知'}\n` +
                    `获得积分: ${data.point || '未知'}\n` +
                    `获得经验: ${data.exp || '未知'}`;
                this.log(msg);
                // 签到成功也发送Telegram通知
                await this.sendTelegramMessage(msg);
                return true;
            } else {
                this.log('签到失败: ' + (result.error_msg || '未知错误'), 'error');
                return false;
            }
        } catch (error) {
            this.log('签到过程出错: ' + error.message, 'error');
            throw error;
        }
    }

    // 执行签到流程
    async start() {
        try {
            await this.checkinWithRetry();
        } catch (error) {
            this.log('程序执行出错: ' + error.message, 'error');
            await this.sendTelegramMessage('程序执行出错: ' + error.message);
        }
    }
}

// 创建实例并执行
const smzdm = new SmzdmCheckin();

// 立即执行一次
smzdm.start();

// 设置定时任务 - 每天早上9点执行
cron.schedule('0 9 * * *', () => {
    smzdm.start();
});
