import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from './Navigation';
import { Header } from './Header';
import { LoginForm } from './LoginForm';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="flex">
        <Navigation />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};