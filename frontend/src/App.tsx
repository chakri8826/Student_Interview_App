import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Auth from './pages/Auth';
import OAuthCallback from './pages/OAuthCallback';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Roles from './pages/Roles';
import Upload from './pages/Upload';
import Wallet from './pages/Wallet';
import Persona from './pages/Persona';
import Interview from './pages/Interview';
import Screening from './pages/Screening';
import Profile from './pages/Profile';
import ScreeningResult from './pages/ScreeningResult';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  useEffect(() => {
    const onAuthChanged = () => setIsAuthenticated(!!localStorage.getItem('access_token'));
    window.addEventListener('auth-changed', onAuthChanged);
    window.addEventListener('storage', onAuthChanged);
    return () => {
      window.removeEventListener('auth-changed', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />} />
        <Route path="/auth" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Auth />} />

        <Route path="/auth/callback" element={<OAuthCallback />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/roles"
          element={isAuthenticated ? <Roles /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/upload"
          element={isAuthenticated ? <Upload /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/wallet"
          element={isAuthenticated ? <Wallet /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/persona"
          element={isAuthenticated ? <Persona /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/profile"
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/interview"
          element={isAuthenticated ? <Interview /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/interview/:id"
          element={isAuthenticated ? <Interview /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/screening"
          element={isAuthenticated ? <Screening /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/screening/:id"
          element={isAuthenticated ? <ScreeningResult /> : <Navigate to="/login" replace />}
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
};  

export default App;