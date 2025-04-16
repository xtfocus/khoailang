# Frontend Architecture Documentation

## Component Hierarchy and Data Flow

### Authentication Flow
```
AuthProvider (contexts/AuthContext.tsx)
└─ Handles global auth state
   └─ ProtectedRoute (components/routing/ProtectedRoute.tsx)
      └─ Routes based on auth state and user role

State: token, isAdmin, userProfile
Events: login, logout, app-logout
```

### Core User Flows

#### Public Flow
```
Welcome
├─ LoginForm
│  └─ Redirects to Dashboard/Admin based on role
└─ WaitlistForm
   └─ Submits registration for admin approval
```

#### User Dashboard Flow
```
Dashboard
├─ DashboardCard (stats display)
├─ FlashcardTable
│  ├─ ShareModal (flashcard sharing)
│  └─ Filters/Selection
└─ ImportWords
   ├─ ImportOptions
   ├─ TextFileUpload
   └─ Preview/Confirmation
```

#### Admin Flow
```
AdminLayout
├─ AdminWelcomeScreen
├─ WaitlistManager
│  └─ Approval/Rejection actions
└─ UserManager
   └─ User deletion/management
```

## Component Interaction

### Button Actions and API Endpoints

1. **Dashboard Actions**
   - "Create Catalog" → `/catalogs/create`
   - "Import Words" → `/import`
   - Stats Cards → Fetch from `/api/flashcards/stats`

2. **Flashcard Management**
   - Share → POST `/api/flashcards/share`
   - Delete → DELETE `/api/flashcards/{id}`
   - Filter → GET `/api/flashcards/all` with query params

3. **Admin Actions**
   - Approve Waitlist → POST `/auth/waitlist/{id}/approve`
   - Delete User → DELETE `/auth/users/{id}`
   - View Users → GET `/auth/users`

### State Management

1. **Global State (AuthContext)**
   ```typescript
   interface AuthContextType {
     token: string | null;
     isAdmin: boolean | null;
     userProfile: UserProfile | null;
     login: (token: string) => Promise<void>;
     logout: () => void;
   }
   ```

2. **Component-Level State**
   - Form states use controlled components
   - Lists/tables use local state with pagination
   - Modals control visibility through local state

3. **Event Handling**
   - Custom events for notifications
   - Window events for auth state changes
   - Form submissions with validation

## Route Protection and Access Control

### Route Configuration
```typescript
interface RouteConfig {
  path?: string;
  element?: React.ReactElement;
  requireAdmin?: boolean;
  requireUser?: boolean;
  public?: boolean;
  title: string;
  description?: string;
  breadcrumb?: string;
  children?: RouteConfig[];
  index?: boolean;
}
```

### Access Rules
1. Public routes: No auth required
2. User routes: Valid token required
3. Admin routes: Valid token + isAdmin required
4. Nested routes: Inherit parent requirements

### Redirect Logic
- Unauthenticated → /login
- Non-admin accessing admin routes → /dashboard
- Admin accessing user routes → /admin
- Invalid routes → 404 page