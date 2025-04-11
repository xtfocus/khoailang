# Authentication and Authorization in Khoai Lang

## Overview

This document explains the authentication and authorization system implemented in the Khoai Lang application. The system uses modern security practices including JWT (JSON Web Tokens), password hashing, and role-based access control.

## Core Security Components

### 1. Password Security
Located in `backend/app/dependencies/auth.py`:
- Uses `passlib` with `bcrypt` for secure password hashing
- Passwords are never stored in plain text
- Password verification is handled through secure comparison

```python
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
```

About salt:
- https://cyberhoot.com/cybrary/password-salting/
- https://crypto.stackexchange.com/questions/14421/if-attacker-knows-salt-and-hash-how-is-salt-effective
- https://library.mosse-institute.com/articles/2023/07/key-stretching-and-saltingm.html

### 2. JWT Authentication
Configuration (`backend/app/dependencies/auth.py`):
```python
SECRET_KEY = "your-secret-key-keep-it-secret"  # Changed in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
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

### 1. User Registration (Signup)
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

### 2. User Login
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

### 3. Protected Routes
All protected endpoints use the `get_current_user` dependency:
- Extracts token from Authorization header
- Validates token signature and expiration
- Retrieves current user from database
- Raises 401 Unauthorized if invalid

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
   - No plain text password storage
   - Password strength validation (to be implemented)

2. **Token Security**:
   - Short-lived access tokens (30 minutes)
   - Secure token generation and validation
   - Token-based session management

3. **Error Handling**:
   - Generic error messages for security
   - No sensitive information in responses
   - Proper HTTP status codes

4. **Database Security**:
   - Prepared statements via SQLAlchemy
   - Input validation using Pydantic
   - Secure password storage

## Initial Setup

The system automatically creates an admin user during database initialization (`backend/app/init_db.py`):
```python
admin_user = User(
    email="admin@example.com",
    username="admin",
    hashed_password=get_password_hash("admin123"),
    is_admin=True
)
```

**Note**: Change these default credentials in production!

## Future Security Enhancements

1. **Rate Limiting**:
   - Implement request rate limiting
   - Prevent brute force attacks
   - Add API usage monitoring

2. **Refresh Tokens**:
   - Add refresh token support
   - Implement token rotation
   - Enhance session management

3. **Password Security**:
   - Add password strength requirements
   - Implement password reset flow
   - Add two-factor authentication

4. **Audit Logging**:
   - Log security events
   - Track user actions
   - Monitor suspicious activities

## File References

Key security-related files:
- `backend/app/dependencies/auth.py`: Core authentication logic
- `backend/app/models/user.py`: User model with role definition
- `backend/app/routes/auth.py`: Authentication endpoints
- `backend/app/schemas/user.py`: Request/response models
- `backend/app/init_db.py`: Initial admin user setup