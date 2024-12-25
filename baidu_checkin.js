const axios = require('axios');
const fs = require('fs');

// 发送 Telegram 消息
async function sendTelegramMessage(message, config) {
    try {
        if (!config.telegram || !config.telegram.botToken || !config.telegram.chatId) {
            console.log('Telegram 配置不完整，跳过通知');
            return;
        }

        await axios.post(
            `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`,
            {
                chat_id: config.telegram.chatId,
                text: message,
                parse_mode: 'HTML'
            }
        );
    } catch (error) {
        console.log('发送 Telegram 消息失败:', error.message);
    }
}

async function baiduCheckin(retryCount = 0) {
    try {
        // 读取配置文件
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        if (!config.baidu || !config.baidu.cookie) {
            const error = '未找到百度 cookie 配置';
            console.log(error);
            await sendTelegramMessage(`❌ 百度贴吧签到失败\n原因: ${error}`, config);
            return false;
        }
        const cookie = config.baidu.cookie;

        // 创建 axios 实例
        const instance = axios.create({
            headers: {
                'Cookie': cookie,
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Connection': 'keep-alive',
                'Referer': 'https://tieba.baidu.com/'
            }
        });

        // 获取用户信息
        console.log('正在获取用户信息...');
        const userInfoResponse = await instance.get('https://tieba.baidu.com/f/user/json_userinfo', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        if (!userInfoResponse.data || !userInfoResponse.data.data) {
            const error = '获取用户信息失败，请检查 cookie 是否有效';
            console.log(error);
            await sendTelegramMessage(`❌ 百度贴吧签到失败\n原因: ${error}`, config);
            return false;
        }
        console.log('用户信息获取成功');

        // 获取关注的贴吧列表
        console.log('正在获取关注的贴吧列表...');
        const myLikeResponse = await instance.get('https://tieba.baidu.com/mo/q/newmoindex', {
            headers: {
                'Accept': 'application/json, text/plain, */*'
            }
        });

        const tiebaData = myLikeResponse.data;
        if (tiebaData && tiebaData.data && tiebaData.data.like_forum) {
            const forums = tiebaData.data.like_forum;
            console.log(`成功获取关注的贴吧列表，共 ${forums.length} 个贴吧`);
            
            // 获取 tbs
            const tbs = await getTbs(instance);
            if (!tbs) {
                const error = '获取 tbs 失败';
                console.log(error);
                await sendTelegramMessage(`❌ 百度贴吧签到失败\n原因: ${error}`, config);
                return false;
            }

            // 签到结果统计
            const results = {
                success: [],
                alreadySigned: [],
                failed: []
            };

            // 遍历每个贴吧进行签到
            for (const forum of forums) {
                try {
                    // 构建签到请求数据
                    const formData = new URLSearchParams();
                    formData.append('ie', 'utf-8');
                    formData.append('kw', forum.forum_name);
                    formData.append('tbs', tbs);

                    const signResponse = await instance.post('https://tieba.baidu.com/sign/add', formData, {
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                            'Origin': 'https://tieba.baidu.com',
                            'X-Requested-With': 'XMLHttpRequest',
                            'Referer': `https://tieba.baidu.com/f?kw=${encodeURIComponent(forum.forum_name)}`
                        }
                    });
                    
                    const signData = signResponse.data;
                    if (signData.no === 0) {
                        console.log(`${forum.forum_name} 签到成功`);
                        results.success.push(forum.forum_name);
                    } else if (signData.no === 1101) {
                        console.log(`${forum.forum_name} 已经签到过了`);
                        results.alreadySigned.push(forum.forum_name);
                    } else {
                        console.log(`${forum.forum_name} 签到失败: ${signData.error}`);
                        results.failed.push(forum.forum_name);
                    }
                    
                    // 添加随机延迟
                    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
                } catch (error) {
                    console.log(`${forum.forum_name} 签到失败: ${error.message}`);
                    results.failed.push(forum.forum_name);
                }
            }

            // 生成报告
            const report = [
                '📊 百度贴吧签到报告',
                `总贴吧数: ${forums.length}`,
                `✅ 签到成功: ${results.success.length}`,
                `📝 已签过: ${results.alreadySigned.length}`,
                `❌ 签到失败: ${results.failed.length}`
            ];

            if (results.failed.length > 0) {
                report.push('\n❌ 签到失败的贴吧:');
                report.push(results.failed.join(', '));
            }

            const message = report.join('\n');
            console.log(message);
            await sendTelegramMessage(message, config);
            
            return results.failed.length === 0;
        } else {
            const error = '获取贴吧列表失败，请检查 cookie 是否有效';
            console.log(error);
            if (tiebaData) {
                console.log('响应数据:', JSON.stringify(tiebaData, null, 2));
            }
            await sendTelegramMessage(`❌ 百度贴吧签到失败\n原因: ${error}`, config);
            return false;
        }
    } catch (error) {
        const errorMessage = error.response ? 
            `请求失败: ${error.response.status}\n${JSON.stringify(error.response.data, null, 2)}` :
            `执行异常: ${error.message}`;
        console.log(errorMessage);
        await sendTelegramMessage(`❌ 百度贴吧签到失败\n原因: ${errorMessage}`, config);
        return false;
    }
}

// 获取百度贴吧的 tbs 值
async function getTbs(instance) {
    try {
        const response = await instance.get('https://tieba.baidu.com/dc/common/tbs', {
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        return response.data.tbs;
    } catch (error) {
        if (error.response) {
            console.log('获取 tbs 失败:', error.response.status);
        }
        return null;
    }
}

// 带重试的执行函数
async function runWithRetry(maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        if (i > 0) {
            console.log(`第 ${i + 1} 次重试...`);
            // 重试前等待一段时间
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        if (await baiduCheckin(i)) {
            return true;
        }
    }
    return false;
}

// 如果直接运行脚本则执行签到
if (require.main === module) {
    runWithRetry();
}

// 导出函数供其他模块使用
module.exports = {
    runWithRetry
};
