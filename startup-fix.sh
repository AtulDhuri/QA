#!/bin/bash

# Fix PM2 startup after EC2 restart

echo "Setting up PM2 startup..."

# Navigate to application directory
cd /var/www/formbuilder

# Stop any existing PM2 processes
pm2 stop all
pm2 delete all

# Start the application
pm2 start server.js --name "formbuilder-app"

# Save PM2 configuration
pm2 save

# Generate startup script
pm2 startup

echo "PM2 startup configuration completed!"
echo "Please run the command shown above as root to complete setup."

# Check if nginx is running and restart if needed
sudo systemctl status nginx
sudo systemctl restart nginx

echo "Services status:"
pm2 status
sudo systemctl status nginx --no-pager -l