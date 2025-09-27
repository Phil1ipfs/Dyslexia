# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LITEREXIA is a literacy application designed for dyslexic students, featuring adaptive assessments and educational activities. The application supports three user roles: Teachers, Parents, and Admins.

## Architecture

- **Frontend**: React application built with Vite, using React Router for navigation
- **Backend**: Node.js/Express API server with MongoDB database
- **Database**: MongoDB with Mongoose ODM
- **Styling**: CSS modules organized by page/component type

### Key Directory Structure

```
├── frontend/
│   ├── src/
│   │   ├── pages/           # Main application pages
│   │   │   ├── Teachers/    # Teacher-specific pages
│   │   │   └── Parents/     # Parent-specific pages
│   │   ├── components/      # Reusable UI components
│   │   ├── widgets/         # Layout components (TeacherPage, ParentPage, AdminPage)
│   │   └── css/            # Organized stylesheets by feature
├── backend/
│   ├── models/             # Mongoose database schemas
│   ├── routes/             # API route handlers
│   ├── controllers/        # Business logic
│   └── config/             # Database configuration
```

## Common Development Commands

### Frontend (React/Vite)
```bash
cd frontend
npm start           # Start development server with Vite
npm run build       # Build for production
npm test           # Run tests with React Testing Library
```

### Backend (Node.js/Express)
```bash
cd backend
npm run dev        # Start development server with nodemon
```

### Full Application
Run both frontend and backend in separate terminals for full development environment.

## Database Configuration

- MongoDB connection configured in `backend/config/db.js`
- Environment variables stored in `.env` (MONGO_URI)
- Two main models: `UserModel.js` and `ProgressModel.js`

## User Authentication & Roles

The application uses localStorage-based authentication with three user types:
- **teacher**: Access to student management, activity creation, progress tracking
- **parent**: Access to child's progress and activities
- **admin**: System administration features

Authentication state managed in `App.jsx` with role-based routing.

## Key Features & Components

### Assessment System
- Referenced in homepage but implementation details in teacher pages
- Categories include: Phonological awareness, Reading levels (A-E), Sight words
- Student progress tracking through `ProgressModel`

### Activity Categories (from StudentDetails.jsx)
- **A**: Panimulang Pagbasa (Emergent Reader) - Alpabeto at Tunog, etc.
- **B**: Maagang Yugto (Early Reader) - Sight Words, etc.
- **C**: Nagpapaunlad na Yugto (Developing Reader) - Pangunahing Ideya, etc.
- **D**: Malayang Pagbasa (Fluent Reader) - Paglalagom, etc.
- **E**: Mahusay na Mambabasa (Proficient Reader) - Kritikal na Pagsusuri, etc.

## Code Conventions

- React functional components with hooks
- CSS modules with component-specific stylesheets
- ES6+ JavaScript with module imports/exports
- Mongoose schemas with proper validation
- Express routes with async/await error handling

## Known Issues & Context

Based on user instructions: There are specific issues with pre-assessment phonological data, UI, and logic flow that need fixing. The main assessment phonological category screen works correctly - issues are isolated to pre_assessment functionality.

## Development Notes

- Vite configuration supports JSX files with `.jsx` extension
- React Router v7 used for navigation
- Recharts library for data visualization in teacher dashboards
- Lucide React for icons
- MongoDB Atlas cloud database connection