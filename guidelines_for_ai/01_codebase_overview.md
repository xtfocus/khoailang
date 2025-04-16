# Khoai Lang Codebase Documentation

## 1. Project Overview

KhoaiLang is a language learning application built with:
- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + PostgreSQL
- Deployment: Docker Compose

## 2. Development Setup

### Prerequisites
- Docker and Docker Compose
- Node.js (for local frontend development)
- Python 3.11+ (for local backend development)
- PostgreSQL client (optional)
- package requirements: `backend/requirements.txt` and `frontend/package.json`

### Environment Configuration
Required `.env` file in root directory:
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=cerego
JWT_SECRET_KEY=your-super-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=securepassword
```

### Starting the Application
1. Build and start services:
```bash
docker-compose up --build
```

2. Initialize database:
```bash
docker-compose exec backend python app/init_db.py
```

3. Access points:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Database Commands
```bash
# View all tables
docker-compose exec db psql -U postgres -d cerego -c '\dt'

# Check specific table
docker-compose exec db psql -U postgres -d cerego -c '\d table_name'

# Run the check_tables script
./scripts/check_tables.sh
```

## 3. Code Organization

### Frontend Structure (/frontend)
```
frontend/
├── src/
│   ├── components/           # React components
│   │   ├── layouts/         # Layout components
│   │   ├── routing/         # Route protection
│   │   └── ImportWords/     # Feature-specific components
│   ├── contexts/            # React contexts (auth, etc.)
│   ├── config/              # Configuration (routes, axios)
│   ├── hooks/              # Custom React hooks
│   └── types/              # TypeScript definitions
```

### Backend Structure (/backend)
```
backend/
├── app/
│   ├── models/             # SQLAlchemy models
│   ├── routes/            # API endpoints
│   ├── schemas/           # Pydantic schemas
│   └── dependencies/      # Shared dependencies
```

## 4. Authentication System

### Flow
1. User login/signup through `/auth` endpoints
2. JWT token issued upon successful authentication
3. Token stored in localStorage
4. AuthContext manages global auth state
5. ProtectedRoute component handles route protection

### User Types
1. Public (unauthenticated)
2. Regular User
3. Admin User

## 5. Frontend Routes

### Public Routes
- `/` - Welcome page
- `/login` - Login form
- `/signup` - Signup form
- `/waitlist` - Waitlist registration

### User Routes
- `/dashboard` - User's main dashboard
- `/profile` - User profile
- `/flashcards` - Flashcard management
- `/catalogs/*` - Catalog management
- `/import` - Word import interface

### Admin Routes
- `/admin` - Admin dashboard
- `/admin/waitlist` - Waitlist management
- `/admin/users` - User management
- `/admin/profile` - Admin profile

## 6. Key Features

### Flashcard Management
- Create/import flashcards
- Share flashcards with other users
- View and filter flashcards
- Organize into catalogs

### User Management (Admin)
- View all users
- Delete non-admin users
- Manage waitlist
- Approve/reject waitlist entries

### Learning System
- Memory strength tracking
- Quiz generation
- Spaced repetition system
- Progress tracking

## 7. Code Style Guide

### TypeScript/React
- Use TypeScript for strict type safety
- Function components with hooks
- Props interfaces defined for components
- Use const assertions for literal types
- Prefer controlled components for forms
- Return type annotations on component functions
- Proper type handling for async/error states

### CSS/Styling
- Tailwind CSS for styling
- Mobile-first responsive design
- Use semantic class names
- Follow BEM-like methodology for custom CSS

### API Integration
- Centralized axios config with interceptors
- Type-safe error handling with AxiosError
- Consistent error message formatting
- Event-driven notification system
- Type-safe custom events

### Error Handling
- Consistent error propagation pattern 
- Type-safe error handling with AxiosError
- Graceful degradation in UI
- User-friendly error messages
- Centralized error state management

### Event System
- Strongly typed custom events
- Centralized event type definitions
- Event-driven notification system
- Type-safe event handlers
- Proper event cleanup in components

## 8. Common Patterns

### Custom Events
- wordImportSuccess
- flashcardShareSuccess
- catalogCreated
- app-logout

### API Error Handling
```typescript
try {
  const response = await axios.post('/api/endpoint');
  // Handle success
} catch (err) {
  const error = err as AxiosError<ApiError>;
  if (error.response?.data?.detail) {
    setError(String(error.response.data.detail));
  } else {
    setError('Generic error message');
  }
}
```

### Component Error States
- Loading state handling
- Error message display
- Fallback UI components
- Error boundaries for crashes

## 9. Database Schema Overview

Key tables:
- users
- flashcards
- user_flashcards
- catalogs
- quiz_types
- quizzes
- languages
- user_settings
- waitlist

Use `check_tables.sh` script to view current schema and relationships.