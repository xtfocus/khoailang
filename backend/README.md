# Backend

This folder contains the backend implementation for the KhoaiLang learning platform. The backend is built using FastAPI, a modern Python web framework for building APIs, with PostgreSQL as the database.

## Features

- User authentication and authorization using JWT
- Flashcard management system
- Quiz system with multiple types
- Chatbot interactions
- Multi-language support
- Admin user management
- User progress tracking

## Prerequisites

- Python 3.11+
- PostgreSQL
- Docker (recommended for deployment)

## Setup

### Local Development

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables (create .env file):
   ```env
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=password
   POSTGRES_DB=cerego
   JWT_SECRET_KEY=your-secret-key
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
   ADMIN_EMAIL=admin@example.com
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=secure_password
   ```

4. Initialize the database:
   ```bash
   python app/init_db.py
   ```

5. Run the development server:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Docker Deployment

1. Build and run using Docker Compose:
   ```bash
   docker-compose up --build
   ```

2. Initialize the database in the container:
   ```bash
   docker-compose exec backend python app/init_db.py
   ```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── database.py          # Database connection and session management
│   ├── init_db.py          # Database initialization script
│   ├── dependencies/
│   │   └── auth.py         # Authentication dependencies
│   ├── models/
│   │   ├── user.py         # User model
│   │   ├── flashcard.py    # Flashcard model
│   │   ├── quiz.py         # Quiz model
│   │   └── chat.py         # Chatbot interaction model
│   ├── routes/
│   │   └── auth.py         # Authentication endpoints
│   └── schemas/
│       └── user.py         # Pydantic schemas for user data
├── Dockerfile              # Docker configuration
├── requirements.txt        # Python dependencies
└── README.md
```

## API Documentation

When the server is running, you can access:
- Interactive API documentation (Swagger UI): http://localhost:8000/docs
- Alternative API documentation (ReDoc): http://localhost:8000/redoc

## Key Endpoints

### Authentication
- `POST /auth/signup` - Create new user account
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user profile

### Flashcards
- CRUD operations for flashcard management
- Progress tracking endpoints
- Language-specific flashcard retrieval

### Quizzes
- Multiple quiz type support
- Progress tracking
- Score management

### Admin
- User management
- System monitoring
- Content management

## Database Schema

The application uses PostgreSQL with the following main tables:
- users
- flashcards
- user_flashcards
- quiz_types
- quizzes
- chatbot_interactions
- languages

## Testing

To run tests:
```bash
pytest
```

## Contributing

1. Follow PEP 8 style guide
2. Write tests for new features
3. Update documentation as needed
4. Use type hints for better code maintainability

## Security Notes

- JWT tokens are used for authentication
- Passwords are hashed using bcrypt
- Rate limiting is implemented on authentication endpoints
- Input validation using Pydantic models