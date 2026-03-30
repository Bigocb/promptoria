# Deployment Guide

This guide explains how to set up automatic deployment to DreamHost using GitHub Actions.

## Prerequisites

1. **GitHub Repository**: Your code must be in a GitHub repository
2. **DreamHost Account**: SSH access configured
3. **Node.js Hosting**: DreamHost account with Node.js support
4. **Database**: MySQL database on DreamHost

## Setup Steps

### 1. Generate SSH Key Pair (if you don't have one)

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/dreamhost_deploy
```

### 2. Add Public Key to DreamHost

Add the contents of `~/.ssh/dreamhost_deploy.pub` to your DreamHost server's `~/.ssh/authorized_keys`:

```bash
cat ~/.ssh/dreamhost_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 3. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Description | Value |
|------------|-------------|-------|
| `DREAMHOST_SSH_KEY` | Private SSH key | Contents of `~/.ssh/dreamhost_deploy` (entire file) |
| `DREAMHOST_HOST` | DreamHost server hostname | e.g., `your-domain.com` or IP address |
| `DREAMHOST_USER` | SSH username | e.g., `username` |
| `DREAMHOST_PATH` | Application directory | e.g., `/home/username/promptoria` |

### 4. Set Up DreamHost Environment

#### Create Application Directory

```bash
mkdir -p ~/promptoria
cd ~/promptoria
git init
```

#### Create `.env` File on DreamHost

Create `.env.production` in your application directory with:

```env
# Database (MySQL format)
DATABASE_URL=mysql://user:password@localhost:3306/promptoria_prod

# Next.js
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://your-domain.com

# Auth
JWT_SECRET=your-super-secret-jwt-key-change-this

# API Keys (if using external APIs)
ANTHROPIC_API_KEY=your-key-here
```

#### Install PM2 Globally

```bash
npm install -g pm2
```

#### Create PM2 Ecosystem Config

Create `ecosystem.config.js` in your application directory:

```javascript
module.exports = {
  apps: [
    {
      name: 'promptoria',
      script: 'npm start',
      instances: 'max',
      exec_mode: 'cluster',
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: 3100,
      },
    },
  ],
};
```

#### Set Up Database

```bash
cd ~/promptoria
# Run migrations
npx prisma migrate deploy
```

### 5. Configure Web Server (if using reverse proxy)

If using Apache or Nginx as a reverse proxy:

**Apache Configuration (.htaccess or VirtualHost)**:
```apache
ProxyPreserveHost On
ProxyPass / http://localhost:3100/
ProxyPassReverse / http://localhost:3100/
```

**Nginx Configuration**:
```nginx
location / {
    proxy_pass http://localhost:3100;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

### 6. Verify Deployment

Once you push to `main` with passing tests:

1. GitHub Actions will automatically:
   - Run tests
   - Build the project
   - Deploy to DreamHost
   - Restart the application using PM2

2. Monitor logs:
   ```bash
   pm2 logs promptoria
   pm2 monit
   ```

## Troubleshooting

### SSH Connection Issues

Check SSH connectivity:
```bash
ssh -i ~/.ssh/dreamhost_deploy username@your-domain.com
```

### Database Migration Failures

Verify database connection on DreamHost:
```bash
mysql -u user -p -h localhost promptoria_prod -e "SELECT VERSION();"
```

### PM2 Issues

Check PM2 status:
```bash
pm2 status
pm2 logs promptoria
pm2 delete promptoria  # if needed to reset
pm2 start ecosystem.config.js
```

### Build Failures

Check workflow logs in GitHub Actions for details. Common issues:
- Missing environment variables
- Dependency installation failures
- TypeScript compilation errors

## Manual Deployment (if needed)

```bash
cd ~/promptoria
git pull origin main
npm ci --legacy-peer-deps
npx prisma migrate deploy
npm run build
pm2 restart all
```

## Monitoring

### View Logs

```bash
# Real-time logs
pm2 logs promptoria

# Previous logs
pm2 logs promptoria --lines 100

# Save logs to file
pm2 logs promptoria > logs/app.log
```

### Health Check

Your application should respond to HTTP requests:
```bash
curl http://your-domain.com/
```

## Security Notes

1. **JWT Secret**: Change `JWT_SECRET` to a strong random value
2. **SSH Key**: Treat your private key like a password - never commit it
3. **Environment Variables**: Never commit `.env` files
4. **Database Password**: Use a strong password and rotate regularly
5. **HTTPS**: Configure SSL/TLS on your domain

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NODE_ENV` | Yes | Set to `production` |
| `JWT_SECRET` | Yes | Secret key for JWT tokens |
| `ANTHROPIC_API_KEY` | No | API key for Claude API (if using suggestions) |
| `NEXT_PUBLIC_API_URL` | No | Public API URL (for client-side requests) |

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [DreamHost Node.js Hosting](https://www.dreamhost.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Next.js Production Deployment](https://nextjs.org/docs/deployment)
