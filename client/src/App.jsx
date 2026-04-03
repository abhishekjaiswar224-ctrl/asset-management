import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { useAuthstore } from './utils/authStore';
import ProtectedRoute from './components/ProtectedRoute';

// Lazy load components for performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Signup = lazy(() => import('./components/Signup'));
const Login = lazy(() => import('./components/Login'));
const ForgotPassword = lazy(() => import('./components/ForgotPassword'));
const PublicEmployeeView = lazy(() => import('./components/public/PublicEmployeeView'));
const AdminAccountCreation = lazy(() => import('./components/AdminAccountCreation'));

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-700"></div>
    <span className="ml-3 text-lg text-purple-700">Loading...</span>
  </div>
);

function App() {
  // Use the enhanced auth store with proper naming
  const { ischeckingAuth, isAuthenticated, authCheck, user } = useAuthstore();

  // Check authentication status when app loads
  useEffect(() => {
    authCheck();
  }, [authCheck]);

  if (ischeckingAuth) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            {/* Public routes accessible to non-authenticated users */}
            <Route 
              path="/login" 
              element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} 
            />
            <Route 
              path="/signup" 
              element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" replace />} 
            />
            <Route 
              path="/forgot-password" 
              element={!isAuthenticated ? <ForgotPassword /> : <Navigate to="/dashboard" replace />} 
            />
            
            {/* Public employee information view route */}
            <Route path="/public/employee/:token" element={<PublicEmployeeView />} />
            
            {/* Protected routes requiring authentication */}
            <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
              {/* Admin-only route for creating employee accounts */}
              <Route 
                path="/admin/create-account" 
                element={
                  user?.role === 'admin' ? <AdminAccountCreation /> : <Navigate to="/dashboard" replace />
                } 
              />
              
              {/* All dashboard routes are handled by the Dashboard component */}
              <Route path="/dashboard/*" element={<Dashboard />} />
            </Route>
            
            {/* Default route */}
            <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </div>
      <ToastContainer />
    </BrowserRouter>
  );
}

export default App;
