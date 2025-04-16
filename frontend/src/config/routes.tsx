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
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ImportWords from '../components/ImportWords/ImportWords';
import { FlashcardTable } from '../components/FlashcardTable';
import { CreateCatalog } from '../components/CreateCatalog';
import { CatalogList } from '../components/CatalogList';
import { CatalogDetail } from '../components/CatalogDetail';

export interface RouteConfig {
  path?: string; // Make path optional since index routes don't need it
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
    element: <SignupForm onSignup={() => window.location.href = '/login'} />,
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
  },
  {
    path: '/catalogs',
    element: <ProtectedRoute element={<Navigate to="/catalogs/list" replace />} requireUser />,
    requireUser: true,
    requireAdmin: false,
    title: 'Catalogs',
    description: 'View and manage your catalogs',
    breadcrumb: 'Catalogs'
  },
  {
    path: '/catalogs/list',
    element: <ProtectedRoute element={<CatalogList />} requireUser />,
    requireUser: true,
    requireAdmin: false,
    title: 'Your Catalogs',
    description: 'View your flashcard catalogs',
    breadcrumb: 'Your Catalogs'
  },
  {
    path: '/catalogs/create',
    element: <ProtectedRoute element={<CreateCatalog />} requireUser />,
    requireUser: true,
    requireAdmin: false,
    title: 'Create Catalog',
    description: 'Create a new flashcard catalog',
    breadcrumb: 'Create Catalog'
  },
  {
    path: '/catalogs/:id',
    element: <ProtectedRoute element={<CatalogDetail />} requireUser />,
    requireUser: true,
    requireAdmin: false,
    title: 'Catalog Details',
    description: 'View and manage catalog details',
    breadcrumb: 'Catalog Details'
  }
];

export const router = createBrowserRouter(routes);
