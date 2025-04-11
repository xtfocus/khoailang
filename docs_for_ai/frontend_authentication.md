# Frontend Authentication Documentation

## 1. User Flows

### 1.1 Public User Flow
1. **Landing Page** (`/`)
   - Welcome screen with two options:
     - Login (→ `/login`)
     - Join Waitlist (→ `/waitlist`) 
   - No authentication required
   - Styled hero section with app description

2. **Waitlist Flow** (`/waitlist`)
   - Form to submit waitlist entry
   - Collects: name, email, password, reason (optional)
   - Success message after submission
   - Option to check waitlist status later

3. **Login Flow** (`/login`)
   - Standard login form
   - Requires email and password
   - Error handling for invalid credentials
   - Redirects based on user role:
     - Admin → `/admin`
     - Regular User → `/dashboard`

### 1.2 Admin User Flow
1. **Admin Dashboard** (`/admin`)
   - Landing page after admin login
   - Three main sections:
     - Manage Waitlist
     - Manage Users
     - View Profile

2. **Waitlist Management** (`/admin/waitlist`)
   - Table view of all waitlist entries
   - Actions per entry:
     - Approve (creates user account)
     - Delete
   - Shows entry details:
     - Name, Email, Reason
     - Submission Date
     - Status (Pending/Approved)

3. **User Management** (`/admin/users`)
   - Table view of all users
   - Actions:
     - Delete (non-admin users only)
   - Shows user details:
     - Username/Email
     - Role (Admin/User)
     - Creation Date

### 1.3 Regular User Flow
1. **User Dashboard** (`/dashboard`)
   - Personal dashboard after login
   - Shows user stats and learning progress
   - Navigation to learning features

## 2. Implementation Details

### 2.1 Authentication Context
```tsx
// AuthContext manages global auth state
interface AuthContextType {
  token: string | null;
  isAdmin: boolean | null;
  userProfile: UserProfile | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
}
```

### 2.2 Route Protection
```tsx
// ProtectedRoute component handles auth-based routing
interface ProtectedRouteProps {
  element?: React.ReactElement;
  requireAdmin?: boolean;
  requireUser?: boolean;
  isLayout?: boolean;
}
```

### 2.3 Key Components

1. **LoginForm**
   - Handles credentials validation
   - Manages login state
   - Redirects based on user role

2. **WaitlistForm**
   - Collects user registration data
   - Handles form validation
   - Shows success/error states

3. **AdminLayout**
   - Wrapper for admin pages
   - Consistent navigation
   - Role-based access control

## 3. Backend Integration

### 3.1 Authentication Endpoints

| Frontend Form | Backend Endpoint | Method | Purpose |
|--------------|------------------|--------|----------|
| LoginForm | `/auth/login` | POST | User authentication |
| WaitlistForm | `/auth/waitlist` | POST | Submit waitlist entry |
| WaitlistManager | `/auth/waitlist` | GET | Fetch waitlist entries |
| WaitlistManager | `/auth/waitlist/{id}/approve` | POST | Approve entry |
| UserManager | `/auth/users` | GET | Fetch all users |
| UserManager | `/auth/users/{id}` | DELETE | Remove user |

### 3.2 API Response Handling

1. **Login Response**
```typescript
interface LoginResponse {
  access_token: string;
  token_type: string;
}
```

2. **User Profile Response**
```typescript
interface UserProfile {
  email: string;
  username: string | null;
  is_admin: boolean;
}
```

3. **Waitlist Entry Response**
```typescript
interface WaitlistEntry {
  id: number;
  email: string;
  name: string;
  reason: string | null;
  approved: boolean;
  created_at: string;
}
```

### 3.3 Error Handling
- Invalid credentials: 401 Unauthorized
- Permission denied: 403 Forbidden
- Resource not found: 404 Not Found
- Validation errors: 422 Unprocessable Entity

## 4. Technical Implementation

### 4.1 Authentication Storage
- JWT token stored in localStorage
- User profile cached in AuthContext
- Token included in Authorization header

### 4.2 Route Configuration
```tsx
const routes = [
  {
    path: '/admin',
    requireAdmin: true,
    element: <AdminLayout />
  },
  {
    path: '/dashboard',
    requireUser: true,
    element: <Dashboard />
  }
];
```

### 4.3 Form Validation
- Client-side validation using controlled components
- Server-side validation through API responses
- Error messages displayed inline

## Appendix A: Component Directory Structure

```
frontend/src/
├── components/
│   ├── layouts/
│   │   └── AdminLayout.tsx
│   ├── routing/
│   │   └── ProtectedRoute.tsx
│   ├── LoginForm.tsx
│   ├── WaitlistForm.tsx
│   ├── WaitlistManager.tsx
│   └── UserManager.tsx
├── contexts/
│   └── AuthContext.tsx
└── config/
    └── routes.tsx
```

## Appendix B: Authentication Flow Sequence

1. User submits login form
2. Frontend sends credentials to `/auth/login`
3. Backend validates and returns JWT
4. Frontend stores token and fetches user profile
5. AuthContext updates global state
6. User redirected based on role