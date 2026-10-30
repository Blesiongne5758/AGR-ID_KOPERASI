# 🚀 Deployment Guide

Panduan lengkap untuk deploy integrasi AGR-ID ke production.

## 📋 Prasyarat

### Minimum Requirements
- **Server**: 2 vCPU, 4GB RAM, 50GB SSD
- **OS**: Ubuntu 20.04+ atau CentOS 8+
- **Database**: PostgreSQL 14+
- **Node.js**: 18+
- **Domain**: Dengan SSL certificate

### Recommended
- **Server**: 4 vCPU, 8GB RAM, 100GB SSD
- **Load Balancer**: Nginx atau HAProxy
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack atau Loki

---

## 🐳 Docker Deployment (Recommended)

### 1. Install Docker & Docker Compose

```bash
# Ubuntu
sudo apt update
sudo apt install docker.io docker-compose

# CentOS
sudo yum install docker docker-compose

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 2. Clone Repository

```bash
git clone <repository-url>
cd koperasi-agrid-integration
```

### 3. Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env
nano .env
```

**Minimal configuration:**
```bash
# Database
DB_USER=koperasi
DB_PASSWORD=your_secure_password
DB_NAME=koperasi_db

# AGR-ID
AGRID_BASE_URL=https://agr.id
AGRID_API_TOKEN=your_agrid_token_here

# Scheduler
AGRID_SYNC_SCHEDULE=0 2 * * *

# Server
PORT=3000
NODE_ENV=production
```

### 4. Build & Start

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 5. Verify Deployment

```bash
# Health check
curl http://localhost:3000/health

# Trigger manual sync
curl -X POST http://localhost:3000/api/v1/sync/agrid
```

---

## 🖥️ Manual Deployment

### 1. Install Dependencies

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

### 2. Setup Database

```bash
# Create database user
sudo -u postgres createuser --interactive
# Enter name: koperasi
# Superuser? n
# Create databases? y
# Create roles? y

# Create database
sudo -u postgres createdb koperasi_db

# Set password
sudo -u postgres psql
ALTER USER koperasi WITH PASSWORD 'your_secure_password';
\q

# Run migration
psql -U koperasi -d koperasi_db -f database/schema.sql
```

### 3. Configure Application

```bash
# Clone repository
git clone <repository-url>
cd koperasi-agrid-integration

# Install dependencies
npm install --production

# Copy environment file
cp .env.example .env

# Edit .env
nano .env
```

**Configuration:**
```bash
DATABASE_URL=postgresql://koperasi:your_secure_password@localhost:5432/koperasi_db
AGRID_BASE_URL=https://agr.id
AGRID_API_TOKEN=your_agrid_token_here
AGRID_SYNC_SCHEDULE=0 2 * * *
PORT=3000
NODE_ENV=production
```

### 4. Start with PM2

```bash
# Start application
pm2 start server.js --name "koperasi-agrid"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 5. Setup Nginx Reverse Proxy

```bash
# Install Nginx
sudo apt install nginx

# Create config
sudo nano /etc/nginx/sites-available/koperasi-agrid
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable site:**
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/koperasi-agrid /etc/nginx/sites-enabled/

# Test config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 6. Setup SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | - | PostgreSQL connection string |
| `AGRID_BASE_URL` | ✅ | `https://agr.id` | AGR-ID API base URL |
| `AGRID_API_TOKEN` | ✅ | - | AGR-ID API token |
| `AGRID_SYNC_SCHEDULE` | ❌ | `0 2 * * *` | Cron schedule |
| `PORT` | ❌ | `3000` | Server port |
| `NODE_ENV` | ❌ | `development` | Environment |

### Cron Schedule Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6)
│ │ │ │ │
* * * * *
```

**Examples:**
- `0 2 * * *` - Every day at 2:00 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 * * 0` - Every Sunday at midnight
- `*/15 * * * *` - Every 15 minutes

---

## 🔐 Security

### 1. Firewall Configuration

```bash
# Allow SSH
sudo ufw allow 22

# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow PostgreSQL (only from localhost)
sudo ufw allow from 127.0.0.1 to any port 5432

# Enable firewall
sudo ufw enable
```

### 2. Database Security

```bash
# Edit PostgreSQL config
sudo nano /etc/postgresql/14/main/postgresql.conf

# Set listen_addresses
listen_addresses = 'localhost'

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 3. Environment Variables

```bash
# Set proper permissions
chmod 600 .env

# Never commit .env to Git
echo ".env" >> .gitignore
```

### 4. SSL/TLS

```bash
# Force HTTPS in Nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # ... rest of config
}
```

---

## 📊 Monitoring

### 1. PM2 Monitoring

```bash
# View logs
pm2 logs koperasi-agrid

# Monitor in real-time
pm2 monit

# View status
pm2 status
```

### 2. Application Metrics

```bash
# Check sync logs
psql -U koperasi -d koperasi_db -c "
SELECT 
  DATE(created_at) as date,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed
FROM agrid_sync_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
"
```

### 3. Server Monitoring

```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# View system resources
htop

# View disk I/O
iotop

# View network usage
nethogs
```

---

## 🔄 Maintenance

### 1. Backup Database

```bash
# Manual backup
pg_dump -U koperasi koperasi_db > backup_$(date +%Y%m%d).sql

# Automated backup (cron)
0 3 * * * pg_dump -U koperasi koperasi_db > /backups/db_$(date +\%Y\%m\%d).sql
```

### 2. Update Application

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm install --production

# Restart application
pm2 restart koperasi-agrid
```

### 3. Rotate Logs

```bash
# PM2 log rotation
pm2 install pm2-logrotate

# Configure
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### 4. Clean Old Sync Logs

```sql
-- Delete logs older than 90 days
DELETE FROM agrid_sync_logs
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## 🚨 Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs koperasi-agrid --err

# Check if port is in use
sudo lsof -i :3000

# Restart application
pm2 restart koperasi-agrid
```

### Database Connection Error

```bash
# Test connection
psql -U koperasi -d koperasi_db -c "SELECT 1;"

# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection string
echo $DATABASE_URL
```

### AGR-ID API Error

```bash
# Test AGR-ID API
curl https://agr.id/health

# Check token
echo $AGRID_API_TOKEN

# Test sync manually
curl -X POST http://localhost:3000/api/v1/sync/agrid
```

### High Memory Usage

```bash
# Check memory usage
free -h

# Restart application
pm2 restart koperasi-agrid

# Increase Node.js memory limit
pm2 start server.js --name "koperasi-agrid" --node-args="--max-old-space-size=4096"
```

---

## 📈 Performance Tuning

### 1. PostgreSQL Tuning

```bash
# Edit config
sudo nano /etc/postgresql/14/main/postgresql.conf

# Recommended settings
shared_buffers = 2GB
effective_cache_size = 6GB
work_mem = 16MB
maintenance_work_mem = 512MB
max_connections = 100

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 2. Node.js Tuning

```bash
# Increase memory
pm2 start server.js --name "koperasi-agrid" --node-args="--max-old-space-size=4096"

# Use cluster mode
pm2 start server.js --name "koperasi-agrid" -i max
```

### 3. Nginx Tuning

```nginx
# Edit Nginx config
sudo nano /etc/nginx/nginx.conf

# Add to http block
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_types text/plain application/json application/javascript text/css;
```

---

## 📚 Additional Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

**Version:** 1.0.0  
**Last Updated:** 2026-01-15  
**Author:** DevOps Team
