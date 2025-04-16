# Authentication and Authorization in Khoai Lang

## Overview

This document explains the authentication and authorization system implemented in the Khoai Lang application. The system uses modern security practices including JWT (JSON Web Tokens), password hashing, and role-based access control.

## Core Security Components

### 1. Password Security
Located in `backend/app/dependencies/auth.py`:
- Uses `bcrypt` directly for secure password hashing and verification
- Passwords are never stored in plain text
- Password verification is handled through secure comparison using bcrypt's checkpw

```python
# Example password hashing
pwd_bytes = password.encode('utf-8')
salt = bcrypt.gensalt()
hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)

# Example password verification
def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_byte_enc, hashed_password_bytes)
```

About salt:
- https://cyberhoot.com/cybrary/password-salting/
- https://crypto.stackexchange.com/questions/14421/if-attacker-knows-salt-and-hash-how-is-salt-effective
- https://library.mosse-institute.com/articles/2023/07/key-stretching-and-saltingm.html

### 2. JWT Authentication
Configuration (`backend/app/dependencies/auth.py`):
```python
# Load configuration from environment variables with defaults
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "development-secret-key-please-change")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
```

Token Structure:
- Payload contains user email as subject ("sub")
- Includes expiration time ("exp")
- Signed using HS256 algorithm

### 3. Role-Based Access Control (RBAC)
Implemented in the User model (`backend/app/models/user.py`):
- Boolean flag `is_admin` to distinguish admin users
- Default value is false for regular users
- Only existing admins can create new admin users

## Authentication Flow

### 1. Waitlist Registration
Endpoint: `POST /auth/waitlist`

Process:
1. User submits waitlist entry with email, name, and optional reason
2. Entry is stored in waitlist table with pending status
3. Admin reviews and approves/rejects entries
4. Upon approval, user can complete registration

### 2. User Registration (Signup)
Endpoint: `POST /auth/signup`

Process:
1. Validates unique email and username
2. Hashes password using bcrypt
3. Creates user record in database
4. Returns user information (excluding password)

Security checks:
- Email format validation (using Pydantic EmailStr)
- Username uniqueness check
- Password is never returned or logged

### 3. User Login
Endpoint: `POST /auth/login`

Process:
1. Verifies user credentials
2. Generates JWT token if valid
3. Returns token with bearer type

Example response:
```json
{
    "access_token": "eyJ0eXAiOiJKV...",
    "token_type": "bearer"
}
```

### 4. Protected Routes
All protected endpoints use the `get_current_user` dependency:
- Extracts token from Authorization header
- Validates token signature and expiration
- Retrieves current user from database
- Raises 401 Unauthorized if invalid

For endpoints that can work with or without authentication, use `get_current_user_optional`:
```python
@router.post("/signup")
def signup(user: UserCreate, current_user: User | None = Depends(get_current_user_optional)):
    # Function can handle both authenticated and unauthenticated requests
    # current_user will be None if no valid token is provided
```

Example protected route:
```python
@router.get("/me")
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user
```

## Authorization System

### 1. Admin Privileges
Admins have access to:
- User management endpoints
- System configuration
- User listing and removal

Admin-only endpoints are protected with role checks:
```python
if not current_user.is_admin:
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Only admins can perform this action"
    )
```

### 2. Admin Features
Located in `backend/app/routes/auth.py`:

1. **Create Admin Users**:
   - Only existing admins can create new admin accounts
   - Requires admin token in Authorization header

2. **List All Users**:
   - Endpoint: `GET /auth/users`
   - Admin-only access
   - Returns list of all user accounts

3. **Remove Users**:
   - Endpoint: `DELETE /auth/users/{user_id}`
   - Admin-only access
   - Cannot remove own admin account

### 3. Regular User Capabilities
Regular users can:
- Manage their own profile
- Access learning features
- View their own data

## Security Best Practices Implemented

1. **Password Security**:
   - Secure hashing with bcrypt
   - Salt generation and secure storage
   - Hashed passwords never exposed in responses

2. **Token Security**:
   - Short-lived access tokens (30 minutes)
   - Secure token generation and validation
   - Token-based session management
   - Invalidation on logout

3. **Error Handling**:
   - Invalid credentials return 401 with "Could not validate credentials"
   - Admin-only actions return 403 with "Only admins can perform this action" 
   - Pydantic validation errors return 422 with detailed validation messages
   - Request failures return consistent error format:
   ```json
   {
       "detail": "Error message here"
   }
   ```
   - Password verification failures do not reveal whether email or password was incorrect
   - Token expiration handled gracefully with proper 401 response

4. **Database Security**:
   - Prepared statements via SQLAlchemy
   - Input validation using Pydantic
   - Secure password storage
   - Protected database credentials

## Future Security Enhancements

1. **Password Security**:
   - Implement password strength requirements
   - Add rate limiting for login attempts
   - Implement account lockout after failed attempts

2. **Frontend Security**:
   - Add CSRF protection
   - Implement secure token storage
   - Add additional XSS prevention measures
   - Implement secure session management

## Initial Setup

The system automatically creates an admin user during database initialization (`backend/app/init_db.py`). Environment variables are used to configure the admin account:

```python
# Required environment variables
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")

admin_user = User(
    email=ADMIN_EMAIL,
    username=ADMIN_USERNAME,
    hashed_password=get_password_hash(ADMIN_PASSWORD),
    is_admin=True
)
```

Required environment variables (see `.env.example`):
```env
ADMIN_EMAIL=your_admin_email@example.com
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_secure_password
```

**Note**: These credentials must be securely set via environment variables in production.

## File References

Key security-related files:
- `backend/app/dependencies/auth.py`: Core authentication logic
- `backend/app/models/user.py`: User model with role definition
- `backend/app/routes/auth.py`: Authentication endpoints
- `backend/app/schemas/user.py`: Request/response models
- `backend/app/init_db.py`: Initial admin user setup
- `frontend/src/contexts/AuthContext.tsx`: Frontend auth state management
- `frontend/src/components/routing/ProtectedRoute.tsx`: Route protection