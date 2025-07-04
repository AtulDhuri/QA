# FormBuilder Pro - Complete Deployment Guide

**Document Version:** 1.0  
**Date:** December 2024  
**Author:** Technical Documentation Team  

---

## Executive Summary

This document provides comprehensive step-by-step instructions for deploying the FormBuilder Pro MEAN stack application on AWS EC2 with automated CI/CD pipeline using GitHub Actions.

**Application Stack:**
- Frontend: Angular 17
- Backend: Node.js with Express
- Database: MongoDB Atlas
- Web Server: Nginx
- Process Manager: PM2
- CI/CD: GitHub Actions

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS EC2 Instance Setup](#aws-ec2-instance-setup)
3. [Server Environment Configuration](#server-environment-configuration)
4. [Application Deployment](#application-deployment)
5. [Nginx Reverse Proxy Configuration](#nginx-reverse-proxy-configuration)
6. [GitHub Actions CI/CD Pipeline](#github-actions-cicd-pipeline)
7. [Environment Variables Configuration](#environment-variables-configuration)
8. [SSL Certificate Setup](#ssl-certificate-setup)
9. [Monitoring and Maintenance](#monitoring-and-maintenance)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## Prerequisites

### Required Accounts and Access
- AWS Account with EC2 access
- GitHub repository with admin access
- MongoDB Atlas account
- Domain name (optional but recommended)

### Local Development Tools
- SSH client (PuTTY for Windows, Terminal for Mac/Linux)
- Text editor (VS Code recommended)
- Git client

---

## AWS EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Login to AWS Console**
   - Navigate to EC2 Dashboard
   - Click "Launch Instance"

2. **Instance Configuration**
   ```
   Name: FormBuilder-Production
   AMI: Ubuntu Server 22.04 LTS (Free Tier Eligible)
   Instance Type: t3.micro (1 vCPU, 1 GB RAM)
   Key Pair: Create new or select existing
   ```

3. **Security Group Configuration**
   ```
   Rule 1: SSH (Port 22) - Your IP
   Rule 2: HTTP (Port 80) - Anywhere (0.0.0.0/0)
   Rule 3: HTTPS (Port 443) - Anywhere (0.0.0.0/0)
   Rule 4: Custom TCP (Port 3000) - Anywhere (0.0.0.0/0)
   ```

4. **Storage Configuration**
   ```
   Volume Type: gp3
   Size: 20 GB
   ```

5. **Launch Instance**
   - Review settings and launch
   - Download key pair (.pem file)
   - Note down Public IP address

### Step 2: Connect to Instance

**For Windows (using PuTTY):**
1. Convert .pem to .ppk using PuTTYgen
2. Open PuTTY, enter Public IP
3. Load private key in SSH > Auth
4. Connect as user: ubuntu

**For Mac/Linux:**
```bash
chmod 400 your-key.pem
ssh -i "your-key.pem" ubuntu@your-public-ip
```

---

## Server Environment Configuration

### Step 3: System Updates and Basic Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git unzip software-properties-common
```

### Step 4: Install Node.js 18.x

```bash
# Add NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Install Node.js
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

### Step 5: Install PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Verify installation
pm2 --version
```

### Step 6: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install nginx -y

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
nginx -v
sudo systemctl status nginx
```

### Step 7: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw enable

# Configure firewall rules
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000

# Check firewall status
sudo ufw status
```

---

## Application Deployment

### Step 8: Clone Repository

```bash
# Navigate to web directory
cd /var/www

# Clone your repository (replace with your repo URL)
sudo git clone https://github.com/your-username/formbuilder-pro.git
sudo mv formbuilder-pro formbuilder

# Set proper ownership
sudo chown -R ubuntu:ubuntu formbuilder
cd formbuilder
```

### Step 9: Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Return to root directory
cd ..
```

### Step 10: Build Angular Application

```bash
# Build Angular app for production
cd frontend
npm run build

# Verify build output
ls -la ../middleware/www/dynamic-form-frontend/

# Return to root
cd ..
```

### Step 11: Environment Configuration

```bash
# Create production environment file
nano .env
```

**Add the following content:**
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dynamicforms?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
REFRESH_SECRET=your-super-secret-refresh-key-minimum-32-characters
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

**Save and exit:** Ctrl+X, then Y, then Enter

---

## Nginx Reverse Proxy Configuration

### Step 12: Configure Nginx

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Create new site configuration
sudo nano /etc/nginx/sites-available/BackendAPI
```

**Add the following configuration:**
```nginx
server {
    listen 80;
    server_name 52.66.91.166;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Root directory for static files
    root /var/www/BackendAPI/middleware/www/dynamic-form-frontend;
    index index.html;
    
    # Serve static files
    location / {
        try_files $uri $uri/ @nodejs;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }
    }
    
    # API routes
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 128k;
        proxy_buffers 4 256k;
        proxy_busy_buffers_size 256k;
    }
    
    # Fallback for Angular routing
    location @nodejs {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        application/xml
        image/svg+xml;
    
    # Security configurations
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    location = /favicon.ico {
        log_not_found off;
        access_log off;
    }
    
    location = /robots.txt {
        log_not_found off;
        access_log off;
        allow all;
    }
}
```

### Step 13: Enable Site and Test Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/BackendAPI /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
sudo systemctl restart nginx

# Check nginx status
sudo systemctl status nginx
```

---

## Start Application with PM2

### Step 14: Launch Application

```bash
# Navigate to application directory
cd /var/www/formbuilder

# Start application with PM2
pm2 start server.js --name "formbuilder-app" --env production

# Check application status
pm2 status

# View application logs
pm2 logs formbuilder-app

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup
# Follow the instructions provided by the command above
```

---

## GitHub Actions CI/CD Pipeline

### Step 15: Setup GitHub Repository Secrets

1. **Navigate to GitHub Repository**
   - Go to Settings > Secrets and variables > Actions
   - Click "New repository secret"

2. **Add the following secrets:**
   ```
   EC2_HOST = your-ec2-public-ip-address
   EC2_USERNAME = ubuntu
   EC2_PRIVATE_KEY = contents-of-your-pem-file
   MONGODB_URI = your-mongodb-connection-string
   JWT_SECRET = your-jwt-secret-key
   REFRESH_SECRET = your-refresh-secret-key
   ```

### Step 16: Create GitHub Actions Workflow

**Create file:** `.github/workflows/deploy.yml`

```yaml
name: Deploy FormBuilder Pro to EC2

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout Repository
      uses: actions/checkout@v4
      
    - name: Setup Node.js Environment
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install Backend Dependencies
      run: npm install
      
    - name: Install Frontend Dependencies
      run: |
        cd frontend
        npm install
        
    - name: Build Angular Application
      run: |
        cd frontend
        npm run build
        
    - name: Deploy to EC2 Instance
      uses: appleboy/ssh-action@v0.1.7
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USERNAME }}
        key: ${{ secrets.EC2_PRIVATE_KEY }}
        script: |
          # Navigate to application directory
          cd /var/www/formbuilder
          
          # Pull latest changes
          git pull origin main
          
          # Install/update backend dependencies
          npm install --production
          
          # Install/update frontend dependencies and build
          cd frontend
          npm install
          npm run build
          cd ..
          
          # Update environment variables
          echo "PORT=3000" > .env
          echo "NODE_ENV=production" >> .env
          echo "MONGODB_URI=${{ secrets.MONGODB_URI }}" >> .env
          echo "JWT_SECRET=${{ secrets.JWT_SECRET }}" >> .env
          echo "REFRESH_SECRET=${{ secrets.REFRESH_SECRET }}" >> .env
          echo "JWT_EXPIRE=15m" >> .env
          echo "JWT_REFRESH_EXPIRE=7d" >> .env
          
          # Restart application
          pm2 restart formbuilder-app || pm2 start server.js --name "formbuilder-app" --env production
          pm2 save
          
          # Reload nginx configuration
          sudo systemctl reload nginx
          
          # Display deployment status
          pm2 status
          echo "Deployment completed successfully!"
```

---

## SSL Certificate Setup (Optional but Recommended)

### Step 17: Install SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Setup automatic renewal cron job
sudo crontab -e
# Add this line:
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Monitoring and Maintenance

### Step 18: Setup Monitoring Commands

**Application Monitoring:**
```bash
# Check PM2 status
pm2 status
pm2 monit

# View application logs
pm2 logs formbuilder-app
pm2 logs formbuilder-app --lines 100

# Restart application if needed
pm2 restart formbuilder-app
```

**System Monitoring:**
```bash
# Check system resources
htop
df -h
free -h

# Check nginx status and logs
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check network connections
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :80
```

**Database Monitoring:**
```bash
# Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));
"
```

---

## Troubleshooting Guide

### Common Issues and Solutions

**Issue 1: Nginx shows default page**
```bash
# Solution:
sudo rm /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/formbuilder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

**Issue 2: API calls return 502 Bad Gateway**
```bash
# Check if Node.js app is running
pm2 status
pm2 restart formbuilder-app

# Check if port 3000 is listening
sudo netstat -tlnp | grep :3000

# Check application logs
pm2 logs formbuilder-app
```

**Issue 3: Static files not loading (404 errors)**
```bash
# Check file permissions
ls -la /var/www/formbuilder/middleware/www/
sudo chown -R www-data:www-data /var/www/formbuilder/middleware/www/
sudo chmod -R 755 /var/www/formbuilder/middleware/www/
```

**Issue 4: MongoDB connection failed**
```bash
# Check environment variables
cat .env
echo $MONGODB_URI

# Test connection manually
node -e "console.log(require('mongoose').connect(process.env.MONGODB_URI))"
```

**Issue 5: GitHub Actions deployment fails**
```bash
# Check secrets are properly set
# Verify EC2 instance is accessible
# Check PM2 process status on server
# Review GitHub Actions logs
```

### Performance Optimization

**Nginx Optimization:**
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
client_max_body_size 50M;
```

**PM2 Optimization:**
```bash
# Use cluster mode for better performance
pm2 start server.js --name "formbuilder-app" -i max --env production
```

---

## Security Best Practices

### Step 19: Security Hardening

**1. Update System Regularly:**
```bash
sudo apt update && sudo apt upgrade -y
```

**2. Configure Fail2Ban:**
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

**3. Disable Root Login:**
```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart ssh
```

**4. Setup Log Rotation:**
```bash
sudo nano /etc/logrotate.d/formbuilder
```

Add:
```
/var/www/formbuilder/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
}
```

---

## Backup and Recovery

### Step 20: Setup Automated Backups

**Database Backup Script:**
```bash
#!/bin/bash
# Create backup script
nano /home/ubuntu/backup.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/formbuilder_$DATE.tar.gz /var/www/formbuilder

# Keep only last 7 days of backups
find $BACKUP_DIR -name "formbuilder_*.tar.gz" -mtime +7 -delete

echo "Backup completed: formbuilder_$DATE.tar.gz"
```

**Make executable and schedule:**
```bash
chmod +x /home/ubuntu/backup.sh
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

---

## Final Deployment Checklist

- [ ] EC2 instance launched and configured
- [ ] Security groups properly configured
- [ ] Node.js, PM2, and Nginx installed
- [ ] Application repository cloned
- [ ] Dependencies installed (backend and frontend)
- [ ] Angular application built successfully
- [ ] Environment variables configured
- [ ] Nginx reverse proxy configured
- [ ] PM2 application running and saved
- [ ] GitHub Actions workflow created
- [ ] Repository secrets configured
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall configured
- [ ] Monitoring setup completed
- [ ] Backup strategy implemented
- [ ] Application accessible via public IP/domain

---

## Support and Maintenance

### Regular Maintenance Tasks

**Weekly:**
- Check application logs for errors
- Monitor system resources
- Review security logs

**Monthly:**
- Update system packages
- Review and rotate logs
- Test backup and recovery procedures
- Review SSL certificate expiration

**Quarterly:**
- Security audit and updates
- Performance optimization review
- Disaster recovery testing

---

## Contact Information

**Technical Support:**
- Email: support@formbuilder-pro.com
- Documentation: https://docs.formbuilder-pro.com
- GitHub Issues: https://github.com/your-username/formbuilder-pro/issues

**Emergency Contacts:**
- DevOps Team: devops@formbuilder-pro.com
- System Administrator: admin@formbuilder-pro.com

---

**Document End**

*This document should be reviewed and updated regularly to reflect any changes in the deployment process or infrastructure.*