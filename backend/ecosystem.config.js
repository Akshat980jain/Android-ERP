module.exports = {
    apps: [{
        name: 'erp-backend',
        script: './app.js',
        instances: 'max', // Use all available CPU cores
        exec_mode: 'cluster', // Enable cluster mode
        watch: false, // Disable in production, enable in development if needed
        max_memory_restart: '1G', // Restart if memory exceeds 1GB
        env: {
            NODE_ENV: 'development',
            PORT: 5000
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 5000
        },
        // Logging
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true,
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

        // Advanced settings
        autorestart: true, // Auto restart on crash
        max_restarts: 10, // Max restarts within min_uptime
        min_uptime: '10s', // Min uptime to consider app stable
        listen_timeout: 3000, // Time to wait for app to listen
        kill_timeout: 5000, // Time to wait before force killing

        // Cluster mode settings
        instance_var: 'INSTANCE_ID',

        // Graceful shutdown
        wait_ready: false,
        shutdown_with_message: false
    }]
};
