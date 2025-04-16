# **Backend System Design**

## **Overview**
The backend system is built using FastAPI and PostgreSQL, following a modular architecture with clear separation of concerns. The system implements user authentication with JWT tokens, waitlist-based registration, and is designed to be scalable for future features.

## **Technology Stack**
- **Framework**: FastAPI
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Bcrypt
- **Container Platform**: Docker

## **Project Structure**
```
backend/
├── app/
│   ├── database.py          # Database configuration and session management
│   ├── init_db.py          # Production database initialization
│   ├── init_db2.py         # Development/testing data initialization
│   ├── main.py             # Application entry point
│   ├── dependencies/       # Reusable dependencies
│   │   └── auth.py        # Authentication utilities
│   ├── models/            # SQLAlchemy models
│   │   ├── user.py        # User model
│   │   ├── flashcard.py   # Flashcard model
│   │   ├── catalog.py     # Catalog model
│   │   ├── quiz.py        # Quiz and QuizType models
│   │   ├── sharing.py     # Sharing models
│   │   ├── waitlist.py    # Waitlist model
│   │   └── user_settings.py # User settings model
│   ├── routes/            # API endpoints
│   │   ├── auth.py        # Authentication routes
│   │   ├── flashcards.py  # Flashcard management
│   │   ├── catalogs.py    # Catalog management
│   │   └── quizzes.py     # Quiz system routes
│   └── schemas/           # Pydantic models
```

## **Key Components**

### **1. Database Configuration (database.py)**
- Manages database connection using SQLAlchemy
- Provides session management
- Configurable through environment variables
- Handles connection pooling and timeouts

### **2. Authentication System (dependencies/auth.py)**
- JWT-based authentication with environment-based configuration:
  ```python
  SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development-secret-key-please-change")
  ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
  ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
  ```
- Password hashing using bcrypt with secure salt generation
- Token generation, validation, and optional user authentication
- User role-based access control

### **3. Models**
#### User Model (models/user.py)
```python
class User:
    id: Integer
    email: String (unique)
    username: String (unique)
    hashed_password: String
    is_admin: Boolean
    created_at: DateTime
    updated_at: DateTime
```

#### Flashcard Model (models/flashcard.py)
```python
class Flashcard:
    id: Integer
    front: Text
    back: Text
    language_id: Integer (FK)
    owner_id: Integer (FK)
```

#### Catalog Model (models/catalog.py)
```python
class Catalog:
    id: Integer
    name: String
    description: Text
    visibility: String
    owner_id: Integer (FK)
```

### **4. Learning System**
#### Quiz System
- Multiple quiz types with difficulty levels
- Progress tracking and scoring
- Spaced repetition scheduling
- Memory strength calculation

#### User Progress Tracking
- Tracks individual flashcard progress
- Memory strength scoring (0-100)
- Review scheduling
- Success streak tracking

### **5. API Routes**
#### Authentication Routes (routes/auth.py)
- User registration with waitlist system
- JWT-based authentication
- Role-based access control
- User profile management

#### Flashcard Routes (routes/flashcards.py)
- CRUD operations for flashcards
- Sharing functionality
- Progress tracking
- Duplicate detection
- Language-specific operations

#### Catalog Routes (routes/catalogs.py)
- Create/manage flashcard collections
- Public/private visibility
- Sharing functionality
- Word uniqueness enforcement within catalogs
- Language-specific catalog management

#### Quiz Routes (routes/quizzes.py)
- Quiz generation and scoring
- Progress tracking
- Multiple quiz type support
- Adaptive difficulty based on user performance

## **Security Features**
1. **Password Security**
   - Bcrypt hashing with automatic salt generation
   - Secure password verification
   - No plain text password storage
   
2. **JWT Authentication**
   - Environment-based configuration
   - 30-minute token expiration
   - Bearer token authentication
   - Optional authentication support

3. **Input Validation**
   - Pydantic schema validation
   - Email format verification
   - Username uniqueness check
   - Password requirements enforcement

4. **Database Security**
   - Prepared statements via SQLAlchemy
   - Input sanitization
   - Protected credentials
   - Foreign key constraints

## **Environment Variables**
```env
DATABASE_URL=postgresql://postgres:password@db:5432/cerego
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=secure_password
```

## **Docker Integration**
The backend service is containerized with:
- Python base image
- PostgreSQL database connection
- Volume mounting for development
- Hot reload support
- Environment variable configuration

## **Future Considerations**
1. **Rate Limiting**
   - Implement request rate limiting
   - Add API usage monitoring
   - DDoS protection

2. **Refresh Tokens**
   - Add refresh token support
   - Implement token rotation
   - Session management

3. **Password Security**
   - Password strength requirements
   - Account lockout after failed attempts
   - Password reset functionality

4. **Learning System**
   - Advanced quiz generation algorithms
   - Machine learning for difficulty adjustment
   - Enhanced spaced repetition system

5. **Logging and Monitoring**
   - Structured logging
   - Performance monitoring
   - User activity tracking
   - Audit trails

## **API Documentation**
The API documentation is automatically generated by FastAPI and available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`