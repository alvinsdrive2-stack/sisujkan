# Server Requirements - LSP SISUJ System

## Overview
Single-server setup untuk aplikasi assessment dengan **150 concurrent peak users** (~1500 user/day).

---

## Server Specifications

### Minimum (Development/Staging)
| Spec | Value | Reason |
|------|-------|--------|
| CPU | 4 vCPU | Node.js handles ~500 req/sec per core |
| RAM | 8 GB | Node.js + Nginx + DB buffer |
| Storage | 100 GB SSD NVMe | Fast I/O untuk database reads |
| OS | Ubuntu 22.04 LTS | LTS, stable, widely supported |

### Recommended (Production - 150 Concurrent Peak)
| Spec | Value | Reason |
|------|-------|--------|
| **CPU** | **8 vCPU** | Peak: 150 users × 10 req/sec = 1500 req/sec |
| **RAM** | **16 GB** | Headroom for spikes + DB caching |
| **Storage** | **200 GB SSD NVMe** | Database + uploads + logs |
| **OS** | **Ubuntu 22.04 LTS** | Long term support |

### Calculation Breakdown
```
Concurrent Users: 150
Avg Requests/User/sec: 10
Peak Requests/sec: 150 × 10 = 1,500

Node.js throughput: ~500-800 req/sec per vCPU
→ 4 vCPU = 2,000-3,200 req/sec (sufficient for peak)
→ 8 vCPU = 4,000-6,400 req/sec (safety margin)

Static files (frontend): Nginx handles 10k+ req/sec no problem
```

---

## Software Stack

### Core Components
| Component | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18.x LTS / 20.x LTS | Backend runtime |
| **Nginx** | 1.18+ | Reverse proxy + static file server |
| **PM2** | Latest | Process manager dengan clustering |
| **MySQL** | 8.0 / MariaDB 10.6+ | Primary database |
| **Redis** | 7.x | Session store + caching (optional) |

### Optional Additions
| Component | Purpose |
|-----------|---------|
| **Redis** | Cache frequently accessed data (asesi list, kegiatan status) |
| **Cloudflare / CDN** | Serve static assets, DDoS protection |
| **Fail2Ban** | Server security |

---

## Architecture

```
                    Internet
                       │
                       ▼
              ┌───────────────┐
              │   Nginx       │
              │   :80 (HTTP)  │
              │   :443 (HTTPS)│
              └───────┬───────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
   ┌─────────┐  ┌──────────┐  ┌──────────┐
   │ Static  │  │ Backend  │  │  API     │
   │ Files   │  │  Node.js │  │  Proxy   │
   │ (dist/) │  │  PM2     │  │          │
   └─────────┘  │  Cluster  │  └──────────┘
               └─────┬──────┘
                     │
               ┌─────┴─────┐
               │           │
               ▼           ▼
          ┌────────┐  ┌────────┐
          │ MySQL  │  │ Redis  │
          │  DB    │  │ Cache  │
          └────────┘  └────────┘
```

---

## Server Configuration

### 1. System Tuning
```bash
# /etc/sysctl.conf
net.core.somaxconn = 65535
net.ipv4.tcp_tw_reuse = 1
fs.file-max = 1000000

# /etc/security/limits.conf
* soft nofile 65535
* hard nofile 65535
```

### 2. Nginx Config
```nginx
# /etc/nginx/nginx.conf
worker_processes auto;
worker_connections 2048;
keepalive_timeout 65;
gzip on;
gzip_types application/json text/css application/javascript;

# PM2 cluster load balancing
upstream backend {
    least_conn;
    server 127.0.0.1:3000;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Static files (built frontend)
    location / {
        root /var/www/sisuj/dist;
        try_files $uri $uri/ /index.html;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # API proxy to Node.js
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }
}
```

