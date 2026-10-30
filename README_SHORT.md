# 🔄 Koperasi AGR-ID Integration

Integrasi database koperasi ke [AGR-ID Marketplace](https://github.com/blesiongne5758/agr-id) untuk sinkronisasi data koperasi dan anggota.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database
createdb koperasi_db
npm run db:init

# 3. Configure
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# 4. Run
npm start

# 5. Test
curl -X POST http://localhost:3000/api/v1/sync/agrid
```

## 📚 Dokumentasi

| Dokumen | Deskripsi |
|---------|-----------|
| [README.md](./README.md) | Dokumentasi lengkap |
| [QUICKSTART.md](./QUICKSTART.md) | Quick start 5 menit |
| [API.md](./API.md) | API documentation |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System architecture |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment guide |
| [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) | Step-by-step integration |
| [SUMMARY.md](./SUMMARY.md) | Ringkasan project |

## 🎯 Fitur

- ✅ Snapshot sync (full sync)
- ✅ Retry mechanism (exponential backoff)
- ✅ Audit trail (sync logs)
- ✅ Automated scheduler (cron job)
- ✅ API endpoints (manual trigger)
- ✅ Health check endpoint
- ✅ Docker support
- ✅ Comprehensive documentation

## 📦 Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: PostgreSQL 14+
- **HTTP Client**: Axios
- **Scheduler**: node-cron
- **Container**: Docker & Docker Compose

## 🔐 Security

- Environment variables untuk secrets
- HTTPS ready
- Token rotation support
- Comprehensive error handling

## 📊 API Endpoints

```bash
# Trigger manual sync
POST /api/v1/sync/agrid

# Get sync history
GET /api/v1/sync/history?limit=10

# Health check
GET /health
```

## 🐳 Docker

```bash
# Build & start
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

## 📝 Environment Variables

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/koperasi_db
AGRID_BASE_URL=https://agr.id
AGRID_API_TOKEN=your_token_here
AGRID_SYNC_SCHEDULE=0 2 * * *
PORT=3000
```

## 🆘 Troubleshooting

Lihat [DEPLOYMENT.md](./DEPLOYMENT.md#-troubleshooting) untuk troubleshooting guide.

## 📄 License

MIT License - lihat [LICENSE](./LICENSE)

## 🤝 Contributing

Lihat [CONTRIBUTING.md](./CONTRIBUTING.md)

---

**Version**: 1.0.0  
**Status**: ✅ Production Ready
