// PM2 Configuration for Oracle Service
module.exports = {
  apps: [{
    name: 'arcsettle-oracle',
    script: './oracle-service.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '300M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    merge_logs: true,
    // Restart on crash
    min_uptime: '10s',
    max_restarts: 10,
    // Cron restart (optional - restart daily at 3 AM)
    cron_restart: '0 3 * * *'
  }]
};
