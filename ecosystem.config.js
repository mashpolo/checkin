module.exports = {
  apps: [{
    name: "smzdm-checkin",
    script: "smzdm_checkin.js",
    autorestart: false,
    cron_restart: '0 8 * * *', // 每天早上 8 点运行
    watch: false,
    max_memory_restart: "100M",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    env: {
      NODE_ENV: "production",
    }
  }]
}
