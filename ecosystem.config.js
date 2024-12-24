module.exports = {
  apps: [{
    name: "smzdm-checkin",
    script: "smzdm_checkin.js",
    watch: true,
    autorestart: true,
    max_memory_restart: "200M",
    log_date_format: "YYYY-MM-DD HH:mm:ss",
    env: {
      NODE_ENV: "production",
    }
  }]
}
