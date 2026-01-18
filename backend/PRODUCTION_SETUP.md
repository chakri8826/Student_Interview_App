# Production Setup Guide

## Environment Variables for Production

Create a `.env` file in the backend directory with the following variables:

### Database Configuration
```env
DATABASE_URL=postgresql://username:password@localhost:5432/student_interview_app
```

### JWT Configuration
```env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Storage Configuration (MinIO/S3)
```env
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_ACCESS_KEY=your-minio-access-key
STORAGE_SECRET_KEY=your-minio-secret-key
STORAGE_BUCKET=cvs
STORAGE_REGION=us-east-1
```

### Application Configuration
```env
APP_ORIGIN=http://localhost:5173
SESSION_SECRET_KEY=your-session-secret-key
```

## Installation

1. **Install Dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run Database Migrations:**
```bash
alembic upgrade head
```

3. **Start Server:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Testing Production Setup

1. **Test Payment Order Creation:**
```bash
curl -X POST "http://localhost:8000/api/v1/payments/order" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"pack_id": 1}'
```

2. **Test Payment Flow:**
   - Test credit pack purchase
   - Verify credits are added to wallet
   - Check transaction history

## Security Checklist

- [ ] Use strong JWT secret
- [ ] Enable HTTPS in production
- [ ] Set up proper CORS origins
- [ ] Configure firewall rules
- [ ] Use environment variables (never hardcode secrets)
- [ ] Enable webhook signature verification
- [ ] Set up monitoring and logging




