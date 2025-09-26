module.exports = {
  apps: [{
    name: 'taqa-frontend',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/taqa_website/frontend',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
