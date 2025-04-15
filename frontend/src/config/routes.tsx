import { Welcome } from '../components/Welcome';
import { LoginForm } from '../components/LoginForm';
import { SignupForm } from '../components/SignupForm';
import WaitlistForm from '../components/WaitlistForm';
import { AdminWelcomeScreen } from '../components/AdminWelcomeScreen';
import { WaitlistManager } from '../components/WaitlistManager';
import { UserManager } from '../components/UserManager';
import { Dashboard } from '../components/Dashboard';
import { AdminLayout } from '../components/layouts/AdminLayout';
import { UserProfile } from '../components/UserProfile';
import { ProtectedRoute } from '../components/routing/ProtectedRoute';
import { createBrowserRouter } from 'react-router-dom';
import ImportWords from '../components/ImportWords/ImportWords';
import { FlashcardTable } from '../components/FlashcardTable';

export interface RouteConfig {
  path: string;
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

export const routes: RouteConfig[] = [
  {
    path: '/',
    element: <Welcome />,
    public: true,
    title: 'Welcome',
    description: 'Welcome to Cerego'
  },
  {
    path: '/login',
    element: <LoginForm />,
    public: true,
    title: 'Login',
    description: 'Sign in to your account'
  },
  {
    path: '/signup',
    element: <SignupForm />,
    public: true,
    title: 'Sign Up',
    description: 'Create a new account'
  },
  {
    path: '/waitlist',
    element: <WaitlistForm />,
    public: true,
    title: 'Join Waitlist',
    description: 'Sign up for early access'
  },
  {
    path: '/admin',
    element: <ProtectedRoute element={<AdminLayout />} requireAdmin isLayout />,
    requireAdmin: true,
    requireUser: false,
    title: 'Admin',
    description: 'Admin section',
    breadcrumb: 'Admin',
    children: [
      {
        index: true,
        element: <AdminWelcomeScreen />,
        title: 'Admin Dashboard',
        description: 'Admin control panel',
        breadcrumb: 'Admin'
      },
      {
        path: 'waitlist',
        element: <WaitlistManager />,
        title: 'Waitlist Management',
        description: 'Manage waitlist applications',
        breadcrumb: 'Admin > Waitlist'
      },
      {
        path: 'users',
        element: <UserManager />,
        title: 'User Management',
        description: 'Manage system users',
        breadcrumb: 'Admin > Users'
      },
      {
        path: 'profile',
        element: <UserProfile />,
        title: 'Admin Profile',
        description: 'Admin profile page',
        breadcrumb: 'Admin > Profile'
      }
    ]
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute element={<Dashboard />} requireUser />,
    requireUser: true,
    requireAdmin: false,
    title: 'Dashboard',
    description: 'Your personal dashboard',
    breadcrumb: 'Dashboard'
  },
  {
    path: '/import',
    element: <ProtectedRoute element={<ImportWords />} requireUser />,
    requireUser: true,
    requireAdmin: false,
    title: 'Import Words',
    description: 'Import words to create flashcards',
    breadcrumb: 'Import Words'
  },
  {
    path: '/flashcards',
    element: <ProtectedRoute element={<FlashcardTable />} requireUser />,
    requireUser: true,
    requireAdmin: false,
    title: 'View Flashcards',
    description: 'View and manage your flashcards',
    breadcrumb: 'Flashcards'
  },
  {
    path: '/profile',
    element: <ProtectedRoute element={<UserProfile />} requireUser />,
    requireUser: true,
    requireAdmin: false,
    title: 'Profile',
    description: 'Your profile page',
    breadcrumb: 'Profile'
  }
];

export const router = createBrowserRouter(routes);
