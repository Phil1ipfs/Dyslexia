# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LITEREXIA is a dyslexia assessment and intervention platform built with React and Node.js/Express. The application serves teachers, parents, and administrators with tools for assessing, monitoring, and supporting students with dyslexia.

## Architecture

### Frontend (`/frontend`)
- **Framework**: React 19.1.0 with Vite build system
- **UI Libraries**: React Bootstrap, FontAwesome, Radix UI components
- **Routing**: React Router DOM 7.4.1
- **Charts**: Recharts for data visualization
- **State Management**: Context API (AuthContext, ChatbotContexts)
- **Key Features**: 
  - Teacher dashboard and assessment tools
  - Parent portal for child progress monitoring
  - Admin panel for system management
  - Responsive design with Bootstrap

### Backend (`/backend`)
- **Framework**: Express.js 4.21.2
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: AWS S3 integration for images/documents
- **AI Integration**: OpenAI API for chatbot functionality
- **Email**: Nodemailer for notifications
- **Multi-database**: Uses separate MongoDB databases (test, teachers, parent, users_web)

### Database Structure
- `users_web` - User authentication and roles
- `teachers` - Teacher profiles and data
- `parent` - Parent profiles and data
- `test` - Student data and assessment results

## Development Commands

### Frontend Development
```bash
cd frontend
npm run dev          # Start development server (Vite)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend Development
```bash
cd backend
npm run dev          # Start with nodemon (auto-reload)
npm start           # Start production server
npm run init-iep    # Initialize IEP system
```

### Root Level
The root `package.json` contains minimal dependencies (axios, form-data, react-toastify) for shared utilities.

## Key Configuration

### Frontend (Vite)
- **Dev Server**: http://localhost:5173 (proxies /api to backend)
- **API Proxy**: All `/api` requests forwarded to http://localhost:5001
- **Build Output**: `dist/` directory
- **Assets**: Custom fonts (Atkinson Hyperlegible) for dyslexia accessibility

### Backend (Express)
- **Server Port**: 5001 (configurable via PORT env var)
- **CORS**: Configured for multiple frontend origins including localhost:5173
- **File Uploads**: 50MB limit for large file handling
- **Database**: MongoDB connection with timeout settings
- **S3 Integration**: AWS SDK v3 for file storage

## Environment Variables

### Required Backend Variables
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing key
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` - S3 configuration
- `AWS_BUCKET_NAME` - S3 bucket name
- `FRONTEND_URL` - Frontend URL for CORS

## Key Directories

### Frontend Structure
- `src/components/` - Reusable UI components organized by domain (Admin, TeacherPage, ParentPage, Homepage)
- `src/pages/` - Page components for routing
- `src/services/` - API service layers for backend communication
- `src/contexts/` - React context providers
- `src/assets/` - Static assets including accessibility fonts

### Backend Structure
- `controllers/` - Route handlers organized by domain
- `models/` - Mongoose schema definitions
- `routes/` - Express route definitions
- `services/` - Business logic and external integrations
- `middleware/` - Express middlewares for auth, uploads
- `utils/` - Utility functions

## Testing

Currently no test framework is configured. The backend has a placeholder test script that exits with error.

## Special Features

### Accessibility
- Uses Atkinson Hyperlegible font specifically designed for dyslexia
- Responsive design considerations for various devices

### Multi-tenant Architecture
- Separate database collections for different user types
- Role-based access control with JWT

### File Management
- S3 integration with fallback to database storage
- Image proxy endpoint for secure S3 access
- Large file upload support (50MB limit)

### AI Integration
- OpenAI chatbot for teacher assistance
- Automated assessment analysis and recommendations

## Development Notes

- Frontend uses Vite for fast development and modern build process
- Backend implements comprehensive error handling and logging
- Database connections are established before route registration
- Multiple CORS origins supported for different development environments
- Extensive fallback data systems for development/demo purposes