### 3. PM2 Config
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'sisuj-api',
    script: './dist/index.js',
    instances: 4,           // Jumlah instance = jumlah core
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    max_memory_restart: '1G',
    listen_timeout: 5000,
    kill_timeout: 5000
  }]
}
```

### 4. Node.js Environment
```bash
# .env
NODE_ENV=production
PORT=3000
UV_THREADPOOL_SIZE=8
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sisuj
DB_USER=sisuj_user
DB_PASSWORD=your_secure_password
JWT_SECRET=your_very_long_secret_key_here
```

---

## Database Sizing

### MySQL Config (MySQL 8.0)
```ini
# /etc/mysql/mysql.conf.d/mysqld.cnf
innodb_buffer_pool_size = 4G        # ~25% of RAM untuk caching
max_connections = 200               # Handle concurrent connections
innodb_log_file_size = 512M        # Better write performance
innodb_flush_log_at_trx_commit = 2  # Balance safety vs speed
query_cache_type = 0               # Disabled di MySQL 8.0
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
```

### Estimated Storage
| Data Type | Size Estimate |
|-----------|---------------|
| Users/Asesi | ~1 KB per record |
| Activities/Kegiatan | ~2 KB per record |
| Assessment Forms (APL, IA, MAPA) | ~10-50 KB per user per form |
| Uploaded Files | Variable (user uploads) |
| **Total per user** | ~500 KB - 2 MB |
| **1000 users** | ~1-2 GB |
| **Buffer** | +50% |

→ **200 GB SSD** cukup untuk 1000+ users

---

## Security Checklist

- [ ] Firewall (UFW): only ports 22, 80, 443
- [ ] Fail2Ban: protect SSH + nginx
- [ ] SSL/TLS: Let's Encrypt (free)
- [ ] Database user bukan root
- [ ] Environment variables untuk secrets (bukan hardcode)
- [ ] Nginx rate limiting
- [ ] Regular backups (database + uploads)

---

## Monitoring

### Basic
```bash
# PM2 logs & status
pm2 monit
pm2 logs --lines 50

# System stats
htop
iotop
df -h
```

### Recommended (Production)
| Tool | Purpose |
|------|---------|
| **PM2 Plus** | Free monitoring, alerts |
| **New Relic / APM** | APM untuk performance tuning |
| **UptimeRobot** | Uptime monitoring |
| **Sentry** | Error tracking |

---

## Cloud Options (USD/month)

| Provider | Specs | Price |
|----------|-------|-------|
| DigitalOcean | 8 vCPU, 16GB, 200GB | ~$80-120 |
| Vultr | 8 vCPU, 16GB, 200GB NVMe | ~$80-100 |
| AWS EC2 | t3.xlarge (4v,16GB) | ~$80-150 |
| Niagahoster | 8 vCPU, 16GB | ~Rp 1.5-2jt |
| Google Cloud | n2-standard-4 | ~$90-130 |

---

## Backup Strategy

### Database
```bash
# Cron job daily
0 2 * * * mysqldump -u sisuj_user -p sisuj_db | gzip > /backup/sisuj_$(date +\%Y\%m\%d).sql.gz
```

### Files (uploads)
```bash
# Rsync to backup server / cloud storage
0 3 * * * rsync -av /var/www/sisuj/uploads/ backup-server:/backups/sisuj_uploads/
```

---

## Scaling Path (Future)

Kalau sudah exceed 150 concurrent:

1. **Horizontal scaling**: Tambahkan Node.js instances + load balancer
2. **Database separation**: MySQL di dedicated server
3. **Redis**: External session/cache server
4. **CDN**: CloudFlare / S3 untuk static files
5. **Container**: Docker + Kubernetes untuk orchestration

---

## Quick Start Checklist

- [ ] Ubuntu 22.04 LTS fresh install
- [ ] Swap: 4GB (optional, but recommended)
- [ ] Install: Node.js 18/20, Nginx, MySQL 8, PM2
- [ ] Configure Nginx with upstream to PM2
- [ ] Build frontend → copy to /var/www/sisuj/dist
- [ ] Set environment variables
- [ ] Start backend with PM2 cluster mode
- [ ] SSL certificate (Let's Encrypt)
- [ ] Firewall setup
- [ ] Monitoring setup
- [ ] Backup automation

---

## References

- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- [Nginx Performance Tuning](https://nginx.org/en/docs/tuning.html)
- [MySQL 8 Performance](https://dev.mysql.com/doc/refman/8.0/en/optimizing-innodb.html)
- [Node.js Production Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)