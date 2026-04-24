// PM2 process config for the Öde backend.
// Diğer çalışan PM2 process'lerini ETKİLEMEZ — sadece "ode-backend" adıyla yeni bir process başlatır.
//
// Deploy sırasında VPS'te:
//   cd /var/www/ode/backend
//   npm install --omit=dev
//   pm2 startOrReload ecosystem.config.cjs --env production
//   pm2 save

module.exports = {
  apps: [
    {
      name: 'ode-backend',
      cwd: __dirname,
      script: 'src/server.js',
      interpreter: 'node',
      // ESM, .env zaten dotenv ile yükleniyor
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      time: true,
      merge_logs: true,
    },
  ],
};
