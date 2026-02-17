module.exports = {
  apps: [
    {
      name: 'sfr-cloud',
      script: 'server.js',
      interpreter: 'node',
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
    },
  ],
};
