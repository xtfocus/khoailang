# Local Deployment Guide

## Prerequisites
- Docker and Docker Compose installed
- Git (for version control)
- Node.js and npm (for local frontend development)
- Python 3.11+ (for local backend development)
- PostgreSQL client tools (optional, for direct database access)

## Environment Setup

1. **Clone the Repository**
```bash
git clone <repository-url>
cd cerego
```

2. **Environment Variables**
Create a `.env` file in the root directory:
```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
POSTGRES_DB=cerego

# JWT Configuration 
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Admin account for initial setup
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
```

These environment variables are used by both the backend service and the database container.

## Starting the Application

1. **Build and Start Services**
```bash
docker-compose up --build
```
This will:
- Build and start the PostgreSQL database
- Build and start the FastAPI backend
- Build and start the React frontend

2. **Initialize the Database**
In a new terminal, run:
```bash
docker-compose exec backend python app/init_db.py
```
This will:
- Create all necessary database tables
- Populate reference data (e.g., quiz types, languages)
- Create an admin user with the credentials specified in the `.env` file

Verify table creation:
```bash
docker-compose exec db psql -U postgres -d cerego -c '\dt'
```

3. **Verify Services**
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:8000](http://localhost:8000)
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)

## Database Schema Overview

The database schema includes the following key tables:
- **`users`**: Stores user accounts, including admin users.
- **`flashcards`**: Stores flashcard data (front, back, language).
- **`user_flashcards`**: Tracks user-specific progress for flashcards.
- **`quiz_types`**: Defines available quiz formats.
- **`quizzes`**: Tracks quiz attempts and results.
- **`chatbot_interactions`**: Logs user interactions with the chatbot.
- **`languages`**: Stores supported languages for flashcards and user preferences.

To check the schema of specific tables, use the script:
```bash
bash scripts/check_tables.sh
```

## API Testing

### Authentication Endpoints
Test the authentication system using curl or the Swagger UI:

1. **Create a User (Signup)**
```bash
curl -X 'POST' \
  'http://localhost:8000/auth/signup' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "username": "testuser",
    "password": "password123"
  }'
```

2. **Login (Using form-encoded data)**
```bash
curl -X 'POST' \
  'http://localhost:8000/auth/login' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'username=test@example.com&password=password123'
```

Note: For login, use `application/x-www-form-urlencoded` format as shown above, not JSON. The username field expects an email address.

3. **Get User Profile (Protected Route)**
```bash
curl -X 'GET' \
  'http://localhost:8000/auth/me' \
  -H 'Authorization: Bearer <your-jwt-token>'
```

### Waitlist System

The application includes a waitlist system for new user registrations:

1. **Submit to Waitlist**
```bash
curl -X 'POST' \
  'http://localhost:8000/auth/waitlist' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "reason": "Interested in learning languages"
  }'
```

2. **Admin Approve Waitlist Entry**
```bash
curl -X 'POST' \
  'http://localhost:8000/auth/waitlist/{entry_id}/approve' \
  -H 'Authorization: Bearer <admin-token>'
```

## Development Workflow

### Backend Development
1. Code changes in `backend/app/` are automatically reflected due to volume mounting.
2. The `uvicorn` server auto-reloads on file changes.
3. Database migrations should be run manually inside the container.

### Frontend Development
1. Code changes in `frontend/src/` are automatically reflected.
2. The Vite dev server provides hot module replacement.
3. New dependencies require rebuilding the container.

## Troubleshooting

### Common Issues
1. **Database Connection Errors**
   - Check if the PostgreSQL container is running.
   - Verify the `DATABASE_URL` environment variable.
   - Ensure the database is initialized.

2. **Authentication Issues**
   - Verify JWT token expiration.
   - Check user credentials.
   - Ensure all required fields are provided.

3. **Container Build Issues**
   - Remove old containers and volumes.
   - Rebuild with the `--no-cache` flag.
   - Check Docker logs.

## Application Teardown

### Graceful Shutdown
1. **Stop Running Containers**
```bash
docker-compose down
```

2. **Remove Containers and Networks**
```bash
docker-compose down --remove-orphans
```

3. **Remove Volumes (Database Data)**
```bash
docker-compose down -v
```

4. **Remove All Related Docker Resources**
```bash
# Remove all stopped containers
docker rm $(docker ps -a -q)

# Remove all volumes
docker volume rm $(docker volume ls -q)

# Remove all images (optional)
docker rmi $(docker images -q)
```

5. **Clean Local Development Files (Optional)**
```bash
# Remove Python cache files
find . -type d -name "__pycache__" -exec rm -r {} +

# Remove Node modules (if working locally)
rm -rf frontend/node_modules

# Remove environment files (if they contain sensitive data)
rm .env
```

### Data Backup (Before Teardown)
If you need to preserve data:

1. **Backup Database**
```bash
docker-compose exec db pg_dump -U postgres cerego > backup.sql
```

2. **Restore Database (After New Setup)**
```bash
cat backup.sql | docker-compose exec -T db psql -U postgres -d cerego
```

## Security Notes
- Default credentials in `.env` are for development only.
- JWT secret key should be changed in production.
- Database passwords should be strong in production.
- Consider implementing rate limiting for authentication endpoints.
- Enable HTTPS in production.

## Monitoring
- Check container logs: `docker-compose logs -f [service_name]`
- Database status: `docker-compose exec db psql -U postgres -d cerego -c '\dt'`
- API status: [http://localhost:8000/docs](http://localhost:8000/docs)
