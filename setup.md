# Student Interview Platform - Setup Guide

This guide will help you set up both the backend and frontend of the Student Interview Platform.

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (or SQLite for development)
- Git

## Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   DATABASE_URL=sqlite:///./app.db
   SECRET_KEY=your-secret-key-here
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   SESSION_SECRET_KEY=your-session-secret-here
   
   # Google OAuth (optional)
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:8000/google-login
   ```

5. **Run the backend**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

   The backend will be available at `http://localhost:8000`

## Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env` file in the frontend directory:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Run the frontend**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The frontend will be available at `http://localhost:5173`

## Quick Start (Both Services)

If you want to run both services quickly:

1. **Terminal 1 - Backend**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Terminal 2 - Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Testing the Setup

1. **Backend Health Check**
   Visit `http://localhost:8000/docs` to see the FastAPI documentation

2. **Frontend Access**
   Visit `http://localhost:5173` to see the React application

3. **Test Registration**
   - Go to the frontend
   - Click "Sign Up"
   - Create a new account
   - Verify you can login

## Current Features

### Working Features:
- ✅ User registration and login
- ✅ Google OAuth integration
- ✅ JWT authentication
- ✅ User profile management
- ✅ Responsive UI with all pages
- ✅ Mock data for demonstration

### Ready for Backend Integration:
- 🔄 Role management system
- 🔄 CV upload and storage
- 🔄 Wallet and payment system
- 🔄 Interview session management
- 🔄 CV screening system
- 🔄 Credit management

## Next Steps

1. **Extend Backend**: Add the missing models and endpoints according to the specification
2. **Payment Integration**: Implement payment gateway integration (if needed)
3. **File Storage**: Set up S3 or MinIO for CV storage
4. **Real-time Features**: Add WebSocket support for live interviews
5. **Testing**: Add comprehensive test suites

## Troubleshooting

### Backend Issues:
- **Database errors**: Make sure your DATABASE_URL is correct
- **Import errors**: Ensure all dependencies are installed in the virtual environment
- **Port conflicts**: Change the port in the uvicorn command if 8000 is busy

### Frontend Issues:
- **API connection errors**: Verify the backend is running on port 8000
- **Build errors**: Clear node_modules and reinstall dependencies
- **Environment variables**: Make sure .env file is in the frontend directory

### Common Issues:
- **CORS errors**: The backend includes CORS middleware, but verify the frontend URL is allowed
- **Authentication issues**: Check that JWT tokens are being stored and sent correctly
- **Google OAuth**: Ensure redirect URI matches exactly in Google Console and .env

## Development Tips

1. **Hot Reload**: Both services support hot reload for development
2. **API Documentation**: Use `/docs` endpoint for interactive API testing
3. **Browser DevTools**: Use React DevTools and Network tab for debugging
4. **Database**: Use a GUI tool like DB Browser for SQLite or pgAdmin for PostgreSQL

## Production Deployment

For production deployment, you'll need to:

1. **Backend**: Use a production WSGI server like Gunicorn
2. **Frontend**: Build with `npm run build` and serve with nginx
3. **Database**: Use PostgreSQL instead of SQLite
4. **Environment**: Set production environment variables
5. **SSL**: Configure HTTPS for both services

## Support

If you encounter any issues:

1. Check the console logs for error messages
2. Verify all environment variables are set correctly
3. Ensure all dependencies are installed
4. Check that both services are running on the correct ports

The frontend is designed to work seamlessly with your existing backend and can be extended as you implement the additional features from the specification.
