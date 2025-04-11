import { Welcome } from '../components/Welcome';
import { LoginForm } from '../components/LoginForm';
import { SignupForm } from '../components/SignupForm';
import WaitlistForm from '../components/WaitlistForm';
import { AdminWelcomeScreen } from '../components/AdminWelcomeScreen';
import { WaitlistManager } from '../components/WaitlistManager';
import { Dashboard } from '../components/Dashboard';
import { AdminLayout } from '../components/layouts/AdminLayout';
import { useAuth } from '../contexts/AuthContext';

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
    element: <AdminLayout />,
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
      }
    ]
  },
  {
    path: '/dashboard',
    element: <Dashboard />,
    requireUser: true,
    requireAdmin: false,
    title: 'Dashboard',
    description: 'Your personal dashboard',
    breadcrumb: 'Dashboard'
  }
];