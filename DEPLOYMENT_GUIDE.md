# Complete Deployment Guide: MEAN Stack App on AWS EC2

## Table of Contents
1. [EC2 Instance Setup](#ec2-instance-setup)
2. [Server Configuration](#server-configuration)
3. [Application Deployment](#application-deployment)
4. [Nginx Configuration](#nginx-configuration)
5. [GitHub Actions CI/CD](#github-actions-cicd)
6. [Environment Configuration](#environment-configuration)
7. [Troubleshooting](#troubleshooting)

## EC2 Instance Setup

### 1. Launch EC2 Instance
```bash
# Instance Configuration
- AMI: Ubuntu Server 22.04 LTS
- Instance Type: t3.micro (or t3.small for better performance)
- Key Pair: Create/Select your key pair
- Security Group: Allow HTTP (80), HTTPS (443), SSH (22), Custom (3000)
- Storage: 20GB gp3
```

### 2. Connect to Instance
```bash
# Connect via SSH
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip

# Update system
sudo apt update && sudo apt upgrade -y
```

## Server Configuration

### 3. Install Required Software
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Git
sudo apt install git -y

# Verify installations
node --version
npm --version
pm2 --version
nginx -v
```

### 4. Configure Firewall
```bash
# Enable UFW
sudo ufw enable

# Allow necessary ports
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3000

# Check status
sudo ufw status
```

## Application Deployment

### 5. Clone Repository
```bash
# Navigate to web directory
cd /var/www

# Clone your repository
sudo git clone https://github.com/your-username/your-repo.git
sudo mv your-repo formbuilder
sudo chown -R ubuntu:ubuntu formbuilder
cd formbuilder
```

### 6. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 7. Build Application
```bash
# Build Angular app
cd frontend
npm run build
cd ..

# Create necessary directories
mkdir -p middleware/www
```

### 8. Environment Configuration
```bash
# Create production environment file
sudo nano .env
```

Add the following content:
```env
# Server Configuration
PORT=3000
NODE_ENV=production

# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dynamicforms

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

## Nginx Configuration

### 9. Configure Nginx
```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Create new site configuration
sudo nano /etc/nginx/sites-available/formbuilder
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com your-ec2-public-ip;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Serve static files
    location / {
        root /var/www/formbuilder/middleware/www/dynamic-form-frontend;
        try_files $uri $uri/ @nodejs;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
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
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### 10. Enable Site and Start Services
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/formbuilder /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Start and enable services
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl restart nginx
```

### 11. Start Application with PM2
```bash
# Navigate to app directory
cd /var/www/formbuilder

# Start with PM2
pm2 start server.js --name "formbuilder-app"

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
# Follow the instructions provided by the command above
```

## GitHub Actions CI/CD

### 12. Setup GitHub Secrets
In your GitHub repository, go to Settings > Secrets and variables > Actions, and add:

```
EC2_HOST=your-ec2-public-ip
EC2_USERNAME=ubuntu
EC2_PRIVATE_KEY=your-private-key-content
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
REFRESH_SECRET=your-refresh-secret
```

### 13. Create GitHub Actions Workflow
```bash
# Create workflow directory
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to EC2

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
      
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        
    - name: Install dependencies
      run: |
        npm install
        cd frontend
        npm install
        
    - name: Build Angular app
      run: |
        cd frontend
        npm run build
        
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ${{ secrets.EC2_USERNAME }}
        key: ${{ secrets.EC2_PRIVATE_KEY }}
        script: |
          cd /var/www/formbuilder
          git pull origin main
          npm install --production
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
          pm2 restart formbuilder-app
          pm2 save
          
          # Restart nginx
          sudo systemctl reload nginx
```

## Environment Configuration

### 14. Production Environment Files

**Frontend Environment (`frontend/src/environments/environment.prod.ts`):**
```typescript
export const environment = {
  production: true,
  apiUrl: '/api',
  baseUrl: '',
  backendUrl: ''
};
```

**Backend Environment (`.env`):**
```env
PORT=3000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dynamicforms
JWT_SECRET=your-super-secret-jwt-key-here
REFRESH_SECRET=your-super-secret-refresh-key-here
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
```

## Troubleshooting

### 15. Common Issues and Solutions

**Issue: Nginx shows default page**
```bash
# Check nginx configuration
sudo nginx -t
sudo systemctl status nginx

# Verify site is enabled
ls -la /etc/nginx/sites-enabled/
```

**Issue: API calls failing**
```bash
# Check PM2 status
pm2 status
pm2 logs formbuilder-app

# Check if app is running on port 3000
sudo netstat -tlnp | grep :3000
```

**Issue: Static files not loading**
```bash
# Check file permissions
ls -la /var/www/formbuilder/middleware/www/
sudo chown -R www-data:www-data /var/www/formbuilder/middleware/www/
```

**Issue: MongoDB connection failed**
```bash
# Check environment variables
cat .env

# Test MongoDB connection
node -e "console.log(process.env.MONGODB_URI)"
```

### 16. Monitoring Commands
```bash
# Check application logs
pm2 logs formbuilder-app

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check system resources
htop
df -h
free -h

# Restart services if needed
pm2 restart formbuilder-app
sudo systemctl restart nginx
```

### 17. SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Final Checklist

- [ ] EC2 instance launched and configured
- [ ] Node.js, PM2, Nginx installed
- [ ] Application cloned and dependencies installed
- [ ] Environment variables configured
- [ ] Nginx proxy configured
- [ ] PM2 application running
- [ ] GitHub Actions workflow created
- [ ] Secrets configured in GitHub
- [ ] SSL certificate installed (optional)
- [ ] Monitoring and logging setup

Your application should now be accessible at `http://your-ec2-public-ip` or your domain name.