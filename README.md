# Student Interview Preparation Platform

A comprehensive full-stack web application designed to help students and job seekers prepare for technical interviews through AI-powered CV analysis and realistic mock interview sessions.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Credit-Based Workflow](#credit-based-workflow)
- [AI Integrations](#ai-integrations)
- [File Storage](#file-storage)
- [API Overview](#api-overview)
- [Local Setup & Installation](#local-setup--installation)
- [Project Structure](#project-structure)
- [Future Enhancements](#future-enhancements)

## Overview

This platform enables students to:
- Upload and analyze their CVs/resumes using AI to receive role recommendations and improvement suggestions
- Practice mock interviews with AI-powered interviewers tailored to specific job roles
- Manage their interview preparation journey through a credit-based system
- Track their progress and activity history

The application is built with a modern tech stack, featuring a React TypeScript frontend and a FastAPI Python backend, with secure authentication, file storage, and multiple AI service integrations.

## Features

### Core Functionalities

- **User Authentication & Profiles**
  - JWT-based authentication with refresh token rotation
  - OAuth 2.0 integration (Google, LinkedIn, Microsoft)
  - User profile management with personal information

- **Credit-Based System**
  - Wallet system for credit balance management
  - Credit pack purchases (10, 25, 50, 100 credits)
  - Transaction history tracking
  - Credit consumption for premium features

- **CV/Resume Management**
  - Upload CV files (PDF, DOC, DOCX formats)
  - Secure file storage using MinIO (S3-compatible)
  - Presigned URL-based direct uploads
  - CV listing and download capabilities

- **AI-Powered CV Analysis**
  - Extract text from uploaded CV files
  - AI analysis using OpenAI or Google Gemini
  - Role recommendations based on CV content
  - Skills summary and improvement suggestions
  - Consumes 1 credit per analysis

- **Mock Interview Sessions**
  - AI-powered mock interviews via Tavus API
  - Role-specific interview personas
  - Dynamic conversation generation
  - Interview session tracking
  - Consumes 5 credits per interview session

- **Role Management**
  - Browse available job roles
  - Select roles for interview practice
  - Role-based interview customization

- **Activity Tracking**
  - User activity logging
  - Dashboard with recent activities
  - Transaction and credit history

## Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **State Management**: TanStack React Query
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form with Zod validation
- **Notifications**: React Hot Toast
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI 0.116
- **Language**: Python 3.x
- **ORM**: SQLAlchemy 2.0
- **Database Migrations**: Alembic
- **Authentication**: python-jose (JWT), Authlib (OAuth)
- **Password Hashing**: Passlib with bcrypt
- **File Processing**: PyPDF2, python-docx

### Database
- **Primary Database**: PostgreSQL
- **Connection**: psycopg2-binary

### Storage
- **Object Storage**: MinIO (S3-compatible)
- **Client**: boto3

### AI Services
- **CV Analysis**: OpenAI API, Google Gemini API
- **Mock Interviews**: Tavus API

### Development Tools
- **Environment Management**: python-dotenv
- **HTTP Requests**: requests, httpx
- **Type Validation**: Pydantic

## System Architecture

### High-Level Overview

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   React     │────────▶│   FastAPI   │────────▶│ PostgreSQL  │
│  Frontend   │  HTTP   │   Backend   │  SQL    │  Database   │
│  (Port 5173)│         │ (Port 8000) │         │  (Port 5432)│
└─────────────┘         └─────────────┘         └─────────────┘
                              │
                              │ S3 API
                              ▼
                        ┌─────────────┐
                        │    MinIO    │
                        │  (Port 9000)│
                        └─────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
  ┌──────────┐         ┌──────────┐         ┌──────────┐
  │  OpenAI  │         │  Gemini  │         │  Tavus   │
  │    API   │         │    API   │         │    API   │
  └──────────┘         └──────────┘         └──────────┘
```

### Component Interactions

1. **Frontend-Backend Communication**
   - RESTful API calls via Axios
   - JWT tokens in Authorization headers
   - CORS configured for local development

2. **Backend-Database**
   - SQLAlchemy ORM for database operations
   - Connection pooling via SQLAlchemy engine
   - Alembic migrations for schema management

3. **File Storage Flow**
   - Frontend requests presigned URL from backend
   - Backend generates presigned URL using boto3
   - Frontend uploads directly to MinIO using presigned URL
   - Backend confirms upload and creates CV record

4. **AI Service Integration**
   - CV Analysis: Backend extracts text, sends to OpenAI/Gemini API
   - Mock Interviews: Backend creates Tavus conversation, returns join URL
   - Credits deducted before AI service calls

## Authentication & Authorization

### Authentication Methods

1. **Email/Password Authentication**
   - User registration with email, password, name
   - Password hashing using bcrypt
   - JWT access tokens (15-30 minutes expiry)
   - Refresh tokens (7 days expiry) stored in database

2. **OAuth 2.0 Providers**
   - Google OAuth (OpenID Connect)
   - LinkedIn OAuth
   - Microsoft OAuth (Azure AD)
   - Automatic user creation on first OAuth login
   - Secure token exchange and user data retrieval

### Authorization

- **JWT Token Validation**: All protected routes require valid JWT token
- **Token Refresh**: Automatic refresh token rotation
- **User Context**: Current user extracted from JWT payload
- **Route Protection**: Frontend and backend route guards

### Security Features

- HTTP-only cookies for refresh tokens
- Secure password hashing (bcrypt)
- Token expiration and validation
- CORS configuration
- Session middleware for OAuth flows

## Credit-Based Workflow

### Credit System Overview

The platform uses a credit-based monetization model where users purchase credits and consume them for premium features.

### Credit Packs

| Pack ID | Credits | Price (INR) |
|---------|---------|-------------|
| 1       | 10      | ₹100        |
| 2       | 25      | ₹225        |
| 3       | 50      | ₹400        |
| 4       | 100     | ₹750        |

### Credit Consumption

- **CV Analysis**: 1 credit per analysis
- **Mock Interview**: 5 credits per interview session

### Workflow

1. **Credit Purchase**
   - User selects credit pack
   - Payment order created
   - Credits immediately added to wallet
   - Transaction recorded

2. **Credit Usage**
   - User initiates CV analysis or interview
   - System checks wallet balance
   - Credits deducted upfront
   - Transaction recorded
   - Service accessed

3. **Transaction Tracking**
   - All credit transactions logged
   - Purchase, consumption, and refund records
   - Transaction history available in wallet

## AI Integrations

### CV Analysis (OpenAI & Google Gemini)

**Flow:**
1. User uploads CV file
2. Backend extracts text from PDF/DOCX
3. Text sent to AI provider (configurable)
4. AI analyzes CV and returns:
   - Recommended job roles (3-5)
   - Key skills summary
   - Improvement suggestions
5. Analysis stored and returned to user

**Configuration:**
- Provider selection via `AI_PROVIDER` env variable
- Model selection via `AI_MODEL` env variable
- Default: Google Gemini (`gemini-1.5-flash`)
- Fallback: OpenAI (`gpt-4o-mini`)

**Cost:** 1 credit per analysis

### Mock Interviews (Tavus API)

**Flow:**
1. User selects role and optional CV
2. System deducts 5 credits
3. Backend resolves role-specific replica and persona IDs
4. Tavus conversation created with role context
5. Interview join URL returned
6. User joins video interview session
7. Webhook updates interview status

**Features:**
- Role-specific interview personas
- Dynamic question generation
- CV context integration
- Interview session tracking

**Cost:** 5 credits per interview

## File Storage

### MinIO Integration

The platform uses MinIO, an S3-compatible object storage service, for CV file storage.

### Storage Flow

1. **Presigned URL Generation**
   - Frontend requests presigned upload URL
   - Backend validates file type and role
   - Generates unique filename: `{user_id}/{uuid}.{ext}`
   - Creates presigned URL (1 hour expiry)

2. **Direct Upload**
   - Frontend uploads file directly to MinIO
   - Bypasses backend for file transfer
   - Reduces server load

3. **Upload Confirmation**
   - Frontend confirms upload completion
   - Backend creates CV record in database
   - Stores storage URL and metadata

4. **File Retrieval**
   - Presigned download URLs generated on demand
   - 15-minute expiry for security
   - Direct access from MinIO

### Supported Formats

- PDF (`.pdf`)
- Microsoft Word (`.doc`, `.docx`)

### Configuration

- Endpoint: Configurable via `STORAGE_ENDPOINT`
- Bucket: Configurable via `STORAGE_BUCKET`
- Access: AWS S3-compatible API via boto3

## API Overview

### Authentication Module (`/api/v1/auth`)
- User registration and login
- OAuth provider endpoints (Google, LinkedIn, Microsoft)
- Token refresh and logout
- Password-based and OAuth authentication

### Profile Module (`/api/v1`)
- Get current user profile
- Update user profile information
- User profile management

### Roles Module (`/api/v1`)
- List available job roles
- Get user's selected roles
- Add/update role selections

### CV Management Module (`/api/v1/cvs`)
- Generate presigned upload URLs
- Confirm CV uploads
- List user's CVs
- Delete CV files
- Generate download URLs

### Payment & Wallet Module (`/api/v1`)
- Get wallet balance and recent transactions
- Create payment orders for credit packs
- List transaction history
- Credit management

### Screening Module (`/api/v1/screenings`)
- Run CV analysis
- Get screening results
- AI-powered CV analysis endpoints

### Interview Module (`/api/v1/interviews`)
- Start mock interview sessions
- Handle Tavus webhooks
- Interview session management

### Activity Module (`/api/v1`)
- Get user activity feed
- Activity tracking and logging

## Local Setup & Installation

### Prerequisites

- **Python 3.8+**
- **Node.js 18+** and npm
- **PostgreSQL 12+**
- **MinIO** (or compatible S3 service)
- **Git**

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Student_Interview_App/backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up PostgreSQL database**
   ```bash
   createdb student_interview_db
   ```

5. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/student_interview_db
   SECRET_KEY=your-secret-key-change-in-production
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   REFRESH_SECRET_KEY=your-refresh-secret-key
   REFRESH_ALGORITHM=HS256
   
   FRONTEND_URL=http://localhost:5173
   
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google-login
   
   LINKEDIN_CLIENT_ID=your-linkedin-client-id
   LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
   LINKEDIN_REDIRECT_URI=http://localhost:8000/api/v1/auth/linkedin-login
   
   MICROSOFT_CLIENT_ID=your-microsoft-client-id
   MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
   MICROSOFT_REDIRECT_URI=http://localhost:8000/api/v1/auth/microsoft-login
   MICROSOFT_TENANT_ID=common
   
   STORAGE_ENDPOINT=http://127.0.0.1:9000
   STORAGE_BUCKET=cvs
   STORAGE_ACCESS_KEY=minioadmin
   STORAGE_SECRET_KEY=minioadmin
   
   API_KEY=your-openai-or-gemini-api-key
   AI_PROVIDER=google
   AI_MODEL=gemini-1.5-flash
   
   TAVUS_API_KEY=your-tavus-api-key
   TAVUS_BASE_URL=https://tavusapi.com
   TAVUS_REPLICA_DEFAULT=your-tavus-replica-id
   TAVUS_PERSONA_DEFAULT=your-tavus-persona-id
   ```

6. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

7. **Start the backend server**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create `.env` file:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   Frontend will be available at `http://localhost:5173`

### MinIO Setup

1. **Download and install MinIO**
   - Visit https://min.io/download
   - Or use Docker: `docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"`

2. **Create bucket**
   - Access MinIO console at `http://localhost:9001`
   - Create bucket named `cvs`
   - Set appropriate access policies

3. **Configure credentials**
   - Default: `minioadmin` / `minioadmin`
   - Update in backend `.env` if changed

### OAuth Setup

1. **Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `http://localhost:8000/api/v1/auth/google-login`

2. **LinkedIn OAuth**
   - Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Create app and get credentials
   - Add redirect URI: `http://localhost:8000/api/v1/auth/linkedin-login`

3. **Microsoft OAuth**
   - Go to [Azure Portal](https://portal.azure.com/)
   - Register application in Azure AD
   - Add redirect URI: `http://localhost:8000/api/v1/auth/microsoft-login`

### AI Service Setup

1. **OpenAI**
   - Get API key from [OpenAI Platform](https://platform.openai.com/)
   - Set `API_KEY` and `AI_PROVIDER=openai` in `.env`

2. **Google Gemini**
   - Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Set `API_KEY` and `AI_PROVIDER=google` in `.env`

3. **Tavus**
   - Get API key from [Tavus Platform](https://tavus.io/)
   - Configure replica and persona IDs in `.env`

## Project Structure

```
Student_Interview_App/
├── backend/
│   ├── app/
│   │   ├── models/          # SQLAlchemy database models
│   │   │   ├── user_model.py
│   │   │   ├── wallet_model.py
│   │   │   ├── transaction_model.py
│   │   │   ├── cv_model.py
│   │   │   ├── interview_model.py
│   │   │   ├── screening_model.py
│   │   │   └── ...
│   │   ├── routes/          # API route handlers
│   │   │   ├── auth_routes.py
│   │   │   ├── payment_routes.py
│   │   │   ├── cv_routes.py
│   │   │   ├── interview_routes.py
│   │   │   ├── screening_routes.py
│   │   │   └── ...
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── auth.py           # JWT and password utilities
│   │   ├── database.py       # Database configuration
│   │   ├── dependencies.py   # FastAPI dependencies
│   │   └── main.py           # FastAPI application entry point
│   ├── alembic/              # Database migrations
│   ├── requirements.txt      # Python dependencies
│   └── env.example           # Environment variables template
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable React components
│   │   │   ├── ui/           # UI primitives (Button, Card, etc.)
│   │   │   └── layout/       # Layout components
│   │   ├── pages/            # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Auth.tsx
│   │   │   ├── Wallet.tsx
│   │   │   ├── Interview.tsx
│   │   │   └── ...
│   │   ├── lib/              # Utility functions and API client
│   │   ├── hooks/             # Custom React hooks
│   │   ├── types/             # TypeScript type definitions
│   │   └── App.tsx            # Main application component
│   ├── package.json          # Node.js dependencies
│   └── vite.config.ts        # Vite configuration
│
└── README.md                 # This file
```

### Key Directories

- **`backend/app/models/`**: Database models defining table structures
- **`backend/app/routes/`**: API endpoint implementations
- **`backend/app/schemas/`**: Request/response validation schemas
- **`frontend/src/pages/`**: Main application pages
- **`frontend/src/components/`**: Reusable UI components
- **`frontend/src/lib/`**: API client and utility functions
