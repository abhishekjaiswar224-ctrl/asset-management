import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthstore } from '../utils/authStore';

const ProtectedRoute = ({ isAuthenticated }) => {
  const { ischeckingAuth } = useAuthstore();

  // Show loading state while checking authentication
  if (ischeckingAuth) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render child routes if authenticated
  return <Outlet />;
};

export default ProtectedRoute;
