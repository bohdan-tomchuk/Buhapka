# SSL/TLS Setup with Let's Encrypt (Optional)

This guide explains how to set up SSL/TLS certificates for HTTPS using Let's Encrypt and certbot.

## Prerequisites

- A domain name pointing to your server
- Ports 80 and 443 accessible from the internet

## Setup Steps

### 1. Install Certbot

On your host machine (not in Docker):

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install certbot

# macOS
brew install certbot
```

### 2. Obtain SSL Certificate

Stop nginx temporarily:

```bash
docker-compose -f docker-compose.prod.yml stop nginx
```

Request a certificate:

```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts to complete the certificate issuance.

### 3. Copy Certificates

Create the SSL directory and copy certificates:

```bash
mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
sudo chmod 644 nginx/ssl/*.pem
```

### 4. Update Nginx Configuration

Add SSL configuration to `nginx/nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... rest of your location blocks ...
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

### 5. Restart Nginx

```bash
docker-compose -f docker-compose.prod.yml up -d nginx
```

## Certificate Renewal

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

```bash
# Add to crontab (crontab -e)
0 0 1 * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/*.pem /path/to/nginx/ssl/ && docker-compose -f /path/to/docker-compose.prod.yml restart nginx
```

## Testing

Verify SSL is working:

```bash
curl https://yourdomain.com/health
```

Check SSL certificate:

```bash
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```
